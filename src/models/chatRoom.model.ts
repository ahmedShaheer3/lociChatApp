import mongoose, { Schema } from "mongoose";
import { chatRoomType } from "../types/entityTypes";
import { ChatMessage } from "./chatMessage.model";
// import { Users } from "./user.models";

const chatRoomSchema = new Schema<chatRoomType>(
  {
    roomName: {
      type: String,
      required: true,
      unique: true,
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
      unique: true,
      validate: {
        validator: function (members: Schema.Types.ObjectId[]) {
          return members.length <= 20;
        },
        message: "A chat room cannot have more than 20 members.",
      },
    },
    admins: {
      type: [Schema.Types.ObjectId],
      ref: "Users",
      unique: true,
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

export const deleteChatRoomById = async (chatRoomId: string) => {
  // deleteing all post
  await ChatMessage.deleteMany({ chatRoom: chatRoomId });

  // deleting chat room
  await ChatRoom.findByIdAndDelete(chatRoomId);
};

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);