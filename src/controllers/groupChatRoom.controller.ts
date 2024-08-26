import { Request, Response } from "express";
import mongoose from "mongoose";
import { ChatRoom, deleteChatRoomById } from "../models/chatRoom.model";
import { formatedError } from "../utils/formatedError";
import { Users } from "../models/user.models";
import { STATUS_CODE } from "../config";
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
  const { chatRoomId, members = [] } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }

    // leaving the chat group
    const updatedChat = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
      {
        $push: {
          members: members,
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
  createGroupChat,
  changingGroupDetails,
  deleteGroupChat,
  leaveGroupChat,
  addNewMembersInGroupChat,
  removeMembersInGroupChat,
};
