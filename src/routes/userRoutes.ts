import express from "express";
import {
  createUser,
  getUser,
  getAllUsers,
  updateUser,
  toggleBlockUser,
  getBlockedUsers,
  updateUserFcm,
} from "../controllers/userController";
import { checkSchemaError } from "../middleware/validations";
import { createUserSchema, updateUserFcmSchema, updateUserSchema } from "../middleware/schemas/requestSchemas";
import { apiAuthorizer, updateApiAuthorizer } from "../middleware/authorization";

// DEFINE EXPRESS ROUTE
const router = express.Router();
/*
 ** USER ROUTES
 */
router.route("/").post(createUserSchema, checkSchemaError, createUser);
router.route("/all").get(getAllUsers);
router.route("/").get(getUser);
router.route("/block/:userId").post(apiAuthorizer, toggleBlockUser);
router.route("/block/:userId").get(apiAuthorizer, getBlockedUsers);
router.route("/:userId").patch(updateApiAuthorizer, updateUserSchema, checkSchemaError, updateUser);
router.route("/fcm/:userId").patch(apiAuthorizer, updateUserFcmSchema, checkSchemaError, updateUserFcm);

export default router;
