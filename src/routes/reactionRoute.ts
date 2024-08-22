import express from "express";
import { checkSchemaError } from "../middleware/validations";
import {
  createReaction,
  getPostLikedReaction,
  getPostReactions,
  getUserPostReaction,
} from "../controllers/reactionController";
import { reactionSchema } from "../middleware/schemas/requestSchemas";
import { apiAuthorizer } from "../middleware/authorization";

const router = express.Router();

router.route("/").post(apiAuthorizer, reactionSchema, checkSchemaError, createReaction);
router.route("/post/:postId").get(apiAuthorizer, getPostReactions);
router.route("/like/:postId").get(apiAuthorizer, getPostLikedReaction);
router.route("/:postId/:userId").get(apiAuthorizer, getUserPostReaction);

export default router;
