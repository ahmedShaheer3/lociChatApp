import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import chatAggregations from "../aggregations/chatAggrgations";
import logger from "../utils/logger";
import { ChatRoom } from "../models/chatRoom.model";
import { ChatMessage } from "../models/chatMessage.model";
import { formatedError } from "../utils/formatedError";
import { Users } from "../models/user.models";
import { STATUS_CODE } from "../config";
// import { getUserDataById } from "../models/user.models";

/*
 ** Creating a group chat
 */
const createGroupChat = async (req: Request, res: Response) => {
  const { roomName, members, admins, profileImage, roomPrivacy, createdBy } = req.body;
  try {
    // validation user
    const userData = await Users.findOne({ _id: createdBy });
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "user with id not found" });
    }
    // check for duplicates
    // We want group chat to have minimum 3 members including admin
    const tempMembers = [...new Set([...members, createdBy])];

    console.log("🚀 ~ createGroupChat ~ tempMembers:", tempMembers);

    // check after removing the duplicate
    if (tempMembers.length < 3) {
      return res
        .status(STATUS_CODE.CONFLICT_DATA)
        .json({ success: false, message: "Seems like you have passed duplicate participants." });
    }
    // Create a group chat with provided members
    const groupChat = await ChatRoom.create({
      roomName,
      isGroupChat: true,
      participants: tempMembers,
      admins: admins ? admins : [createdBy],
      roomPrivacy,
      profileImage,
      createdBy,
    });
    console.log("🚀 ~ createGroupChat ~ groupChat:", groupChat);
    // logic to emit socket event about the new group chat added to the participants
    // members?.forEach((member: string) => {
    //   // don't emit the event for the logged in use as he is the one who is initiating the chat
    //   if (member === createdBy) return;
    //   // emit event to other participants with new chat as a payload
    //   // emitSocketEvent(req, participant._id?.toString(), ChatEventEnum.NEW_CHAT_EVENT, payload);
    // });
    return res.status(STATUS_CODE.CREATED).json({ success: false, message: "Group chat successfully created" });
  } catch (error) {
    console.log("🚀 ~ createGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Creating a one to one chat room
 */
const createChatRoom = async (req: Request, res: Response) => {
  const { member, createdBy, message } = req.body;
  try {
    // vaidating member and createdBy user
    if (member === createdBy) {
      return res.status(STATUS_CODE.NOT_ACCEPTABLE).json({ success: false, message: "You cannot chat with yourself" });
    }
    // validation user
    const userData = await Users.findOne({ _id: createdBy });
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "user not found" });
    }

    // validating member data
    const memberData = await Users.findOne({ _id: member });
    if (!memberData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "member not found" });
    }

    // checking if chat room is already created by these two participant
    const chatRoom = await ChatRoom.aggregate([
      {
        $match: {
          isGroupChat: false,
          $and: [
            {
              members: { $elemMatch: { $eq: new Types.ObjectId(member) } },
            },
            {
              members: { $elemMatch: { $eq: new Types.ObjectId(createdBy) } },
            },
          ],
        },
      },
    ]);
    if (chatRoom?.length) {
      return res.status(STATUS_CODE.CONFLICT_DATA).json({ success: false, message: "Chat is already created" });
    }

    // Create a one on one chat room
    const newChatRoom = await ChatRoom.create({
      roomName: memberData?.name,
      isGroupChat: false,
      admins: [createdBy],
      participants: [member, createdBy],
      profileImage: memberData?.profileImage,
      createdBy,
    });
    console.log("🚀 ~ createChatRoom ~ newChatRoom:", newChatRoom);
    if (message) {
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
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Chat room successfully created" });
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
  const { userId } = req.query;

  try {
    // PIPELINE FOR GET INBOX OF USERS
    const getUserInboxPipeline = chatAggregations.getUserInbox(userId as string);
    console.log("🚀 ~ getUserChatRooms ~ getUserInboxPipeline:", getUserInboxPipeline);

    // CALL AGGREGATION METHOD ON INBOX TABLE
    const chats = await ChatRoom.aggregate([
      {
        $match: {
          participants: { $elemMatch: { $eq: new Types.ObjectId(userId as string) } },
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
    ]);

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
 ** Changing name of group chat
 */
const changingGroupName = async (req: Request, res: Response) => {
  const { chatId, roomName, userId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findById(chatId);
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "chat room not found" });
    }
    // validating if user is room admin or not
    if (!chatRoom?.members?.includes(userId)) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only admin are allowed to change group name" });
    }
    // updating data
    const updatedRoom = await ChatRoom.findById(chatId, { roomName }, { new: true, runValidators: true });
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: updatedRoom });
  } catch (error) {
    console.log("🚀 ~ changingGroupName ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

// // CREATE MESSAGE IN DB
// const createMessage = async (req: Request, res: Response) => {
//   const { senderId, receiverId, message, messageType, inboxId, media } = req.body;

//   try {
//     let inboxID = inboxId;

//     if (!inboxID) {
//       // CREATE INBOX IF NOT ALREADY CREATED
//       const inbox = await ChatRoom.create({
//         members: [{ userId: senderId }, { userId: receiverId }],
//       });
//       inboxID = inbox._id;
//     }

//     const messagePayload = {
//       inboxId: inboxID,
//       message,
//       messageType,
//       media,
//       sender: senderId,
//     };

//     if (messageType === "txt") {
//       delete messagePayload.media;
//     }

//     // CREATE MESSAGE IN DB
//     const messageData = await ChatMessage.create(messagePayload);

//     // UPDATE LAST MESSAGE AND UNREAD COUNT OF CONVO IN CHAT
//     // const updateInbox = await updateInboxById(inboxID, {lastMessage: message});
//     // const recievingUserData = await getUserDataById(receiverId);

//     // CALL FUNCTION WITH USER FCM
//     // sendNotificationToUser({arrayOfFcm: recievingUserData.fcmTokens,inboxId:inboxID,message:message})

//     // console.log("🚀 ~ createMessage ~ recievingUserData:", recievingUserData);

//     const updateInbox = await ChatRoom.findOneAndUpdate(
//       { _id: inboxID, "users.userId": receiverId },
//       {
//         $inc: { "users.$.unreadMsgCount": 1 },
//         lastMessage: message,
//         lastMessageTimestamp: messageData.createdAt,
//       },
//       { new: true },
//     );
//     console.log("🚀 ~ createMessage ~ updateInbox:", updateInbox);

//     return res.status(201).json({ success: true, data: messageData });
//   } catch (error) {
//     // PRINT ERROR LOGS
//     logger.error("Error creating message:", error);

//     return res.status(400).json({ error: true, message: "Error creating message" });
//   }
// };

// DELETE MSG FROM DB
// const deleteMessage = async (req: Request, res: Response) => {
//   const { messageId } = req.body;

//   try {
//     // DELETE MESSAGE FROM DB
//     await deleteMessageById(messageId);

//     return res.status(200).json({ success: true, message: "Message delete successfully." });
//   } catch (error) {
//     // PRINT ERROR LOGS
//     logger.error("error deleting message", error);

//     return res.status(400).json({ error: true, message: "Error deleting message" });
//   }
// };

// // GET ALL MESSAGES OF AN INBOX
// const getMessagesByChat = async (req: Request, res: Response) => {
//   const { inboxId } = req.query;
//   const page = parseInt(req.query.page as string) - 1 || 0;
//   const rows = parseInt(req.query.rows as string) || 5;

//   try {
//     // FIND ALL MESSAGES BELONGING TO INBOX
//     const chats = await ChatMessage.find({ inbox: inboxId })
//       .sort({ createdAt: -1 })
//       .skip(page * rows)
//       .limit(rows);

//     // GET COUNT OF ALL Rooms
//     const totalChats = await ChatMessage.countDocuments({ inbox: inboxId });

//     // RESPONSE PAYLOAD
//     const response = {
//       success: true,
//       total: totalChats,
//       page: page + 1,
//       rows,
//       data: chats,
//     };

//     return res.status(200).json(response);
//   } catch (error) {
//     // PRINT ERROR LOGS
//     logger.error("Error getting messages by inbox", error);

//     return res.status(400).json({ error: true, message: "Error getting messages" });
//   }
// };
/*
 ** Resting chatRoom unread count
 */
const resetUnreadCount = async (req: Request, res: Response) => {
  const { chatRoomId, receiverId } = req.body;

  try {
    // UPDATE LAST MESSAGE OF CONVO IN CHAT
    const updateInbox = await ChatRoom.findOneAndUpdate(
      { _id: chatRoomId, "users.userId": receiverId },
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
  const { firstUser, SecondUser } = req.query;

  try {
    // Find the inbox where both senderId and receiverId match in the users array
    const updateInbox = await ChatRoom.findOne({
      $or: [
        { "users.userId": new mongoose.Types.ObjectId(firstUser as string) },
        { "users.userId": new mongoose.Types.ObjectId(SecondUser as string) },
      ],
    });

    return res.status(200).json({ success: true, data: updateInbox || {} });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("error getting inboxId by user ids", error);

    return res.status(400).json({ error: true, message: "Error getting inboxId" });
  }
};
/*
 ** Deleting group chat
 */
const deleteGroupChat = async (req: Request, res: Response) => {
  const { chatId, userId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is room admin or not
    if (!chatRoom?.admins?.includes(userId)) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only admin are allowed to delete group" });
    }
    // updating data
    const updatedRoom = await ChatRoom.findById(chatId, { roomName }, { new: true, runValidators: true });
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: updatedRoom });
  } catch (error) {
    console.log("🚀 ~ changingGroupName ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export {
  getUserChatRooms,
  resetUnreadCount,
  getChatByUserIds,
  createGroupChat,
  createChatRoom,
  changingGroupName,
  deleteGroupChat,
};
