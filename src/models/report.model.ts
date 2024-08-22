import mongoose, { CallbackError, Error, Schema } from "mongoose";
import { ReportType } from "../types/entityTypes";
import { Posts } from "./post.model";
import { Users } from "./user.models";

const reportSchema = new Schema<ReportType>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Posts", required: false },
    reporterId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    reportedId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    reportType: {
      type: String,
      enum: ["POST", "USER"],
      required: true,
    },
    ticketStatus: {
      type: String,
      enum: ["PENDING", "RESOLVED"],
      default: "PENDING",
      required: true,
    },
    adminFeedback: { type: String, required: false },
    description: { type: String, required: false },
    reasons: { type: [String], required: false },
  },
  { timestamps: true },
);

/*
 ** Middleware to check if reporter or reported user exits or not
 */
reportSchema.pre("save", async function (next) {
  try {
    console.log("this.reporter", this.reporterId);
    console.log("this.reported", this.reportedId);
    const reporterUser = await Users.findById(this.reporterId);
    if (!reporterUser) {
      throw new Error("Reporter user not found");
    }

    const reportedUser = await Users.findById(this.reportedId);
    if (!reportedUser) {
      throw new Error("Reported user not found");
    }

    if (this.reporterId?.toString() === this.reportedId?.toString()) {
      throw new Error("You can not report yourself or content");
    }

    if (this.postId) {
      const post = await Posts.findById(this.postId);
      if (!post) {
        throw new Error("Post not found");
      }
    }

    next();
  } catch (error: CallbackError | unknown) {
    next(error as CallbackError);
  }
});

export const Reports = mongoose.model("Reports", reportSchema);
