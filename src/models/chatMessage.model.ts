import { Schema, model } from "mongoose";
import { chatMessageType } from "../types/entityTypes";

const chatMessageSchema = new Schema<chatMessageType>(
  {
    chatRoom: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ChatRoom",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    message: {
      type: String,
      default: "",
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
    messageType: {
      type: String,
      enum: ["TEXT", "IMAGE", "VIDEO", "VOICE", "FILE"],
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
