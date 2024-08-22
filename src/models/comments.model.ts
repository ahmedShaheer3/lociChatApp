import mongoose, { CallbackError, Schema, Error } from "mongoose";
import { commentType } from "../types/entityTypes";
import { Users } from "./user.models";
import { Posts } from "./post.model";
import { Notifications } from "./notification.model";

const commentSchema = new Schema<commentType>(
  {
    comments: {
      type: String,
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Posts",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    likesCount: { type: Number, default: 0 },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comments",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
/*
 ** Middleware to check if post and user exits
 */
commentSchema.pre("save", async function (next) {
  try {
    const user = await Users.findById(this.userId);
    if (!user) {
      throw new Error("User not found");
    }
    const post = await Posts.findById(this.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    next();
  } catch (error: CallbackError | unknown) {
    next(error as CallbackError);
  }
});
/*
 ** Middleware to send notification to user
 */
commentSchema.post("save", async function () {
  try {
    const user = await Users.findById(this.userId);
    const post = await Posts.findById(this.postId);

    // saving notification to database
    await Notifications.create({
      userId: post?.authorId,
      referenceId: this.postId,
      notificationTitle: "",
      notificationBody: `${user?.nickName} has commented on your post`,
      notificationType: "POST_COMMENT",
    });
  } catch (error: CallbackError | unknown) {
    console.log("🚀 ~ commentSchema post | error:", error);
  }
});
export const Comments = mongoose.model("Comments", commentSchema);
