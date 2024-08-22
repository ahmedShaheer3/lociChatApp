import { Request, Response } from "express";
import logger from "../utils/logger";
import { Comments } from "../models/comments.model";
import { formatedError } from "../utils/formatedError";
import { STATUS_CODE } from "../config";
import { Posts } from "../models/post.model";
import { PipelineStage } from "mongoose";
import { gettingPostComments } from "../aggregations/commentAggregation";
import { Notifications } from "../models/notification.model";
import { Users } from "../models/user.models";
/*
 ** creating comment in database
 */
export const createComment = async (req: Request, res: Response) => {
  const { comments, postId, userId, parentId = null } = req.body;

  try {
    /*
     ** Checking if paraent comment exits
     */
    if (parentId) {
      const parentComment = await Comments.findById(parentId);
      if (!parentComment) {
        return res.status(STATUS_CODE.NOT_FOUND).json({ success: true, message: "Parent coment not found" });
      }
    }

    const comment = await Comments.create({
      comments,
      postId,
      userId,
      parentId,
    });

    //incrementing react count
    await Posts.findByIdAndUpdate(
      postId,
      {
        $inc: { commentCount: 1 },
      },
      { runValidators: true },
    );
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: comment });
  } catch (error: unknown) {
    console.log("🚀 ~ createComment ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** updating comment in database
 */
export const updateComment = async (req: Request & { params: { commentId: string } }, res: Response) => {
  const commentId = req.params.commentId;
  const { comments } = req.body;

  try {
    const oldComments = await Comments.findById(commentId);
    if (!oldComments) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: true, message: "Comment not found" });
    }
    const updatedComment = await Comments.findByIdAndUpdate(commentId, { comments }, { new: true });
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: updatedComment });
  } catch (error: unknown) {
    console.log("🚀 ~ error:updateComment", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** get post all comments
 */
export const getPostComments = async (req: Request & { params: { postId: string } }, res: Response) => {
  const postId = req.params.postId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  try {
    // getting total counts
    const totalComments = await Comments.countDocuments({ postId });

    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalComments / limit);

    const postComments = await Comments.aggregate(gettingPostComments(postId, limit, page) as PipelineStage[])
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        item: postComments,
      },
    });
  } catch (error: unknown) {
    console.log("🚀 ~ error:updateComment", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** deleting comment in database
 */
export const deleteComment = async (req: Request & { params: { commentId: string } }, res: Response) => {
  const commentId = req.params.commentId;

  try {
    // checking  if comment is there
    const comment = await Comments.findById(commentId);
    if (!comment) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ error: true, message: "Comment not found" });
    }
    // deleting comment from database
    await Comments.findByIdAndDelete(commentId);
    //incrementing react count
    await Posts.findByIdAndUpdate(
      comment?.postId,
      {
        $inc: { commentCount: -1 },
      },
      { runValidators: true },
    );
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Comment deleted successfully" });
  } catch (error: unknown) {
    console.log("🚀 ~ error:deleteComment", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** liking/unliking comment in database
 */
export const likeComment = async (req: Request & { params: { commentId: string } }, res: Response) => {
  const commentId = req.params.commentId;
  const { action, userId } = req.body;

  try {
    const comment = await Comments.findById(commentId);
    if (!comment) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ error: true, message: "Comment not found" });
    }
    // validation user
    const userData = await Users.findOne({ _id: userId });
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "user with id not found" });
    }
    let updatedData;
    if (action === "LIKE") {
      updatedData = await Comments.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } }, { new: true });
      // saving notification to database
      await Notifications.create({
        userId: comment.userId,
        referenceId: comment.postId,
        notificationTitle: "",
        notificationBody: `${userData?.nickName} has liked your comment`,
        notificationType: "COMMENT_LIKE",
      });
    } else if (action === "UNLIKE") {
      updatedData = await Comments.findByIdAndUpdate(commentId, { $inc: { likesCount: -1 } }, { new: true });
    }

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: updatedData });
  } catch (error) {
    logger.error("Error liking/unliking comment: ", error);
    return res.status(STATUS_CODE.NOT_FOUND).json({ error: true, message: "Unable to like/unlike comment" });
  }
};
