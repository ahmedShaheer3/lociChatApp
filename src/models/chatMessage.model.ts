import { Schema, model } from "mongoose";

const chatMessageSchema = new Schema(
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
      enum: ["TEXT", "MEDIA"],
      default: "txt",
    },
  },
  {
    timestamps: true,
  },
);

export const ChatMessage = model("ChatMessage", chatMessageSchema);
