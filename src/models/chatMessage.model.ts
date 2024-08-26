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
    media: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["TEXT", "IMAGE", "VIDEO", "VOICE", "FILE"],
      default: "TEXT",
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const ChatMessage = model("ChatMessage", chatMessageSchema);
