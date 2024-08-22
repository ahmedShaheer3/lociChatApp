import mongoose, { Schema } from "mongoose";
import { savedPostType } from "../types/entityTypes";

const savedPostSchema = new Schema<savedPostType>(
  {
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
  },
  {
    timestamps: true,
  },
);

export const SavedPosts = mongoose.model("SavedPosts", savedPostSchema);
