import { Request, Response } from "express";
import { Types } from "mongoose";
import logger from "../utils/logger";
import { ChatRoom } from "../models/chatRoom.model";
import { formatedError } from "../utils/formatedError";
import { Users } from "../models/user.models";
import { ChatEventEnum, STATUS_CODE } from "../config";
import { ChatMessage } from "../models/chatMessage.model";
import { emitSocketEvent } from "../socket";
// import { emitSocketEvent } from "../socket";
/*
 ** Creating a one to one chat room
 ** for  one-to-one there should be text beacuse on single chat you cannot only just create room without any message or media
 */
const createChatRoom = async (req: Request, res: Response) => {
  const { member, createdBy, text, messageType, media } = req.body;
  try {
    if (!text && !media) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "Text/Media data required for single chat" });
    }
    // vaidating member and createdBy user
    if (member === createdBy) {
      return res.status(STATUS_CODE.NOT_ACCEPTABLE).json({ success: false, message: "You cannot chat with yourself" });
    }
    // validation user
    const createrData = await Users.findOne({ _id: createdBy });
    if (!createrData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "CreatedBy user not found" });
    }

    // validating member data
    const memberData = await Users.findOne({ _id: member });
    if (!memberData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "member not found" });
    }

    // checking if chat room is already created by these two participant
    const chatRoom = await ChatRoom.findOne({
      isGroupChat: false,
      members: {
        $all: [new Types.ObjectId(member as string), new Types.ObjectId(createdBy as string)],
      },
    });
    console.log("🚀 ~ createChatRoom ~ chatRoom:", chatRoom);
    if (chatRoom) {
      return res.status(STATUS_CODE.CONFLICT_DATA).json({ success: false, message: "Chat is already created" });
    }

    // Create a one on one chat room
    const newChatRoom = await ChatRoom.create({
      isGroupChat: false,
      admins: [createdBy],
      members: [member, createdBy],
      createdBy,
    });
    console.log("🚀 ~ createChatRoom ~ newChatRoom:", newChatRoom);
    if (text || media) {
      // creaing message
      const newMessage = await ChatMessage.create({
        chatRoom: newChatRoom?._id,
        user: createdBy,
        text,
        messageType,
        media,
      });
      // update the chat's last message which could be utilized to show last message in the list item
      await ChatRoom.findByIdAndUpdate(newChatRoom?._id, { lastMessage: newMessage._id });
      // getting chat room
      const chatRoom = await ChatRoom.findById(newChatRoom?._id)
        .populate({
          path: "members",
          select: "name nickName profileImage email",
        })
        .populate({
          path: "lastMessage",
          select: "text messageType",
        });
      // UPDATE LAST MESSAGE AND UNREAD COUNT OF CONVO IN CHAT
      // const updateInbox = await updateInboxById(inboxID, {lastMessage: message});
      // const recievingUserData = await getUserDataById(receiverId);
      // CALL FUNCTION WITH USER FCM
      // sendNotificationToUser({arrayOfFcm: recievingUserData.fcmTokens,inboxId:inboxID,message:message})

      // console.log("🚀 ~ sendMessage ~ messageWithUserData:", messageWithUserData);
      // logic to emit socket event about the new group chat added to the participants
      emitSocketEvent(req, member, ChatEventEnum.NEW_CHAT_EVENT, chatRoom);
    }
    return res.status(STATUS_CODE.CREATED).json({ success: true, data: newChatRoom });
  } catch (error) {
    console.log("🚀 ~ createGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Getting user all chat rooms
 */
const getUserChatRooms = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    // getting total counts
    const totalChatRooms = await ChatRoom.countDocuments({
      members: { $elemMatch: { $eq: new Types.ObjectId(userId as string) } },
    });
    console.log("🚀 ~ getUserChatRooms ~ totalChatRooms:", totalChatRooms);
    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalChatRooms / limit);
    console.log("🚀 ~ getUserChatRooms ~ totalPages:", totalPages);
    // getting all user chat box
    const chats = await ChatRoom.find({ members: { $elemMatch: { $eq: new Types.ObjectId(userId as string) } } })
      .sort({ updatedAt: -1 })
      .populate({
        path: "members",
        select: "name nickName profileImage email",
      })
      .populate({
        path: "lastMessage",
        select: "text messageType",
      })
      .skip((page - 1) * limit)
      .limit(limit);
    console.log("🚀 ~ getUserChatRooms ~ chats:", chats);

    return res.status(200).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        items: chats,
      },
    });
  } catch (error) {
    logger.error("Error getting user inbox:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Reseting chatRoom unread count
 */
const resetUnreadCount = async (req: Request, res: Response) => {
  const { chatRoomId, memeberId } = req.params;

  try {
    // checking if roo exits or not
    const chatRoomData = await ChatRoom.findById(chatRoomId);
    if (!chatRoomData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }
    // UPDATE unread count on chat
    const updateInbox = await ChatRoom.findOneAndUpdate(
      { _id: chatRoomId, "unreadUserCount.memberId": memeberId },
      { $inc: { "unreadUserCount.$.count": 0 } },
    );

    console.log("🚀 ~ resetUnreadCount ~ updateInbox:", updateInbox);

    return res.status(200).json({ success: true, data: updateInbox });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("error resetting unread count", error);

    return res.status(400).json({ error: true, message: "Error resetting unread count" });
  }
};
/*
 ** Getting chat room by userIds
 */
const getChatByUserIds = async (req: Request, res: Response) => {
  const { firstUser, secondUser } = req.query;

  try {
    const isChatRoom = await ChatRoom.findOne({
      isGroupChat: false,
      members: {
        $all: [new Types.ObjectId(firstUser as string), new Types.ObjectId(secondUser as string)],
      },
    });
    console.log("🚀 ~ getChatByUserIds ~ updateInbox:", isChatRoom);

    return res.status(200).json({ success: true, data: isChatRoom });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("error getting inboxId by user ids", error);

    return res.status(400).json({ error: true, message: "Unable to get chat room" });
  }
};
/*
 ** Getting chat room by chatid
 */
const getChatByChatId = async (req: Request, res: Response) => {
  const chatRoomId = req.params.chatRoomId;

  try {
    // Find chat room by chat id
    const chatRoom = await ChatRoom.findById(chatRoomId);

    return res.status(200).json({ success: true, data: chatRoom });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("get chat by chat id", error);

    return res.status(400).json({ error: true, message: "Error getting inboxId" });
  }
};
/*
 ** getting chat all messages
 */
const getChatMessages = async (req: Request, res: Response) => {
  const chatRoomId = req.params.chatRoomId;
  const memberId = req.params.memberId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({
      _id: chatRoomId,
      members: { $elemMatch: { $eq: new Types.ObjectId(memberId as string) } },
    });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room  not found" });
    }
    // getting total counts
    const totalMessages = await ChatMessage.countDocuments({ chatRoom: chatRoomId });
    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalMessages / limit);
    const messages = await ChatMessage.find({ chatRoom: chatRoomId })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "name nickName profileImage email",
      })
      .skip((page - 1) * limit)
      .limit(limit);
    console.log("🚀 ~ getChatMessages ~ messages:", messages);
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        items: messages,
      },
    });
  } catch (error) {
    console.log("🚀 ~ getChatMessages ~ error:", error);
    logger.error("Error getting chatroom messages:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Deleting one to one chat
 */
const deleteChatRoom = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: false });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }

    // validating if user is room admin or not
    if (!chatRoom?.members?.includes(new Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only members are allowed to delete this chat room" });
    }

    // delete the chat even if user is not admin because it's a personal chat
    // await deleteChatRoomById(chatRoomId);
    // deleteing all  user message in that chat room
    await ChatMessage.deleteMany({ chatRoom: chatRoomId, user: memberId });

    // checking if user exits then pull that user if there is only single user so delete the while chat
    if (chatRoom?.members.length > 1) {
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        $pull: { members: memberId },
      });
    } else {
      await ChatRoom.findByIdAndDelete(chatRoomId);
    }

    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Successfully deleted" });
  } catch (error) {
    console.log("🚀 ~ deleteGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export {
  getUserChatRooms,
  resetUnreadCount,
  getChatMessages,
  getChatByUserIds,
  createChatRoom,
  deleteChatRoom,
  getChatByChatId,
};
