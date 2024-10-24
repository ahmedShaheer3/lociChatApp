import { Schema, model } from "mongoose";
import { chatMessageType } from "../types/entityTypes";

const chatMessageSchema = new Schema<chatMessageType>(
  {
    chatRoom: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ChatRoom",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    media: {
      type: String,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    audio: {
      type: String,
    },
    postId: {
      type: Schema.Types.ObjectId,
    },
    messageType: {
      type: String,
      enum: ["TEXT", "IMAGE", "VIDEO", "AUDIO", "FILE"],
      default: "TEXT",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    pending: {
      type: Boolean,
      default: false,
    },
    sent: {
      type: Boolean,
      default: false,
    },
    received: {
      type: Boolean,
      default: false,
    },
    reactions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const ChatMessage = model("ChatMessage", chatMessageSchema);
