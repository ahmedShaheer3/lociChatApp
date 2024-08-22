import { Schema, model } from "mongoose";

const messageModel = new Schema(
  {
    inboxId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Inbox",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    media: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["txt", "media"],
    },
  },
  {
    timestamps: true,
  },
);

export const Message = model("Message", messageModel);

// GET ALL Messagees
export const getMessages = () => Message.find();

export const getMessageById = (id: string) => Message.findOne({ _id: id });

export const deleteMessageById = (id: string) => Message.findByIdAndDelete(id);
export const updateMessageById = (id: string, values: Record<string, unknown>) =>
  Message.findByIdAndUpdate(id, values, { new: true });
