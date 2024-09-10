import { Types } from "mongoose";
import { FcmTokenType, socialType } from "./appTypes";

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

export interface chatRoomType {
  readonly _id?: string;
  readonly createdBy: Types.ObjectId;
  admins: Types.ObjectId[];
  members: Types.ObjectId[];
  isGroupChat: boolean;
  lastMessage: Types.ObjectId;
  roomName?: string;
  roomPrivacy: "PUBLIC" | "PRIVATE";
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface chatMessageType {
  readonly _id?: string;
  readonly chatRoom: Types.ObjectId;
  sender: Types.ObjectId;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "VOICE" | "FILE";
  audio?: string;
  image?: string;
  video?: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
  reactions: string[];
  edited?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
}

// export interface chatMessageType {
//   readonly _id?: string;
//   readonly chatRoom: Types.ObjectId;
//   user: Types.ObjectId;
//   messageType: "TEXT" | "IMAGE" | "VIDEO" | "VOICE" | "FILE";
//   image?: string;
//   video?: string;
//   audio?: string;
//   text: string;
//   updatedAt?: Date;
//   createdAt?: Date;
//   reactions: string[];
//   edited?: boolean;
//   sent?: boolean;
//   received?: boolean;
//   pending?: boolean;
// }
