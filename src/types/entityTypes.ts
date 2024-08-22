import { Types } from "mongoose";
import { connectionStatusType, FcmTokenType, interactionStatusType, socialType } from "./appTypes";

export interface UserType {
  readonly _id?: string;
  readonly cognitoId: string;
  readonly email: string;
  name: string;
  nickName: string;
  privacyStatus: "PUBLIC" | "PRIVATE";
  gender: "MALE" | "FEMALE";
  dateOfBirth?: string;
  profileImage: string;
  notification: boolean;
  socialTokens: socialType[];
  fcmTokens: FcmTokenType[];
  postCount: number;
  followerCount: number;
  followingCount: number;
  reportCount: number;
  warningCount: number;
  profileDescription: string;
  accountStatus: "NOT-ACTIVE" | "ACTIVE" | "DISABLED" | "DELETED";
  createdAt?: Date;
  updatedAt?: Date;
  blockedUsers: Types.ObjectId[];
}

export interface connectionType {
  readonly _id?: string;
  readonly followingId: Types.ObjectId;
  readonly followerId: Types.ObjectId;
  connectionStatus: connectionStatusType;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface notificationType {
  readonly _id?: string;
  readonly userId: Types.ObjectId;
  readonly referenceId: Types.ObjectId;
  notificationTitle: string;
  notificationBody: string;
  notificationType:
    | "COMMENT_LIKE"
    | "POST_COMMENT"
    | "NEW_POST"
    | "FOLLOW_REQUEST"
    | "POST_REACTION"
    | "REQUEST_ACCEPTED";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface postType {
  readonly _id?: string;
  authorId: Types.ObjectId;
  description?: string;
  commentCount: number;
  likesCount: number;
  isArchived: boolean;
  privacyStatus: "PUBLIC" | "PRIVATE" | "FRIENDS";
  views: Types.ObjectId[];
  taggedUsers: Types.ObjectId[];
  shared?: { userId: Types.ObjectId; postId: Types.ObjectId };
  media: { url: string; type: string };
  location: { type: string; coordinates: number[] };
  reactionCount: {
    LIKE: number;
    PRAY: number;
    STRONG: number;
    THANK_YOU: number;
    APPLAUSE: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface savedPostType {
  userId: Types.ObjectId;
  postId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface reactionType {
  readonly _id?: string;
  postId: Types.ObjectId;
  comment?: Types.ObjectId;
  userId: Types.ObjectId;
  interactionTypes: interactionStatusType[];
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface commentType {
  readonly _id?: string;
  comments: string;
  postId?: Types.ObjectId;
  parentId?: Types.ObjectId;
  userId?: Types.ObjectId;
  likesCount: number;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportType {
  postId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reportedId: Types.ObjectId;
  reportType: "POST" | "USER";
  ticketStatus: "PENDING" | "RESOLVED";
  adminFeedback?: string;
  reasons?: string[];
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
