import { checkSchema, ParamSchema } from "express-validator";
import {
  bsonIdSchema,
  connectionStatusSchema,
  dateSchema,
  emailSchema,
  genderSchema,
  idSchema,
  objectSchemaFunc,
  privacyStatusSchema,
  socialTokenSchema,
  textSchema,
  urlSchema,
} from "../../utils/commonSchemas";
import { Types } from "mongoose";
/*
 ** Create user request schema
 */
export const createUserSchema = checkSchema({
  email: emailSchema({}) as unknown as ParamSchema,
  cognitoId: idSchema({ label: "cognitoId" }) as unknown as ParamSchema,
  ...socialTokenSchema,
});

// Validation schema for updating a user
export const updateUserSchema = checkSchema({
  profileImage: urlSchema({ label: "profileImage", required: false }) as unknown as ParamSchema,
  name: textSchema({ label: "name", required: false }) as unknown as ParamSchema,
  nickName: textSchema({ label: "nickName", required: false }) as unknown as ParamSchema,
  dateOfBirth: dateSchema({ required: false }) as unknown as ParamSchema,
  gender: genderSchema({ required: false }) as unknown as ParamSchema,
  profileDescription: textSchema({
    label: "profileDescription",
    required: false,
  }) as unknown as ParamSchema,
  privacyStatus: privacyStatusSchema({
    label: "privacyStatus",
    required: false,
  }) as unknown as ParamSchema,
});
// Validation schema for updating a user
export const updateUserFcmSchema = checkSchema({
  fcmToken: {
    in: ["body"],
    isString: {
      errorMessage: "fcmToken must be string",
    },
    isLength: {
      options: { min: 1 },
      errorMessage: "Invalid fcmToken",
      bail: true,
    },
  },
  deviceId: {
    in: ["body"],
    isString: {
      errorMessage: "fcmToken must be string",
    },
    isLength: {
      options: { min: 1 },
      errorMessage: "Invalid deviceId",
      bail: true,
    },
  },
  isFcmUpdate: {
    in: ["body"],
    isBoolean: {
      errorMessage: "isFcmUpdate status must be a boolean",
    },
  },
});

// Validation schema for getting signed url a user
export const signedUrlSchema = checkSchema({
  fileName: textSchema({ label: "fileName" }) as unknown as ParamSchema,
  fileType: textSchema({ label: "fileType" }) as unknown as ParamSchema,
  folderName: textSchema({ label: "folderName", required: false }) as unknown as ParamSchema,
});

/*
 ** Create connection request schema
 */
export const createConnectionSchema = checkSchema({
  followingId: bsonIdSchema({ label: "followingId" }) as unknown as ParamSchema,
  followerId: bsonIdSchema({ label: "followerId" }) as unknown as ParamSchema,
});
/*
 ** Update connection request schema
 */
export const updateConnectionSchema = checkSchema({
  connectionStatus: connectionStatusSchema({
    required: true,
  }) as unknown as ParamSchema,
});
/*
 ** Creating user comments request schema
 */
export const createCommentSchema = checkSchema({
  comments: textSchema({ label: "comments" }) as unknown as ParamSchema,
  postId: bsonIdSchema({ label: "postId" }) as unknown as ParamSchema,
  userId: bsonIdSchema({ label: "userId" }) as unknown as ParamSchema,
});
/*
 ** updating user comments request schema
 */
export const updateCommentSchema = checkSchema({
  comments: textSchema({ label: "comments" }) as unknown as ParamSchema,
});
/*
 ** like a post or comments schema
 */
export const reactionSchema = checkSchema({
  postId: bsonIdSchema({ label: "postId" }) as unknown as ParamSchema,
  userId: bsonIdSchema({ label: "userId" }) as unknown as ParamSchema,
  interactionType: {
    in: ["body"],
    isString: {
      errorMessage: "Interaction status must be a string",
    },
    matches: {
      options: [/\b(?:LIKE|PRAY|STRONG|THANK_YOU|APPLAUSE)\b/],
      errorMessage: `interactionStatus should be LIKE | PRAY | STRONG | THANK_YOU | APPLAUSE`,
    },
  },
});
/*
 ** Creating connection request type
 */
export interface createConnectionType {
  readonly followingId: Types.ObjectId;
  readonly followerId: Types.ObjectId;
}

/*
 ** Create post schema
 */
export const createPostSchema = checkSchema({
  authorId: bsonIdSchema({ label: "authorId" }) as unknown as ParamSchema,
  privacyStatus: { isIn: { options: [["PUBLIC", "PRIVATE", "FRIENDS", "SPOTTED"]] } },
  description: textSchema({ label: "description", required: false }) as unknown as ParamSchema,
  media: objectSchemaFunc({
    label: "media",
    fields: { url: { type: "string" }, type: { type: "string" } },
  }) as unknown as ParamSchema,
  location: objectSchemaFunc({
    label: "location",
    fields: { coordinates: { type: "array" }, type: { type: "string" } },
  }) as unknown as ParamSchema,
});

// Custom validator for checking length of each element in an array
const validateArrayElements = (array: string[]) => {
  return array.every((element) => typeof element === "string" && element.length <= 30);
};
export const createReportSchema = checkSchema({
  reporterId: bsonIdSchema({ label: "reporterId" }) as unknown as ParamSchema,
  reportedId: bsonIdSchema({ label: "reportedId" }) as unknown as ParamSchema,
  reportType: {
    in: ["body"],
    exists: { options: { checkNull: true, checkFalsy: true }, errorMessage: "reportType required" },
    isIn: { options: [["POST", "USER"]], errorMessage: "reportType should be POST | USER" },
  },
  reasons: {
    in: ["body"],
    exists: { options: { checkNull: true, checkFalsy: true }, errorMessage: "reasons required" },
    isArray: {
      errorMessage: "reasons must be an array and length should be more then 1",
      options: { min: 1 },
    },
    custom: {
      options: (value) => {
        if (!validateArrayElements(value)) {
          throw new Error("Each reason must be a string with no more than 30 characters");
        }
        return true;
      },
    },
  },
  description: textSchema({ label: "description", required: false }) as unknown as ParamSchema,
});

export const updateReportSchema = checkSchema({
  ticketStatus: { isIn: { options: [["PENDING", "RESOLVED"]] } },
  adminFeedback: {
    optional: true,
    isString: true,
    isLength: {
      options: { max: 30 },
      errorMessage: "adminFeedback must not be more than 30 characters",
      bail: true,
    },
  },
  action: { isIn: { options: [["REMOVE", "BANNED", "WARN"]] } },
});
