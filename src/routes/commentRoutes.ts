import express from "express";
import { checkSchemaError } from "../middleware/validations";
import {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  getPostComments,
} from "../controllers/commentController";
import { createCommentSchema, updateCommentSchema } from "../middleware/schemas/requestSchemas";
import { apiAuthorizer } from "../middleware/authorization";

const router = express.Router();
/*
 ** COMMENTS ROUTES
 */
router.route("/").post(apiAuthorizer, createCommentSchema, checkSchemaError, createComment);
router.route("/:commentId").patch(apiAuthorizer, updateCommentSchema, checkSchemaError, updateComment);
router.route("/post/:postId").get(apiAuthorizer, getPostComments);
router.route("/:commentId").delete(apiAuthorizer, deleteComment);
router.route("/like/:commentId").patch(apiAuthorizer, likeComment);

export default router;
