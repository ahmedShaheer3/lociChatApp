import { Request, Response } from "express";
import { formatedError } from "../utils/formatedError";
import { ChatRoom } from "../models/chatRoom.model";
import { ChatEventEnum, STATUS_CODE } from "../config";
import mongoose, { Types } from "mongoose";
import { ChatMessage } from "../models/chatMessage.model";
import { emitSocketEvent } from "../socket";
import { Users } from "../models/user.models";
import logger from "../utils/logger";

/*
 ** sendMessage to chat room
 */
const sendMessage = async (req: Request, res: Response) => {
  const chatRoomId = req.params.chatRoomId;
  const { memberId, text, messageType, media } = req.body;

  try {
    const memberData = await Users.findById(memberId);
    if (!memberData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Member not found" });
    }
    // validation chat room
    const chatRoomData = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoomData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }
    // validating if user is part of this chat room
    if (!chatRoomData?.members?.includes(new mongoose.Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
    }
    const newMessage = await ChatMessage.create({
      chatRoom: chatRoomId,
      user: memberId,
      text,
      messageType,
      media,
    });
    console.log("🚀 ~ sendMessage ~ newMessage:", newMessage);
    // Update unread count for all members except the sender
    const unreadUpdates = chatRoomData.members.map(async (member) => {
      // avoid updating unread count for the sender memeber
      if (member.toString() === memberId) return;
      // update the unread count for the member in the chat room database
      await ChatRoom.findOneAndUpdate(
        { _id: chatRoomId, "unreadUserCount.memberId": member },
        { $inc: { "unreadUserCount.$.count": 1 } },
      );
    });
    await Promise.all(unreadUpdates);
    // update the chat's last message which could be utilized to show last message in the list item
    // Update the chat's last message and return the updated document
    const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
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
    // refactoring messaging
    // Add the user data to the message response manually
    const messageWithUserData = {
      ...newMessage?.toObject(),
      user: {
        _id: memberData?._id,
        name: memberData?.name,
        profileImage: memberData?.profileImage,
      },
      chatRoom: updatedChatRoom,
    };
    console.log("🚀 ~ sendMessage ~ messageWithUserData:", messageWithUserData);

    // logic to emit socket event about the new message created to the other participants
    chatRoomData.members.forEach((participantObjectId) => {
      // here the chat is the raw instance of the chat in which participants is the array of object ids of users
      // avoid emitting event to the user who is sending the message
      if (participantObjectId.toString() === memberId) return;

      // emit the receive message event to the other participants with received message as the payload
      emitSocketEvent(req, participantObjectId.toString(), ChatEventEnum.MESSAGE, messageWithUserData);
    });
    if (messageWithUserData.chatRoom) {
      messageWithUserData.chatRoom = null;
    }
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: messageWithUserData });
  } catch (error) {
    console.log("🚀 ~ getChatMessages ~ error:", error);
    logger.error("Unable to send message", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** SendMessage to bulk users
 */
// const sendMessageBulk = async (req: Request, res: Response) => {
//   const { memberId, text, messageType, media, members = [] } = req.body;

//   try {
//     const memberData = await Users.findById(memberId);
//     if (!memberData) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Member not found" });
//     }

//     const newMessage = await ChatMessage.create({
//       chatRoom: chatRoomId,
//       user: memberId,
//       text,
//       messageType,
//       media,
//     });
//     console.log("🚀 ~ sendMessage ~ newMessage:", newMessage);
//     // Update unread count for all members except the sender
//     const unreadUpdates = chatRoomData.members.map(async (member) => {
//       // avoid updating unread count for the sender memeber
//       if (member.toString() === memberId) return;
//       // update the unread count for the member in the chat room database
//       await ChatRoom.findOneAndUpdate(
//         { _id: chatRoomId, "unreadUserCount.memberId": member },
//         { $inc: { "unreadUserCount.$.count": 1 } },
//       );
//     });
//     await Promise.all(unreadUpdates);
//     // update the chat's last message which could be utilized to show last message in the list item
//     // Update the chat's last message and return the updated document
//     const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
//       chatRoomId,
//       { lastMessage: newMessage._id },
//       { new: true, runValidators: true },
//     )
//       .populate({
//         path: "members",
//         select: "name nickName profileImage email",
//       })
//       .populate({
//         path: "lastMessage",
//         select: "text messageType",
//       });
//     // refactoring messaging
//     // Add the user data to the message response manually
//     const messageWithUserData = {
//       ...newMessage?.toObject(),
//       user: {
//         _id: memberData?._id,
//         name: memberData?.name,
//         profileImage: memberData?.profileImage,
//       },
//       chatRoom: updatedChatRoom,
//     };
//     console.log("🚀 ~ sendMessage ~ messageWithUserData:", messageWithUserData);

//     // logic to emit socket event about the new message created to the other participants
//     chatRoomData.members.forEach((participantObjectId) => {
//       // here the chat is the raw instance of the chat in which participants is the array of object ids of users
//       // avoid emitting event to the user who is sending the message
//       if (participantObjectId.toString() === memberId) return;

//       // emit the receive message event to the other participants with received message as the payload
//       emitSocketEvent(req, participantObjectId.toString(), ChatEventEnum.MESSAGE, messageWithUserData);
//     });

//     return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: updatedChatRoom });
//   } catch (error) {
//     console.log("🚀 ~ getChatMessages ~ error:", error);
//     /*
//      ** Formated Error
//      */
//     return formatedError(res, error);
//   }
// };
/*
 ** delete message to chat room
 */
const deleteMessage = async (req: Request, res: Response) => {
  const { messageId, memberId } = req.params;
  try {
    // validation chat room messaghe
    const message = await ChatMessage.findOne({ _id: messageId, user: memberId });
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
    logger.error("Unable to delete message:", error);
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
  const { text } = req.body;
  try {
    // validation chat room messaghe
    const messageData = await ChatMessage.findOne({ _id: messageId, user: memberId });
    if (!messageData) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Message not found with this messageId and memberId" });
    }

    // deleteing chat message
    const updatedMsg = await ChatMessage.findByIdAndUpdate(messageId, { text, edited: true }, { new: true });

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
    logger.error("Unable to edit message:", error);
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
    const message = await ChatMessage.findOne({ _id: messageId, user: memberId });
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
    logger.error("Unable to add reaction:", error);
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
    await ChatMessage.deleteMany({ chatRoom: chatRoomId, user: memberId });
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
    logger.error("Unable to delete user all messages:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export { sendMessage, deleteMessage, deleteUserMessages, editMessage, addReaction };
