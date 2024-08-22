import mongoose, { Schema } from "mongoose";

const chatRoomSchema = new Schema(
  {
    roomName: {
      type: String,
      required: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "ChatMessage",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "Users" },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
        unique: true,
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
