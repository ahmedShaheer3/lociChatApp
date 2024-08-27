import { Request, Response } from "express";
import { formatedError } from "../utils/formatedError";
import { ChatRoom } from "../models/chatRoom.model";
import { STATUS_CODE } from "../config";
import mongoose, { Types } from "mongoose";
import { ChatMessage } from "../models/chatMessage.model";

/*
 ** sendMessage to chat room
 */
const sendMessage = async (req: Request, res: Response) => {
  const chatRoomId = req.params.chatRoomId;
  const { memberId, message, messageType, media } = req.body;

  try {
    // validation chat room
    const chatRoomData = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoomData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is part of this chat room
    if (!chatRoomData?.members?.includes(new mongoose.Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
    }
    const newMessage = await ChatMessage.create({
      chatRoom: chatRoomId,
      sender: memberId,
      message,
      messageType,
      media,
    });
    console.log("🚀 ~ sendMessage ~ newMessage:", newMessage);

    // update the chat's last message which could be utilized to show last message in the list item
    await ChatRoom.findByIdAndUpdate(chatRoomId, { lastMessage: newMessage._id });

    // updating user unread count
    // const updateInbox = await Inbox.findOneAndUpdate(
    //   { _id: inboxID, "users.userId": receiverId },
    //   {
    //     $inc: { "users.$.unreadMsgCount": 1 },
    //     lastMessage: message,
    //     lastMessageTimestamp: messageData.createdAt,
    //   },
    //   { new: true },
    // );
    //       // logic to emit socket event about the new message created to the other participants
    //       chatRoom.members.forEach((participantObjectId) => {
    //     // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    //     // avoid emitting event to the user who is sending the message
    //     if (participantObjectId.toString() === req.user._id.toString()) return;

    //     // emit the receive message event to the other participants with received message as the payload
    //     emitSocketEvent(
    //       req,
    //       participantObjectId.toString(),
    //       ChatEventEnum.MESSAGE_RECEIVED_EVENT,
    //       receivedMessage
    //     );
    //   });
    // const constructingMessage = {

    // }

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: newMessage });
  } catch (error) {
    console.log("🚀 ~ getChatMessages ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** delete message to chat room
 */
const deleteMessage = async (req: Request, res: Response) => {
  const { messageId, memberId } = req.params;
  try {
    // validation chat room messaghe
    const message = await ChatMessage.findOne({ _id: messageId, sender: memberId });
    if (!message) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Message not found with this messageId and memberId" });
    }
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: message.chatRoom });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }

    // deleteing chat message
    await ChatMessage.findByIdAndDelete(messageId);
    // Updating the last message of the chat to the previous message after deletion if the message deleted was last message
    if (chatRoom.lastMessage.toString() === message._id.toString()) {
      const lastMessage = await ChatMessage.findOne({ chatRoom: chatRoom?._id }, {}, { sort: { createdAt: -1 } });

      await ChatRoom.findByIdAndUpdate(chatRoom?._id, {
        lastMessage: lastMessage ? lastMessage?._id : null,
      });
    }
    //       // logic to emit socket event about the new message created to the other participants
    //       chatRoom.members.forEach((participantObjectId) => {
    //     // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    //     // avoid emitting event to the user who is sending the message
    //     if (participantObjectId.toString() === req.user._id.toString()) return;

    //     // emit the receive message event to the other participants with received message as the payload
    //     emitSocketEvent(
    //       req,
    //       participantObjectId.toString(),
    //       ChatEventEnum.MESSAGE_RECEIVED_EVENT,
    //       receivedMessage
    //     );
    //   });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Message deleted successfully" });
  } catch (error) {
    console.log("🚀 ~ deleteMessage ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Edit message
 */
const editMessage = async (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  const memberId = req.params.memberId;
  const { message } = req.body;
  try {
    // validation chat room messaghe
    const messageData = await ChatMessage.findOne({ _id: messageId, sender: memberId });
    if (!messageData) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Message not found with this messageId and memberId" });
    }

    // deleteing chat message
    const updatedMsg = await ChatMessage.findByIdAndUpdate(messageId, { message }, { new: true });

    //       // logic to emit socket event about the new message created to the other participants
    //       chatRoom.members.forEach((participantObjectId) => {
    //     // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    //     // avoid emitting event to the user who is sending the message
    //     if (participantObjectId.toString() === req.user._id.toString()) return;

    //     // emit the receive message event to the other participants with received message as the payload
    //     emitSocketEvent(
    //       req,
    //       participantObjectId.toString(),
    //       ChatEventEnum.MESSAGE_RECEIVED_EVENT,
    //       receivedMessage
    //     );
    //   });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: updatedMsg });
  } catch (error) {
    console.log("🚀 ~ deleteMessage ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Add reaction to messages
 */
const addReaction = async (req: Request, res: Response) => {
  const { messageId, memberId, reaction } = req.params;
  try {
    // validation chat room messaghe
    const message = await ChatMessage.findOne({ _id: messageId, sender: memberId });
    if (!message) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Message not found with this messageId and memberId" });
    }
    // adding reaction to message
    await ChatMessage.findByIdAndUpdate(messageId, {
      reactions: {
        $push: {
          reaction,
        },
      },
    });
    //       // logic to emit socket event about the new message created to the other participants
    //       chatRoom.members.forEach((participantObjectId) => {
    //     // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    //     // avoid emitting event to the user who is sending the message
    //     if (participantObjectId.toString() === req.user._id.toString()) return;

    //     // emit the receive message event to the other participants with received message as the payload
    //     emitSocketEvent(
    //       req,
    //       participantObjectId.toString(),
    //       ChatEventEnum.MESSAGE_RECEIVED_EVENT,
    //       receivedMessage
    //     );
    //   });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Message deleted successfully" });
  } catch (error) {
    console.log("🚀 ~ deleteMessage ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Delete message to chat room
 */
const deleteUserMessages = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // Updating the last message of the chat to the previous message after deletion if the message deleted was last message
    if (!chatRoom.members.includes(new Types.ObjectId(memberId))) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "User is not part of this chat room" });
    }

    // deleteing user all messages
    await ChatMessage.deleteMany({ chatRoom: chatRoomId, sender: memberId });
    //       // logic to emit socket event about the new message created to the other participants
    //       chatRoom.members.forEach((participantObjectId) => {
    //     // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    //     // avoid emitting event to the user who is sending the message
    //     if (participantObjectId.toString() === req.user._id.toString()) return;

    //     // emit the receive message event to the other participants with received message as the payload
    //     emitSocketEvent(
    //       req,
    //       participantObjectId.toString(),
    //       ChatEventEnum.MESSAGE_RECEIVED_EVENT,
    //       receivedMessage
    //     );
    //   });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Message deleted successfully" });
  } catch (error) {
    console.log("🚀 ~ deleteMessage ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export { sendMessage, deleteMessage, deleteUserMessages, editMessage, addReaction };
