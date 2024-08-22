"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportSchema = exports.createReportSchema = exports.createPostSchema = exports.reactionSchema = exports.updateCommentSchema = exports.createCommentSchema = exports.updateConnectionSchema = exports.createConnectionSchema = exports.signedUrlSchema = exports.updateUserFcmSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
var express_validator_1 = require("express-validator");
var commonSchemas_1 = require("../../utils/commonSchemas");
/*
 ** Create user request schema
 */
exports.createUserSchema = (0, express_validator_1.checkSchema)(__assign({ email: (0, commonSchemas_1.emailSchema)({}), cognitoId: (0, commonSchemas_1.idSchema)({ label: "cognitoId" }) }, commonSchemas_1.socialTokenSchema));
// Validation schema for updating a user
exports.updateUserSchema = (0, express_validator_1.checkSchema)({
    profileImage: (0, commonSchemas_1.urlSchema)({ label: "profileImage", required: false }),
    name: (0, commonSchemas_1.textSchema)({ label: "name", required: false }),
    nickName: (0, commonSchemas_1.textSchema)({ label: "nickName", required: false }),
    dateOfBirth: (0, commonSchemas_1.dateSchema)({ required: false }),
    gender: (0, commonSchemas_1.genderSchema)({ required: false }),
    profileDescription: (0, commonSchemas_1.textSchema)({
        label: "profileDescription",
        required: false,
    }),
    privacyStatus: (0, commonSchemas_1.privacyStatusSchema)({
        label: "privacyStatus",
        required: false,
    }),
});
// Validation schema for updating a user
exports.updateUserFcmSchema = (0, express_validator_1.checkSchema)({
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
exports.signedUrlSchema = (0, express_validator_1.checkSchema)({
    fileName: (0, commonSchemas_1.textSchema)({ label: "fileName" }),
    fileType: (0, commonSchemas_1.textSchema)({ label: "fileType" }),
    folderName: (0, commonSchemas_1.textSchema)({ label: "folderName", required: false }),
});
/*
 ** Create connection request schema
 */
exports.createConnectionSchema = (0, express_validator_1.checkSchema)({
    followingId: (0, commonSchemas_1.bsonIdSchema)({ label: "followingId" }),
    followerId: (0, commonSchemas_1.bsonIdSchema)({ label: "followerId" }),
});
/*
 ** Update connection request schema
 */
exports.updateConnectionSchema = (0, express_validator_1.checkSchema)({
    connectionStatus: (0, commonSchemas_1.connectionStatusSchema)({
        required: true,
    }),
});
/*
 ** Creating user comments request schema
 */
exports.createCommentSchema = (0, express_validator_1.checkSchema)({
    comments: (0, commonSchemas_1.textSchema)({ label: "comments" }),
    postId: (0, commonSchemas_1.bsonIdSchema)({ label: "postId" }),
    userId: (0, commonSchemas_1.bsonIdSchema)({ label: "userId" }),
});
/*
 ** updating user comments request schema
 */
exports.updateCommentSchema = (0, express_validator_1.checkSchema)({
    comments: (0, commonSchemas_1.textSchema)({ label: "comments" }),
});
/*
 ** like a post or comments schema
 */
exports.reactionSchema = (0, express_validator_1.checkSchema)({
    postId: (0, commonSchemas_1.bsonIdSchema)({ label: "postId" }),
    userId: (0, commonSchemas_1.bsonIdSchema)({ label: "userId" }),
    interactionType: {
        in: ["body"],
        isString: {
            errorMessage: "Interaction status must be a string",
        },
        matches: {
            options: [/\b(?:LIKE|PRAY|STRONG|THANK_YOU|APPLAUSE)\b/],
            errorMessage: "interactionStatus should be LIKE | PRAY | STRONG | THANK_YOU | APPLAUSE",
        },
    },
});
/*
 ** Create post schema
 */
exports.createPostSchema = (0, express_validator_1.checkSchema)({
    authorId: (0, commonSchemas_1.bsonIdSchema)({ label: "authorId" }),
    privacyStatus: { isIn: { options: [["PUBLIC", "PRIVATE", "FRIENDS", "SPOTTED"]] } },
    description: (0, commonSchemas_1.textSchema)({ label: "description", required: false }),
    media: (0, commonSchemas_1.objectSchemaFunc)({
        label: "media",
        fields: { url: { type: "string" }, type: { type: "string" } },
    }),
    location: (0, commonSchemas_1.objectSchemaFunc)({
        label: "location",
        fields: { coordinates: { type: "array" }, type: { type: "string" } },
    }),
});
// Custom validator for checking length of each element in an array
var validateArrayElements = function (array) {
    return array.every(function (element) { return typeof element === "string" && element.length <= 30; });
};
exports.createReportSchema = (0, express_validator_1.checkSchema)({
    reporterId: (0, commonSchemas_1.bsonIdSchema)({ label: "reporterId" }),
    reportedId: (0, commonSchemas_1.bsonIdSchema)({ label: "reportedId" }),
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
            options: function (value) {
                if (!validateArrayElements(value)) {
                    throw new Error("Each reason must be a string with no more than 30 characters");
                }
                return true;
            },
        },
    },
    description: (0, commonSchemas_1.textSchema)({ label: "description", required: false }),
});
exports.updateReportSchema = (0, express_validator_1.checkSchema)({
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
