import mongoose, { Schema } from "mongoose";
import { chatRoomType } from "../types/entityTypes";
// import { Users } from "./user.models";

const chatRoomSchema = new Schema<chatRoomType>(
  {
    roomName: {
      type: String,
      default: "",
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    lastMessage: { type: Schema.Types.ObjectId, ref: "ChatMessage" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Users" },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      validate: {
        validator: function (members: Schema.Types.ObjectId[]) {
          return members.length <= 20;
        },
        message: "A chat room cannot have more than 20 members.",
      },
    },
    unreadUserCount: {
      type: [
        {
          memberId: { type: Schema.Types.ObjectId, ref: "Users" },
          count: { type: Number, default: 0 },
        },
      ],
    },
    admins: {
      type: [Schema.Types.ObjectId],
      ref: "Users",

      validate: {
        validator: function (admins: Schema.Types.ObjectId[]) {
          return admins.length <= 5;
        },
        message: "A chat room cannot have more than 5 admins.",
      },
    },
    profileImage: {
      type: String,
      default: "",
    },
    roomPrivacy: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC",
    },
  },
  { timestamps: true },
);

/*
 ** Middleware to check if post and user exits
 */
// chatRoomSchema.pre("save", async function (next) {
//   try {
//     const user = await Users.findById(this.createdBy);
//     if (!user) {
//       throw new Error("Creator not found");
//     }
//     const post = await Posts.findById(this.postId);
//     if (!post) {
//       throw new Error("Post not found");
//     }

//     next();
//   } catch (error: CallbackError | unknown) {
//     next(error as CallbackError);
//   }
// });

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
