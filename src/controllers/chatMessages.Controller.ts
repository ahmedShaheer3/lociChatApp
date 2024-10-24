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
const sendMessageToUsers = async (req: Request, res: Response) => {
  const { members, senderId, text, messageType, audio, video, image, postId } = req.body;
  try {
    // Validate that members do not exceed 20 users
    if (members.length > 10) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Cannot send messages to more than 10 recipients at once" });
    }
    // validating the sender
    const senderData = await Users.findById(senderId);
    if (!senderData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Sender not found" });
    }
    let newChatRoom: InstanceType<typeof ChatRoom> | null = null;
    await Promise.all(
      members.map(async (recipientId: string) => {
        if (recipientId === senderId) {
          console.log(`Recipient is equal to sender id, skipping...`);
          return null;
        }
        const recipientData = await Users.findById(recipientId);
        console.log("🚀 ~ members.map ~ recipientData:", recipientData);
        if (!recipientData) {
          // Skip iteration if recipient not found
          console.log(`Recipient ${recipientId} not found, skipping...`);
          return null;
        }

        // Check if a chat room exists between sender and recipient
        // Check if both users are in the same room
        const chatRoomData = await ChatRoom.findOne({
          isGroupChat: false,
          members: {
            $all: [new Types.ObjectId(senderId as string), new Types.ObjectId(recipientId as string)],
          },
        });
        console.log("chatRoomData:", chatRoomData);

        // If chat room doesn't exist, create a new one
        if (!chatRoomData) {
          console.log("creating new chat room");
          // Create a one on one chat room
          newChatRoom = await ChatRoom.create({
            isGroupChat: false,
            admins: [senderId],
            members: [senderId, recipientId],
            unreadUserCount: [
              { memberId: senderId, count: 0 },
              { memberId: recipientId, count: 1 },
            ],
            senderId,
          });
          console.log("newChatRoom:", newChatRoom);
        }
        const chatRoomId = chatRoomData?._id || newChatRoom?._id;
        // Create a new message
        const newMessage = await ChatMessage.create({
          chatRoom: chatRoomId,
          user: senderId,
          text,
          messageType,
          audio: audio || undefined,
          video: video || undefined,
          image: image || undefined,
          postId: postId || undefined,
        });
        console.log("new message is :", newMessage);

        // update the chat's last message which could be utilized to show last message in the list item
        const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
          chatRoomId,
          { lastMessage: newMessage._id },
          { new: true },
        )
          .populate({
            path: "members",
            select: "name nickName profileImage email",
          })
          .populate({
            path: "lastMessage",
            select: "text messageType",
          });
        const messageWithUserData = {
          ...newMessage?.toObject(),
          user: {
            _id: senderData._id,
            name: senderData.name,
            profileImage: senderData.profileImage,
          },
          chatRoom: updatedChatRoom,
        };
        // emit the receive message event to the other participants with received message as the payload
        emitSocketEvent(req, recipientId, ChatEventEnum.MESSAGE, messageWithUserData);

        return;
      }),
    );

    // Return the bulk message result for each recipient
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Successfully sent" });
  } catch (error) {
    console.log("🚀 ~ sendBulkMessage ~ error:", error);
    logger.error("Unable to send bulk messages", error);
    /*
     ** Formatted Error
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

export { sendMessage, deleteMessage, deleteUserMessages, editMessage, addReaction, sendMessageToUsers };
