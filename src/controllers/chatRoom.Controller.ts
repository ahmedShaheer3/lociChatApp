import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import chatAggregations from "../aggregations/chatAggrgations";
import logger from "../utils/logger";
import { ChatRoom, deleteChatRoomById } from "../models/chatRoom.model";
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
    // this
    const tempMembers = [...new Set([...members, createdBy])];

    // We want group chat to have minimum 3 members including admin

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
const changingGroupDetails = async (req: Request, res: Response) => {
  const { chatId, roomName, userId, roomPrivacy, profileImage } = req.body;
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
    const updatedRoom = await ChatRoom.findById(
      chatId,
      { roomName, roomPrivacy, profileImage },
      { new: true, runValidators: true },
    );
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: updatedRoom });
  } catch (error) {
    console.log("🚀 ~ changingGroupName ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
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
 ** Deleting group chat
 */
// TODO: Check the deletion flow
const deleteGroupChat = async (req: Request, res: Response) => {
  const { chatRoomId, userId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is room admin or not
    if (!chatRoom?.admins?.includes(new mongoose.Types.ObjectId(userId as string))) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only admin are allowed to delete group" });
    }

    // deleteing chat room
    await deleteChatRoomById(chatRoomId);
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Successfully deleted" });
  } catch (error) {
    console.log("🚀 ~ deleteGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Deleting one to one chat
 */
// TODO: Check the deletion flow
const deleteChatRoom = async (req: Request, res: Response) => {
  const { chatRoomId, userId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Chat room not found" });
    }
    // validating if user is room admin or not
    if (!chatRoom?.admins?.includes(new mongoose.Types.ObjectId(userId as string))) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only admin are allowed to delete group" });
    }

    // deleteing chat room
    await deleteChatRoomById(chatRoomId);
    // emit event to other participant with left chat as a payload
    // emitSocketEvent(
    //   req,
    //   otherParticipant._id?.toString(),
    //   ChatEventEnum.LEAVE_CHAT_EVENT,
    //   payload
    // );
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Successfully deleted" });
  } catch (error) {
    console.log("🚀 ~ deleteGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Leaving from group chat room
 */
const leaveGroupChat = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.params;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is part of this chat room
    if (!chatRoom?.members?.includes(new mongoose.Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
    }

    // leaving the chat group
    const updatedChat = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
      {
        $pull: {
          members: memberId,
        },
      },
      { new: true, runValidators: true },
    );
    console.log("updated chat", updatedChat);
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Left a group successfully" });
  } catch (error) {
    console.log("🚀 ~ leaveGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Adding new participant to the chat group
 */
// TODO:  CHECK REMOVIING FLOW EITHER SINGLE OR ARRAY
const addNewMembersInGroupChat = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is part of this chat room
    if (chatRoom?.members?.includes(new mongoose.Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "User is already a member in this group" });
    }

    // leaving the chat group
    const updatedChat = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
      {
        $push: {
          members: memberId,
        },
      },
      { new: true, runValidators: true },
    );
    console.log("updated chat", updatedChat);
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Left a group successfully" });
  } catch (error) {
    console.log("🚀 ~ leaveGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Adding new participant to the chat group
 */
const removeMembersInGroupChat = async (req: Request, res: Response) => {
  const { chatRoomId, memberId, adminId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is part of this chat room
    if (!chatRoom?.members?.includes(new mongoose.Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
    }
    // validate if adminId is belong to admin
    if (!chatRoom.admins?.includes(new mongoose.Types.ObjectId(adminId))) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "You are not an admin in this group" });
    }

    // leaving the chat group
    const updatedChat = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
      {
        $pull: {
          members: memberId,
        },
      },
      { new: true, runValidators: true },
    );
    console.log("updated chat", updatedChat);
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Participant removed successfully" });
  } catch (error) {
    console.log("🚀 ~ leaveGroupChat ~ error:", error);
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
  changingGroupDetails,
  deleteGroupChat,
  leaveGroupChat,
  deleteChatRoom,
  getChatByChatId,
  addNewMembersInGroupChat,
  removeMembersInGroupChat,
};
