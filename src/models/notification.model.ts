import mongoose, { Schema } from "mongoose";
import { notificationType } from "../types/entityTypes";

const notificationSchema = new Schema<notificationType>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: false,
    },

    notificationTitle: {
      type: String,
      default: "",
    },

    notificationBody: { type: String, default: "" },

    notificationType: {
      type: String,
      required: true,
      enum: ["COMMENT_LIKE", "POST_COMMENT", "NEW_POST", "FOLLOW_REQUEST", "POST_REACTION", "REQUEST_ACCEPTED"],
    },
  },
  {
    timestamps: true,
  },
);

export const Notifications = mongoose.model("Notifications", notificationSchema);
