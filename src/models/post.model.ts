import mongoose, { Schema } from "mongoose";
import { postType } from "../types/entityTypes";
import { Users } from "./user.models";
import { Comments } from "./comments.model";
import { Reactions } from "./reaction.model";
import { SavedPosts } from "./savedPosts.model";
import { Reports } from "./report.model";
import { Notifications } from "./notification.model";
import { Connections } from "./connection.models";

const sharedSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Posts",
    required: true,
  },
});

const mediaSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

// Define the reaction count schema directly
const reactionCountSchema = new Schema({
  LIKE: { type: Number, default: 0, min: 0 },
  PRAY: { type: Number, default: 0, min: 0 },
  STRONG: { type: Number, default: 0, min: 0 },
  THANK_YOU: { type: Number, default: 0, min: 0 },
  APPLAUSE: { type: Number, default: 0, min: 0 },
});

const locationSchema = new Schema({
  type: { type: String, required: true, enum: ["Point", "Polygon"] },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function (value: number[]) {
        // Ensure that coordinates have exactly 2 elements (longitude and latitude)
        return Array.isArray(value) && value.length === 2;
      },
      message: "Coordinates must be an array with 2 elements (longitude and latitude).",
    },
  },
});

const postSchema = new Schema<postType>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    shared: { type: sharedSchema, _id: false },
    description: {
      type: String,
    },
    isArchived: {
      type: Boolean,
      required: true,
      default: false,
    },
    privacyStatus: {
      type: String,
      enum: ["PUBLIC", "PRIVATE", "FRIENDS", "SPOTTED"],
      required: true,
      default: "PUBLIC",
    },
    views: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    taggedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    media: { type: mediaSchema, _id: false },
    commentCount: { type: Number, default: 0 },
    location: { type: locationSchema, required: true, _id: false },
    reactionCount: {
      type: reactionCountSchema,
      default: {
        LIKE: 0,
        PRAY: 0,
        STRONG: 0,
        THANK_YOU: 0,
        APPLAUSE: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ location: "2dsphere" });

export const Posts = mongoose.model("Posts", postSchema);

/*
 ** Middleware to check if user when post is created notification is sent to all its followers
 */
postSchema.post("save", async function () {
  try {
    // getting all followers
    const authorFollowers = await Connections.find({
      followingId: this.authorId,
      connectionStatus: "ACCEPTED",
    }).populate({
      path: "followerId",
      select: "name nickName profileImage",
    });

    console.log("🚀 ~ authorFollowers:", authorFollowers);

    // constructing  notification bulk
    const notificationBulkData = authorFollowers.map((connection) => {
      return {
        userId: connection.followerId._id,
        referenceId: this._id,
        notificationTitle: "New Post",
        notificationBody: `A new post by  has been posted`,
        notificationType: "NEW_POST",
      };
    });

    // saving notification to database
    await Notifications.insertMany(notificationBulkData);
    console.log("🚀 ~ notificationBulkData ~ notificationBulkData:", notificationBulkData);
  } catch (error: unknown) {
    console.log("🚀 ~ error:", error);
  }
});

export const getPostDataById = (id: string) => Posts.findOne({ _id: id });

// deleting post by its id
export const deletePostById = async (userId: string, postId: string) => {
  // deleteing all comments
  await Comments.deleteMany({ postId });
  // deleting post saved post
  await SavedPosts.deleteMany({ postId });
  // deleting post all reactions
  await Reactions.deleteMany({ postId });
  // deleting post reports
  await Reports.deleteMany({ postId });

  await Posts.findByIdAndDelete(postId);

  //decrementing post count
  await Users.findByIdAndUpdate(
    userId,
    {
      $inc: { postCount: -1 },
    },
    { runValidators: true },
  );
};
export const updatePostById = (id: string, values: Record<string, unknown>) =>
  Posts.findByIdAndUpdate(id, values, { new: true });
