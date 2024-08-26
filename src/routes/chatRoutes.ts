import express from "express";
import {
  createChatRoom,
  deleteChatRoom,
  getChatByUserIds,
  getUserChatRooms,
  resetUnreadCount,
} from "../controllers/chatRoom.Controller";
import { deleteMessage, getChatMessages, sendMessage } from "../controllers/chatMessages.Controller";
import {
  addNewMembersInGroupChat,
  createGroupChat,
  deleteGroupChat,
  leaveGroupChat,
  removeMembersInGroupChat,
} from "../controllers/groupChatRoom.controller";

// import { checkSchemaError } from "../middleware/validations";
// import { createUserSchema, updateUserFcmSchema, updateUserSchema } from "../middleware/schemas/requestSchemas";
// import { apiAuthorizer, updateApiAuthorizer } from "../middleware/authorization";

// DEFINE EXPRESS ROUTE
const router = express.Router();
/*
 ** CHAT ROUTES
 *
 */
router.route("/").post(createChatRoom);
router.route("/:userId").get(getUserChatRooms);
router.route("/").get(getChatByUserIds);
router.route("/group/count").patch(resetUnreadCount);
router.route("/:chatRoomId").delete(deleteChatRoom);
/*
 ** Group Chat Room Routes
 *
 */
router.route("/group").post(createGroupChat);
router.route("/group/leave/:chatRoomId/:memberId").patch(leaveGroupChat);
router.route("/group/add-member").patch(addNewMembersInGroupChat);
router.route("/group/remove-member").patch(removeMembersInGroupChat);
router.route("/group/:chatRoomId").delete(deleteGroupChat);
/*
 ** Messages Routes
 */
router.route("/message").post(sendMessage);
router.route("/message").get(getChatMessages);
router.route("/message/:messageId/:memberId").get(deleteMessage);

export default router;
