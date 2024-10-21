import { Request, Response } from "express";
import { Types } from "mongoose";
import logger from "../utils/logger";
import { ChatRoom } from "../models/chatRoom.model";
import { formatedError } from "../utils/formatedError";
import { Users } from "../models/user.models";
import { ChatEventEnum, STATUS_CODE } from "../config";
import { ChatMessage } from "../models/chatMessage.model";
import { emitSocketEvent } from "../socket";
import { Connections } from "../models/connection.model";
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
        .json({ success: false, message: "Text / Media data required for single chat" });
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
    // validation that user can only message to its following user only
    if (memberData?.privacyStatus === "PRIVATE") {
      // checking if there is a request regarding this account
      const connection = await Connections.findOne({
        followingId: member,
        followerId: createdBy,
        connectionStatus: "ACCEPTED",
      });
      if (!connection) {
        return res
          .status(STATUS_CODE.CONFLICT_DATA)
          .json({ success: true, message: "You can only message to you following" });
      }
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
      unreadUserCount: [
        { memberId: member, count: 0 },
        { memberId: createdBy, count: 0 },
      ],
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
      // TODO: handle it properly read/unread flow

      // updating unread count
      await ChatRoom.updateOne(
        { _id: newChatRoom?._id, "unreadUserCount.memberId": member },
        { $inc: { "unreadUserCount.$.count": 1 } },
      );
      // update the chat's last message which could be utilized to show last message in the list item
      const chatRoom = await ChatRoom.findByIdAndUpdate(
        newChatRoom?._id,
        { lastMessage: newMessage._id },
        { new: true, runValidators: true },
      )
        .populate({
          path: "members",
          select: "name nickName profileImage email",
        })
        .populate({
          path: "lastMessage",
          select: "text messageType",
        });

      // getting chat room
      // CALL FUNCTION WITH USER FCM
      // sendNotificationToUser({arrayOfFcm: recievingUserData.fcmTokens,inboxId:inboxID,message:message})

      // console.log("🚀 ~ sendMessage ~ messageWithUserData:", messageWithUserData);
      // logic to emit socket event about the new group chat added to the participants
      emitSocketEvent(req, member, ChatEventEnum.NEW_CHAT_EVENT, chatRoom);
    }
    return res.status(STATUS_CODE.CREATED).json({ success: true, data: newChatRoom });
  } catch (error) {
    console.log("🚀 ~ createGroupChat ~ error:", error);
    logger.error("Error creating chat room:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Controller for updating user online status
 */
const updateUserOnlineStatus = async (req: Request, res: Response) => {
  const memberId = req.params.memberId;
  const { onlineStatus } = req.body;

  try {
    // Update the user's online status in the database
    await Users.findByIdAndUpdate(memberId, { onlineStatus });

    // Get the list of chat rooms the user is currently a member of
    const chatRooms = await ChatRoom.find({ members: memberId });

    // Emit online status change event to all rooms the user is a member of
    chatRooms.forEach((room) => {
      emitSocketEvent(req, room._id.toString(), ChatEventEnum.USER_ONLINE_STATUS_EVENT, {
        memberId,
        chatId: room?._id,
        onlineStatus: onlineStatus === "ONLINE" ? true : false,
      });
    });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, message: "Status updated and events emitted." });
  } catch (error) {
    console.log("🚀 ~ updateUserStatus ~ error:", error);
    logger.error("Unable to update user status:", error);
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
    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalChatRooms / limit);
    // getting all user chat box
    const chats = await ChatRoom.find({ members: { $elemMatch: { $eq: new Types.ObjectId(userId as string) } } })
      .sort({ updatedAt: -1 })
      .populate({
        path: "members",
        select: "name nickName profileImage email",
      })
      .populate({
        path: "lastMessage",
        select: "text messageType createdAt",
      })
      .skip((page - 1) * limit)
      .limit(limit);

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
    logger.error("Unable to get user chat rooms:", error);
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
  const { chatRoomId, memberId } = req.params;

  try {
    // checking if roo exits or not
    const chatRoomData = await ChatRoom.findById(chatRoomId);
    if (!chatRoomData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }
    // UPDATE unread count on chat
    const updateInbox = await ChatRoom.findOneAndUpdate(
      { _id: chatRoomId, "unreadUserCount.memberId": memberId },
      { $set: { "unreadUserCount.$.count": 0 } },
      { new: true, runValidators: true, timestamps: false },
    )
      .populate({
        path: "members",
        select: "name nickName profileImage email",
      })
      .populate({
        path: "lastMessage",
        select: "text messageType",
      });

    console.log("🚀 ~ resetUnreadCount ~ updateInbox:", updateInbox);

    return res.status(200).json({ success: true, data: updateInbox });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Unable to reset unread count", error);

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
    logger.error("unable to get chat by user ids", error);

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
    logger.error("unbale to get chat by chat id", error);

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
    logger.error("Unable to get chat messages:", error);
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
    logger.error("Unable to delete chat room:", error);
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
  updateUserOnlineStatus,
};
