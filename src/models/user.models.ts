import mongoose, { Schema } from "mongoose";
import { UserType } from "../types/entityTypes";
import { Posts } from "./post.model";
import { Notifications } from "./notification.model";
import { Connections } from "./connection.models";
import { SavedPosts } from "./savedPosts.model";
import { Reports } from "./report.model";

/*
 ** Social token schema for user database used for when user is social signup
 */
const socialTokenSchema = new Schema({
  socialId: { type: String, required: true },
  socialPlatform: { type: String, required: true },
});
/*
 ** fcm token schema
 */
const fcmTokenSchema = new Schema({
  fcmToken: { type: String, required: true },
  deviceId: { type: String, required: true },
});

/*
 ** User database schema
 */
const userSchema = new Schema<UserType>(
  {
    cognitoId: {
      type: String,
      required: [true, "cognitoId is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    postCount: {
      type: Number,
      required: [true, "postCount is required"],
      default: 0,
      min: 0,
    },
    name: { type: String, default: "" },
    nickName: { type: String, default: "" },

    followerCount: {
      type: Number,
      required: [true, "followerCount is required"],
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      required: [true, "followingCount is required"],
      default: 0,
      min: 0,
    },
    privacyStatus: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      required: [true, "privacyStatus is required"],
      default: "PRIVATE",
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "MALE",
    },
    dateOfBirth: { type: String, default: "" },
    profileDescription: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    notification: {
      type: Boolean,
      required: [true, "notification is required"],
      default: true,
    },
    socialTokens: {
      type: [socialTokenSchema],
      default: [],
    },
    fcmTokens: {
      type: [fcmTokenSchema],
      default: [],
    },
    accountStatus: {
      type: String,
      enum: ["NOT-ACTIVE", "ACTIVE", "BANNED", "DELETED"],
      required: [true, "accountStatus is required"],
      default: "NOT-ACTIVE",
    },
    blockedUsers: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      default: [],
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    warningCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

export const Users = mongoose.model("Users", userSchema);

export const deleteUserById = async (userId: string) => {
  // deleteing all post
  await Posts.deleteMany({ authorId: userId });
  // deleting user saved post
  await SavedPosts.deleteMany({ userId });
  // deleting user all notifications
  await Notifications.deleteMany({ userId });
  // deleteing user all pending connections
  await Connections.deleteMany({ followingId: userId, connectionStatus: "PENDING" });
  // deleting user all reports
  await Reports.deleteMany({ reporterId: userId });
  // deleting user all reports as reported
  await Reports.deleteMany({ reportedId: userId });

  // deleting user
  // UPDATE USER RECORD IN DB
  await Users.findByIdAndUpdate(
    userId,
    {
      email: "",
      profileDescription: "",
      profileImage: "",
      name: "Deleted user",
      nickName: "Deleted user",
      accountStatus: "DELETED",
      fcmTokens: [],
      socialTokens: [],
      blockedUsers: [],
    },
    { new: true },
  );
};