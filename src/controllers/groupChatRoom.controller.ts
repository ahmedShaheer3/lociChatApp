import { Request, Response } from "express";
import { Types } from "mongoose";
import { ChatRoom } from "../models/chatRoom.model";
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
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "createdBy user not found" });
    }
    // check for duplicates
    // this
    const tempMembers = [...new Set([...members, createdBy])];

    // We want group chat to have minimum 3 members including admin

    console.log("🚀 ~ createGroupChat ~ tempMembers:", tempMembers);

    // check after removing the duplicate

    if (tempMembers.length < 3) {
      return res.status(STATUS_CODE.CONFLICT_DATA).json({ success: false, message: "Members should be more then 3" });
    }
    // Create a group chat with provided members
    const groupChat = await ChatRoom.create({
      roomName: roomName ? roomName : "Group chat",
      isGroupChat: true,
      members: tempMembers,
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
    return res.status(STATUS_CODE.CREATED).json({ success: false, data: groupChat });
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
const updateGroupDetails = async (req: Request, res: Response) => {
  const { chatRoomId, roomName, adminId, roomPrivacy, profileImage, admins = [] } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "chat room not found" });
    }
    // validating if user is room admin or not
    if (!chatRoom?.admins?.includes(adminId)) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only admin are allowed to change group name" });
    }

    if (admins?.length === 0) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "There should be atleast single admin" });
    }
    // updating data
    const updatedRoom = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
      { roomName, roomPrivacy, profileImage, admins },
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
 ** Leaving from group chat room
 */
const leaveChatRoom = async (req: Request, res: Response) => {
  const { chatRoomId, memberId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validating if user is part of this chat room
    if (!chatRoom?.members?.includes(new Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
    }
    // validating if user is the only admin
    if (chatRoom?.admins?.includes(new Types.ObjectId(memberId as string)) && chatRoom.admins?.length === 1) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You can not leave this group. Make some other member admin first" });
    }

    // leaving the chat group
    const updatedChat = await ChatRoom.findByIdAndUpdate(
      chatRoomId,
      {
        $pull: {
          members: memberId,
          admins: memberId,
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
 ** Adding new memebr to the chat group
 */
const addNewMembersInGroupChat = async (req: Request, res: Response) => {
  const { chatRoomId, memberId, adminId } = req.body;
  try {
    // validation chat room
    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isGroupChat: true });
    if (!chatRoom) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Group chat room not found" });
    }
    // validation member user
    const userData = await Users.findOne({ _id: memberId });
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Member user not found" });
    }
    // validating if user is room admin or not
    if (!chatRoom?.admins?.includes(adminId)) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only admin are allowed to add member" });
    }
    if (chatRoom?.members.includes(memberId)) {
      return res.status(STATUS_CODE.CONFLICT_DATA).json({ success: false, message: "Member is already in this group" });
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
    return res.status(STATUS_CODE.CREATED).json({ success: true, data: updatedChat });
  } catch (error) {
    console.log("🚀 ~ addNewMembersInGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** removing  member to the chat group
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
    if (!chatRoom?.members?.includes(new Types.ObjectId(memberId as string))) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "You are not a part of this group chat" });
    }
    // validate if adminId is belong to admin
    if (!chatRoom.admins?.includes(new Types.ObjectId(adminId))) {
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
    return res.status(STATUS_CODE.CREATED).json({ success: true, data: updatedChat });
  } catch (error) {
    console.log("🚀 ~ leaveGroupChat ~ error:", error);
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
    if (!chatRoom?.admins?.includes(new Types.ObjectId(userId as string))) {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ success: false, message: "only admin are allowed to delete group" });
    }
    // deleteing chat room
    // await deleteChatRoomById(chatRoomId);
    return res.status(STATUS_CODE.CREATED).json({ success: true, message: "Successfully deleted" });
  } catch (error) {
    console.log("🚀 ~ deleteGroupChat ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export {
  createGroupChat,
  updateGroupDetails,
  deleteGroupChat,
  leaveChatRoom,
  addNewMembersInGroupChat,
  removeMembersInGroupChat,
};
