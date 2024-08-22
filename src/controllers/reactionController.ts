import { Request, Response } from "express";
import { Reactions } from "../models/reaction.model";
import { STATUS_CODE } from "../config";
import { formatedError } from "../utils/formatedError";
import { Posts } from "../models/post.model";
import { Notifications } from "../models/notification.model";
import { Users } from "../models/user.models";
/*
 ** Create or update a reaction
 */
export const createReaction = async (req: Request, res: Response) => {
  try {
    const { postId, userId, interactionType } = req.body;

    // Check if the reaction already exists
    const reaction = await Reactions.findOne({ postId, userId });

    console.log("🚀 ~ createReaction ~ reaction:", reaction);
    // checking the conditions if the there is reaction already exits then check if the userId prevoulsy make that interaction.
    if (reaction && reaction?.interactionTypes?.includes(interactionType)) {
      // updating reaction interaction
      const updatedReaction = await Reactions.findByIdAndUpdate(
        reaction?._id,
        { $pull: { interactionTypes: interactionType } },
        { new: true, runValidators: true },
      );
      //incrementing react count
      await Posts.findByIdAndUpdate(
        postId,
        {
          $inc: { [`reactionCount.${interactionType}`]: -1 },
        },
        { runValidators: true },
      );
      return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: updatedReaction });
    } else if (reaction && !reaction?.interactionTypes?.includes(interactionType)) {
      // updating reaction interaction
      const updatedReaction = await Reactions.findByIdAndUpdate(
        reaction?._id,
        { $push: { interactionTypes: interactionType } },
        { new: true, runValidators: true },
      );
      // Increase the count for the reaction
      await Posts.findByIdAndUpdate(
        postId,
        {
          $inc: { [`reactionCount.${interactionType}`]: 1 },
        },
        { runValidators: true },
      );
      // getting user and post data
      const userData = await Users.findById(userId);
      const post = await Posts.findById(postId);

      // sending notification to post author user
      await Notifications.create({
        userId: post?.authorId,
        referenceId: postId,
        notificationTitle: "Post gets reacted",
        notificationBody: `${userData?.nickName} has reacted the following ${interactionType}`,
        notificationType: "POST_REACTION",
      });
      return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: updatedReaction });
    } else {
      // creating reaction
      const reaction = await Reactions.create({
        postId,
        userId,
        interactionTypes: [interactionType],
      });
      //incrementing react count
      await Posts.findByIdAndUpdate(postId, {
        $inc: { [`reactionCount.${interactionType}`]: 1 },
      });
      return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: reaction });
    }
  } catch (error: unknown) {
    console.log("🚀 ~ createReaction ~ error:", error);
    /*
     ** Formatted Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Get all reactions for a post
 */
export const getPostReactions = async (req: Request, res: Response) => {
  try {
    // getting id
    const { postId } = req.params;
    // getting reaction by post id
    const reactions = await Reactions.find({ postId });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: reactions });
  } catch (error: unknown) {
    console.log("🚀 ~ getPostReactions ~ error:", error);
    /*
     ** Formatted Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Get post all liked reactions users
 */
export const getPostLikedReaction = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    // getting post likes
    const reactions = await Reactions.find({
      postId,
      interactionTypes: { $in: ["LIKE"] },
    }).populate({
      path: "userId",
      select: "name nickName profileImage",
    });

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: reactions });
  } catch (error: unknown) {
    console.log("🚀 ~ getPostReactions ~ error:", error);
    /*
     ** Formatted Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Check if a user has reacted to a post
 */
export const getUserPostReaction = async (req: Request, res: Response) => {
  try {
    const { postId, userId } = req.params;
    // checking if user already reacted to this post
    const reaction = await Reactions.findOne({ postId, userId });

    if (!reaction) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Reaction not found" });
    }

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: reaction });
  } catch (error: unknown) {
    console.log("🚀 ~ getUserPostReaction ~ error:", error);
    /*
     ** Formatted Error
     */
    return formatedError(res, error);
  }
};
