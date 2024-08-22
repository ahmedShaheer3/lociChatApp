import { Request, Response } from "express";
import logger from "../utils/logger";
import { deletePostById, getPostDataById, Posts, updatePostById } from "../models/post.model";
import { Connections } from "../models/connection.models";
import postAggregations from "../aggregations/postAggregation";
import { PipelineStage } from "mongoose";
import { SavedPosts } from "../models/savedPosts.model";
import { Users } from "../models/user.models";

/*
 ** CREATE POST
 */
const createPost = async (req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    console.log("🚀 ~ createPost ~ startOfDay:", startOfDay);
    console.log("🚀 ~ createPost ~ endOfDay:", endOfDay);

    // FIND POSTS OF USER WITHIN 300m, FOR SAME DATE
    const userPosts = await Posts.find({
      authorId: req.body.authorId,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: req.body.location.coordinates,
          },
          $maxDistance: 300,
        },
      },
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    console.log("🚀 ~ createPost ~ userPosts:", userPosts);

    if (userPosts.length > 9) {
      return res.status(400).json({
        error: true,
        message: "Unable to create post, only 10 posts allowed within 300 metres per day.",
      });
    }
    // CREATE POST IN DB
    const post = await Posts.create({ ...req.body });

    // UPDATE POST COUNT IN AUTHORS ID
    await Users.updateOne({ _id: post.authorId }, { $inc: { postCount: 1 } });

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error creating post: ", error);

    return res.status(400).json({ error: true, message: "Unable to create post" });
  }
};

/*
 ** GET ALL POSTS
 */
const getAllPosts = async (req: Request, res: Response) => {
  // const page = parseInt(req.query.page as string) - 1 || 0;
  // const rows = parseInt(req.query.rows as string) || 5;
  const { userId = "" } = req.query;
  console.log("QUERY PARAMS:", req.query);
  const location = req?.query?.location ? JSON.parse(req.query.location as string) : {};
  try {
    // PIPELINE FOR GET ALL POSTS
    const getAllPostsPipeline = postAggregations.getAllPosts(location, userId as string);

    // GET ALL POSTS FROM DB WITH AGGREGATE METHOD
    const posts = await Posts.aggregate(getAllPostsPipeline as PipelineStage[]);

    // // GET TOTAL POST COUNT
    // const totalPosts = await Posts.countDocuments({});

    // GET LIST OF FOLLOWED USERS
    const followedUsers = await Connections.find({ followerId: userId }).select("followingId");
    console.log("🚀 ~ getAllPosts ~ followedUsers:", followedUsers);

    const followedUserIds = followedUsers.map((connection) => connection.followingId.toString());

    // ADD FOLLOWED FLAG TO POSTS
    const postsWithFollowFlag = posts.map((post) => ({
      ...post,
      isPostByAFriend: followedUserIds.includes(post.authorId.toString()),
    }));

    console.log("🚀 ~ postsWithFollowFlag ~ postsWithFollowFlag:", postsWithFollowFlag);

    return res.status(200).json({
      success: true,
      data: postsWithFollowFlag,
      // total: totalPosts,
      // page: page + 1,
      // rows,
    });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error getting all posts: ", error);

    return res.status(400).json({ error: true, message: "Unable to get posts" });
  }
};

/*
 ** GET POST BY ID
 */
const getPostById = async (req: Request, res: Response) => {
  const postId = req.params.id;

  try {
    // GET POST FROM DB
    const post = await getPostDataById(postId);

    return res.status(200).json({
      success: true,
      data: post || {},
    });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error getting post: ", error);

    return res.status(400).json({ error: true, message: "Unable to get post" });
  }
};

/*
 ** UPDATE POST
 */
const updatePost = async (req: Request, res: Response) => {
  const postId = req.params.id;

  try {
    // GET POST FROM DB
    const post = await getPostDataById(postId);

    // THROW ERROR, IF POST IS NOT FOUND
    if (!post) {
      return res.status(400).json({
        error: true,
        message: "Post not found.",
      });
    }

    // UPDATE POST IN DB
    const updatedPost = await updatePostById(postId, { ...req.body });

    return res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error updating post: ", error);

    return res.status(400).json({ error: true, message: "Unable to update post" });
  }
};

/*
 ** DELETE POST
 */
const deletePost = async (req: Request, res: Response) => {
  const postId = req.params.id;

  try {
    // GET POST FROM DB
    const post = await getPostDataById(postId);

    // THROW ERROR, IF POST IS NOT FOUND
    if (!post) {
      return res.status(400).json({
        error: true,
        message: "Post not found.",
      });
    }

    // DELETE POST FROM DB
    await deletePostById(post?.authorId?.toString(), postId);

    // UPDATE POST COUNT IN AUTHORS ID
    await Users.updateOne({ _id: post.authorId }, { $inc: { postCount: -1 } });

    return res.status(200).json({
      success: true,
      message: "Deleted post successfully.",
    });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error deleting post: ", error);

    return res.status(400).json({ error: true, message: "Unable to delete post" });
  }
};

/*
 ** GET ALL POSTS OF USER
 */
const getAllPostsOfUser = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const page = parseInt(req.query.page as string) - 1 || 0;
  const rows = parseInt(req.query.rows as string) || 5;

  try {
    // GET ALL POSTS OF USER FROM DB
    const posts = await Posts.find({ authorId: userId })
      .skip(page * rows)
      .limit(rows);

    // GET TOTAL POST COUNT
    const totalPosts = await Posts.countDocuments({});

    return res.status(200).json({
      success: true,
      data: posts,
      total: totalPosts,
      page: page + 1,
      rows,
    });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error getting all posts of user: ", error);

    return res.status(400).json({ error: true, message: "Unable to get all user posts" });
  }
};

/*
 ** SAVE POST
 */
const togglePost = async (req: Request, res: Response) => {
  const { userId, postId, action } = req.body;

  try {
    // CHECK IF THE POST EXITS
    const post = await getPostDataById(postId);

    // IF POST NOT FOUND, THROW ERROR
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // IF ACTION IS SAVE
    if (action === "save") {
      // Check if the post is already saved
      const savedPost = await SavedPosts.findOne({ userId, postId });
      if (savedPost) {
        return res.status(400).json({ message: "Post already saved" });
      }

      // Save the post
      await SavedPosts.create({ userId, postId });

      return res.status(201).json({ message: "Post saved successfully" });
    } else if (action === "unsave") {
      // IF ACTION IS UNSAVE

      // UNSAVE THE POST
      const deletedSavedPost = await SavedPosts.findOneAndDelete({
        userId,
        postId,
      });

      if (!deletedSavedPost) {
        return res.status(404).json({ message: "Post not found in saved posts" });
      }

      return res.status(200).json({ message: "Post unsaved successfully" });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error saving post: ", error);

    return res.status(400).json({ error: true, message: "Unable to save post" });
  }
};

/*
 ** GET ALL OF USERS SAVED POSTS
 */
const getUserSavedPosts = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) - 1 || 0;
  const rows = parseInt(req.query.rows as string) || 5;
  const { userId } = req.query;
  try {
    // PIPELINE TO GET ALL SAVED POSTS
    const getAllSavedPostsPipeline = postAggregations.getAllSavedPosts(userId as string, page, rows);

    // GET ALL SAVED POSTS FROM DB WITH AGGREGATION PIPELINE
    const savedPosts = await SavedPosts.aggregate(getAllSavedPostsPipeline);

    // GET TOTAL COUNT OF SAVED POSTS
    const totalSavedPosts = await SavedPosts.countDocuments({ userId });

    const payload = {
      success: true,
      data: savedPosts,
      total: totalSavedPosts,
      page: page + 1,
      rows,
    };

    return res.status(200).json(payload);
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error getting saved posts: ", error);

    return res.status(400).json({ error: true, message: "Unable to get saved posts" });
  }
};

/*
 ** UPDATE POST
 */
const addViewToPost = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const { userId } = req.body;

  try {
    // GET POST FROM DB
    const post = await getPostDataById(postId);

    // THROW ERROR, IF POST IS NOT FOUND
    if (!post) {
      return res.status(400).json({
        error: true,
        message: "Post not found.",
      });
    }

    // CHECK IF POST IS ALREADY VIEWED
    const isAlreadyViewed = post.views?.find((uId) => uId.toString() == userId);

    // IF USER HAS ALREADY VIEWED, THROW ERROR
    if (isAlreadyViewed) {
      return res.status(400).json({
        error: true,
        message: "Post has already been viewed",
      });
    }

    // UPDATE POST IN DB
    await Posts.updateOne({ _id: postId }, { $push: { views: userId } });

    return res.status(200).json({
      success: true,
      message: "View added successfully",
    });
  } catch (error) {
    // PRINT ERROR LOGS
    logger.error("Error adding view to post: ", error);

    return res.status(400).json({ error: true, message: "Unable to add view to post" });
  }
};

export {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getAllPostsOfUser,
  togglePost,
  getUserSavedPosts,
  addViewToPost,
};
