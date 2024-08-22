import express from "express";
import {
  createConnection,
  updateConnection,
  getFollowers,
  getFollowings,
  checkUserConnection,
  deleteConnection,
  getAllRequest,
  getConnection,
} from "../controllers/connectionController";
import { checkSchemaError } from "../middleware/validations";
import { createConnectionSchema, updateConnectionSchema } from "../middleware/schemas/requestSchemas";
import { apiAuthorizer } from "../middleware/authorization";

const router = express.Router();
/*
 ** CONNECTION ROUTES
 */
router.route("/").post(apiAuthorizer, createConnectionSchema, checkSchemaError, createConnection);
router.route("/:connectionId").patch(apiAuthorizer, updateConnectionSchema, checkSchemaError, updateConnection);
router.route("/:connectionId").delete(apiAuthorizer, deleteConnection);
router.route("/followers/:userId").get(apiAuthorizer, getFollowers);
router.route("/followings/:userId").get(apiAuthorizer, getFollowings);
router.route("/followings/:userId").get(apiAuthorizer, getFollowings);
router.route("/requests/:userId").get(apiAuthorizer, getAllRequest);
router.route("/:connectionId").get(apiAuthorizer, getConnection);
router.route("/").get(apiAuthorizer, checkUserConnection);

export default router;
