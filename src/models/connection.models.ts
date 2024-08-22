import mongoose, { CallbackError, Error, Schema } from "mongoose";
import { connectionType } from "../types/entityTypes";
import { Users } from "./user.models";
import { Notifications } from "./notification.model";

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
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true },
);
/*
 ** Middleware to check if followingId and followerId exist
 */
connectionSchema.pre("save", async function (next) {
  try {
    const followingUser = await Users.findById(this.followingId);
    if (!followingUser) {
      throw new Error("Following user not found");
    }

    const followerUser = await Users.findById(this.followerId);
    if (!followerUser) {
      throw new Error("Follower user not found");
    }
    const connection = await Connections.findOne({
      $or: [
        { followingId: this.followingId, followerId: this.followerId },
        { followingId: this.followerId, followerId: this.followingId },
      ],
    });
    if (connection) {
      throw new Error("Connection already exists");
    }

    next();
  } catch (error: CallbackError | unknown) {
    next(error as CallbackError);
  }
});
/*
 ** ports middleware to send notification
 */
connectionSchema.post("save", async function () {
  try {
    const followerUser = await Users.findById(this.followerId);
    console.log("post hooks is called", followerUser);

    // saving notification to database
    await Notifications.create({
      userId: this.followingId,
      referenceId: this.followerId,
      notificationTitle: "",
      notificationBody: `${followerUser?.nickName} started to following you follow back to make connection`,
      notificationType: "FOLLOW_REQUEST",
    });
  } catch (error: CallbackError | unknown) {
    console.log("🚀 ~ connectionSchema post | error:", error);
  }
});

export const Connections = mongoose.model("Connections", connectionSchema);
