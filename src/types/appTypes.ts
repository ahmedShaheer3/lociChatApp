import { Types } from "mongoose";

export interface FcmTokenType {
  deviceId: string;
  fcmToken: string;
}
export type connectionStatusType = "ACCEPTED" | "PENDING" | "REJECTED";
export type interactionStatusType = "LIKE" | "DISLIKE" | "STRONG" | "THANK_YOU" | "APPLAUSE";

export interface socialType {
  socialId: string;
  socialPlatform: string;
}

export type imageType = {
  imageId: string;
  imageUrl: string;
};
export type videoType = {
  imageId: string;
  imageUrl: string;
  thumbnailUrl?: string;
};
export type documentType = {
  documentId: string;
  documentUrl: string;
};

export type audioType = {
  audioId: string;
  audioUrl: string;
};

export type locationType = {
  type: string;
  coordinates: number[];
  maxDistance?: number;
};

export type socketUserType = {
  userId: string;
  profileImage?: string;
  nickName?: string;
  name?: string;
  chatId?: string;
};

export interface connectionType {
  readonly _id?: string;
  readonly followingId: Types.ObjectId;
  readonly followerId: Types.ObjectId;
  connectionStatus: connectionStatusType;
  createdAt?: Date;
  updatedAt?: Date;
}
