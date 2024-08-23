import { Request, Response } from "express";
import { formatedError } from "../utils/formatedError";
import { ChatRoom } from "../models/chatRoom.model";
import { STATUS_CODE } from "../config";
import mongoose from "mongoose";
import { ChatMessage } from "../models/chatMessage.model";

/*
 ** getting chat all messages
 */
const getChatMessages = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is part of this chat room
    if (!chatRoom?.members?.includes(new mongoose.Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
    }

    const messages = await ChatMessage.find({ _id: chatRoomId }).sort({ createdAt: -1 });
    console.log("🚀 ~ getChatMessages ~ messages:", messages);
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: messages });
  } catch (error) {
    console.log("🚀 ~ getChatMessages ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** sendMessage to chat room
 */
const sendMessage = async (req: Request, res: Response) => {
  const { chatRoomId } = req.params;
  const { memberId, message, messageType, media } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is part of this chat room
    if (!chatRoom?.members?.includes(new mongoose.Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
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
    // const constructingMessage = {

    // }
    const newMessage = await ChatMessage.create({
      chatRoom: chatRoomId,
      sender: memberId,
      message,
      messageType,
      media,
    });

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
  const { chatRoomId, messageId } = req.params;
  const { memberId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }

    // validation chat room messaghe
    const message = await ChatMessage.findOne({ _id: messageId, sender: memberId });
    if (!message) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Message not found with this messageId and memberId" });
    }
    // deleteing chat message
    await ChatMessage.findByIdAndDelete(messageId);
    // Updating the last message of the chat to the previous message after deletion if the message deleted was last message
    if (chatRoom.lastMessage.toString() === message._id.toString()) {
      const lastMessage = await ChatMessage.findOne({ chatRoom: chatRoomId }, {}, { sort: { createdAt: -1 } });

      await ChatRoom.findByIdAndUpdate(chatRoomId, {
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
 ** delete message to chat room
 */
const deleteUserMessages = async (req: Request, res: Response) => {
  const { chatRoomId } = req.params;
  const { memberId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // Updating the last message of the chat to the previous message after deletion if the message deleted was last message
    if (!chatRoom.members.includes(memberId)) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "User is not part of this chat room" });
    }
    // deleteing user all messages
    await ChatMessage.deleteMany({ chatRoomId, sender: memberId });
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

export { getChatMessages, sendMessage, deleteMessage, deleteUserMessages };
