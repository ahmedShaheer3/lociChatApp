import express from "express";

// import { checkSchemaError } from "../middleware/validations";
// import { createUserSchema, updateUserFcmSchema, updateUserSchema } from "../middleware/schemas/requestSchemas";
// import { apiAuthorizer, updateApiAuthorizer } from "../middleware/authorization";
import { createMessage } from "../controllers/chatController";

// DEFINE EXPRESS ROUTE
const router = express.Router();
/*
 ** USER ROUTES
 */
router.route("/").post(createMessage);
// router.route("/all").get(getRooms);
// router.route("/").get(getUser);
// router.route("/block/:userId").post(apiAuthorizer, toggleBlockUser);
// router.route("/block/:userId").get(apiAuthorizer, getBlockedUsers);
// router.route("/:userId").patch(updateApiAuthorizer, updateUserSchema, checkSchemaError, updateUser);
// router.route("/fcm/:userId").patch(apiAuthorizer, updateUserFcmSchema, checkSchemaError, updateUserFcm);
// router.route("/:userId").delete(apiAuthorizer, deleteUser);

export default router;
