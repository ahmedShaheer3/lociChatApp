import express from "express";
import {
  addViewToPost,
  createPost,
  deletePost,
  getAllPosts,
  getAllPostsOfUser,
  getPostById,
  getUserSavedPosts,
  togglePost,
  updatePost,
} from "../controllers/postController";
import { apiAuthorizer } from "../middleware/authorization";
import { createPostSchema } from "../middleware/schemas/requestSchemas";
import { checkSchemaError } from "../middleware/validations";

// DEFINE EXPRESS ROUTE
const router = express.Router();

/*
 ** USER ROUTES
 */

router.route("/").post(apiAuthorizer, createPostSchema, checkSchemaError, createPost).get(apiAuthorizer, getAllPosts);
router.route("/user-saved-posts").get(apiAuthorizer, getUserSavedPosts);
router.route("/user/:id").get(apiAuthorizer, getAllPostsOfUser);
router.route("/add-view/:id").patch(apiAuthorizer, addViewToPost);
router.route("/:id").get(apiAuthorizer, getPostById).patch(apiAuthorizer, updatePost).delete(apiAuthorizer, deletePost);
router.route("/toggle-post").post(apiAuthorizer, togglePost);

export default router;
