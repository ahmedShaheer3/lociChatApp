import mongoose, { Schema } from "mongoose";
import { connectionType } from "../types/appTypes";

/*
 ** Connection database schema
 */
const connectionSchema = new Schema<connectionType>(
  {
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    connectionStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const Connections = mongoose.model("Connections", connectionSchema);
