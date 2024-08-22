import { Request, Response } from "express";
import mongoose from "mongoose";
import chatAggregations from "../aggregations/chatAggrgations";
import logger from "../utils/logger";
import { ChatRoom } from "../models/chatRoom.model";
import { ChatMessage } from "../models/chatMessage.model";
// import { getUserDataById } from "../models/user.models";

// GET ALL CHATS IN INBOX
const getUserInbox = async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    // PIPELINE FOR GET INBOX OF USERS
    const getUserInboxPipeline = chatAggregations.getUserInbox(userId as string);

    // CALL AGGREGATION METHOD ON INBOX TABLE
    const chats = await ChatRoom.aggregate(getUserInboxPipeline);

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error getting user inbox:", error);

    return res.status(400).json({ error: true, message: "Error getting user inbox" });
  }
};

// CREATE MESSAGE IN DB
const createMessage = async (req: Request, res: Response) => {
  const { senderId, receiverId, message, messageType = "txt", inboxId, media = "" } = req.body;

  try {
    let inboxID = inboxId;

    if (!inboxID) {
      // CREATE INBOX IF NOT ALREADY CREATED
      const inbox = await ChatRoom.create({
        users: [{ userId: senderId }, { userId: receiverId }],
      });
      inboxID = inbox._id;
    }

    const messagePayload = {
      inboxId: inboxID,
      message,
      messageType,
      media,
      sender: senderId,
    };

    if (messageType === "txt") {
      delete messagePayload.media;
    }

    // CREATE MESSAGE IN DB
    const messageData = await ChatMessage.create(messagePayload);

    // UPDATE LAST MESSAGE AND UNREAD COUNT OF CONVO IN CHAT
    // const updateInbox = await updateInboxById(inboxID, {lastMessage: message});
    // const recievingUserData = await getUserDataById(receiverId);

    // CALL FUNCTION WITH USER FCM
    // sendNotificationToUser({arrayOfFcm: recievingUserData.fcmTokens,inboxId:inboxID,message:message})

    // console.log("🚀 ~ createMessage ~ recievingUserData:", recievingUserData);

    const updateInbox = await ChatRoom.findOneAndUpdate(
      { _id: inboxID, "users.userId": receiverId },
      {
        $inc: { "users.$.unreadMsgCount": 1 },
        lastMessage: message,
        lastMessageTimestamp: messageData.createdAt,
      },
      { new: true },
    );
    console.log("🚀 ~ createMessage ~ updateInbox:", updateInbox);

    return res.status(201).json({ success: true, data: messageData });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error creating message:", error);

    return res.status(400).json({ error: true, message: "Error creating message" });
  }
};

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

// GET ALL MESSAGES OF AN INBOX
const getMessagesByInbox = async (req: Request, res: Response) => {
  const { inboxId } = req.query;
  const page = parseInt(req.query.page as string) - 1 || 0;
  const rows = parseInt(req.query.rows as string) || 5;

  try {
    // FIND ALL MESSAGES BELONGING TO INBOX
    const chats = await ChatMessage.find({ inbox: inboxId })
      .sort({ createdAt: -1 })
      .skip(page * rows)
      .limit(rows);

    // GET COUNT OF ALL Rooms
    const totalChats = await ChatMessage.countDocuments({ inbox: inboxId });

    // RESPONSE PAYLOAD
    const response = {
      success: true,
      total: totalChats,
      page: page + 1,
      rows,
      data: chats,
    };

    return res.status(200).json(response);
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error getting messages by inbox", error);

    return res.status(400).json({ error: true, message: "Error getting messages" });
  }
};

// RESET UNREAD COUNT FOR MESSAGES
const resetUnreadCount = async (req: Request, res: Response) => {
  const { inboxId, receiverId } = req.body;

  try {
    // UPDATE LAST MESSAGE OF CONVO IN CHAT
    const updateInbox = await ChatRoom.findOneAndUpdate(
      { _id: inboxId, "users.userId": receiverId },
      { $set: { "users.$.unreadMsgCount": 0 } },
      { new: true },
    );

    return res.status(200).json({ success: true, data: updateInbox });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("error resetting unread count", error);

    return res.status(400).json({ error: true, message: "Error resetting unread count" });
  }
};

// GET INBOX ID BY USER IDS
const getInboxIdByUserIds = async (req: Request, res: Response) => {
  const { senderId, receiverId } = req.query;

  try {
    // Find the inbox where both senderId and receiverId match in the users array
    const updateInbox = await ChatRoom.findOne({
      $and: [
        { "users.userId": new mongoose.Types.ObjectId(senderId as string) },
        { "users.userId": new mongoose.Types.ObjectId(receiverId as string) },
      ],
    });

    return res.status(200).json({ success: true, data: updateInbox || {} });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("error getting inboxId by user ids", error);

    return res.status(400).json({ error: true, message: "Error getting inboxId" });
  }
};

export { createMessage, getInboxIdByUserIds, getMessagesByInbox, getUserInbox, resetUnreadCount };
