import { Schema, model } from "mongoose";

const userSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  unreadMsgCount: {
    type: Number,
    default: 0,
  },
});

const inboxModel = new Schema(
  {
    users: {
      type: [userSchema],
      required: true,
      _id: false,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTimestamp: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index on userId for the entire users array
inboxModel.index({ "users.userId": 1 });

export const Inbox = model("Inbox", inboxModel);

// GET ALL Inboxes
export const getInbox = () => Inbox.find();

export const getInboxById = (id: string) => Inbox.findOne({ _id: id });

export const deleteInboxById = (id: string) => Inbox.findByIdAndDelete(id);
export const updateInboxById = (id: string, values: Record<string, unknown>) =>
  Inbox.findByIdAndUpdate(id, values, { new: true });
