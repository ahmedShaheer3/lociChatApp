import { FcmTokenType, socialType } from "./appTypes";

export interface creatUserType {
  name: string;
  nickName: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  email: string;
  socialTokens?: socialType[];
  cognitoId: string;
  profileImage: string;
}
export interface updateUserType {
  profileImage: string;
  nickName: string;
  name: string;
  profileDescription: string;
  fcm: FcmTokenType[];
}
