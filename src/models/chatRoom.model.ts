import mongoose, { Schema } from "mongoose";
import { chatRoomType } from "../types/entityTypes";

const chatRoomSchema = new Schema<chatRoomType>(
  {
    roomName: {
      type: String,
      required: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    lastMessage: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Users" },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      unique: true,
    },
    admins: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      unique: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
