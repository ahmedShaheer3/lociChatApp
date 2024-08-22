import mongoose, { CallbackError, Error, Schema } from "mongoose";
import { reactionType } from "../types/entityTypes";
import { Posts } from "./post.model";
import { Users } from "./user.models";
import { Notifications } from "./notification.model";

const ReactionSchema = new Schema<reactionType>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Posts",
      required: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comments",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    interactionTypes: {
      type: [String],
      enum: ["LIKE", "PRAY", "STRONG", "THANK_YOU", "APPLAUSE"],
      required: [true, "Interaction status is required"],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

/*
 ** Middleware to check if user and post exits or not
 */
ReactionSchema.pre("save", async function (next) {
  try {
    //checking user
    const user = await Users.findById(this.userId);
    if (!user) {
      throw new Error("User not found");
    }
    // checking post
    const post = await Posts.findById(this.postId);
    if (!post) {
      throw new Error("post not found");
    }

    next();
  } catch (error: CallbackError | unknown) {
    next(error as CallbackError);
  }
});
/*
 ** Middleware to send notification
 */
ReactionSchema.post("save", async function () {
  try {
    //checking user
    const user = await Users.findById(this.userId);
    const post = await Posts.findById(this.postId);

    // sending notification to post author user
    await Notifications.create({
      userId: post?.authorId,
      referenceId: this.postId,
      notificationTitle: "Post get reacted",
      notificationBody: `${user?.nickName} has reacted the following ${this.interactionTypes}`,
      notificationType: "POST_REACTION",
    });
  } catch (error: CallbackError | unknown) {
    console.log("🚀 ~ error: ReactionSchema | post ", error);
  }
});
export const Reactions = mongoose.model("Reactions", ReactionSchema);
