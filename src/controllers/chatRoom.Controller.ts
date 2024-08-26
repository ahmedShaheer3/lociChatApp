import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import logger from "../utils/logger";
import { ChatRoom } from "../models/chatRoom.model";
import { formatedError } from "../utils/formatedError";
import { Users } from "../models/user.models";
import { STATUS_CODE } from "../config";
import { ChatMessage } from "../models/chatMessage.model";

/*
 ** Creating a one to one chat room
 */
const createChatRoom = async (req: Request, res: Response) => {
  const { member, createdBy, message, messageType, media } = req.body;
  try {
    // vaidating member and createdBy user
    if (member === createdBy) {
      return res.status(STATUS_CODE.NOT_ACCEPTABLE).json({ success: false, message: "You cannot chat with yourself" });
    }
    // validation user
    const userData = await Users.findOne({ _id: createdBy });
    if (!userData) {
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
      roomName: "ONE-TO-ONE Chat",
      isGroupChat: false,
      admins: [createdBy],
      members: [member, createdBy],
      createdBy,
    });
    console.log("🚀 ~ createChatRoom ~ newChatRoom:", newChatRoom);
    if (message || media) {
      await ChatMessage.create({
        chatRoom: newChatRoom?._id,
        sender: createdBy,
        message,
        messageType,
        media,
      });
      // logic to emit socket event about the new chat added to the participants
      // emit event to other participants with new chat as a payload
      // emitSocketEvent(req, participant._id?.toString(), ChatEventEnum.NEW_CHAT_EVENT, payload);
      // UPDATE LAST MESSAGE AND UNREAD COUNT OF CONVO IN CHAT
      // const updateInbox = await updateInboxById(inboxID, {lastMessage: message});
      // const recievingUserData = await getUserDataById(receiverId);
      // CALL FUNCTION WITH USER FCM
      // sendNotificationToUser({arrayOfFcm: recievingUserData.fcmTokens,inboxId:inboxID,message:message})
    }

    // logic to emit socket event about the new group chat added to the participants
    // members?.forEach((member: string) => {
    //   // don't emit the event for the logged in use as he is the one who is initiating the chat
    //   if (member === createdBy) return;
    //   // emit event to other participants with new chat as a payload
    //   // emitSocketEvent(req, participant._id?.toString(), ChatEventEnum.NEW_CHAT_EVENT, payload);
    // });
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

  try {
    // // PIPELINE FOR GET INBOX OF USERS
    // const getUserInboxPipeline = chatAggregations.getUserInbox(userId as string);
    // console.log("🚀 ~ getUserChatRooms ~ getUserInboxPipeline:", getUserInboxPipeline);

    // CALL AGGREGATION METHOD ON INBOX TABLE
    // const chats = await ChatRoom.aggregate([
    //   {
    //     $match: {
    //       members: { $elemMatch: { $eq: new Types.ObjectId(userId as string) } },
    //     },
    //   },
    //   {
    //     $sort: {
    //       updatedAt: -1,
    //     },
    //   },
    // ]);
    // getting all user chat box
    const chats = await ChatRoom.find({ members: { $all: [new Types.ObjectId(userId as string)] } });
    console.log("🚀 ~ getUserChatRooms ~ chats:", chats);

    return res.status(200).json({ success: true, data: chats });
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
  const { chatRoomId, memeberId } = req.body;

  try {
    // UPDATE LAST MESSAGE OF CONVO IN CHAT
    const updateInbox = await ChatRoom.findOneAndUpdate(
      { _id: chatRoomId, "members.userId": memeberId },
      { $set: { "users.$.unreadMsgCount": 0 } },
      { new: true, runValidators: true },
    );

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
 ** Deleting one to one chat
 */
const deleteChatRoom = async (req: Request, res: Response) => {
  const { chatRoomId, userId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: false });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }

    // validating if user is room admin or not
    if (!chatRoom?.members?.includes(new mongoose.Types.ObjectId(userId as string))) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only members are allowed to delete this chat room" });
    }

    // delete the chat even if user is not admin because it's a personal chat
    // await deleteChatRoomById(chatRoomId);
    // deleteing all  user message in that chat room
    await ChatMessage.deleteMany({ chatRoom: chatRoomId, sender: userId });

    // checking if user exits then pull that user if there is only single user so delete the while chat
    if (chatRoom?.members.length > 1) {
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        members: {
          $pull: {
            userId,
          },
        },
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

export { getUserChatRooms, resetUnreadCount, getChatByUserIds, createChatRoom, deleteChatRoom, getChatByChatId };
