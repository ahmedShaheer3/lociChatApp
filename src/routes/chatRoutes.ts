import express from "express";
import {
  addNewMembersInGroupChat,
  createChatRoom,
  createGroupChat,
  deleteChatRoom,
  deleteGroupChat,
  getChatByUserIds,
  getUserChatRooms,
  leaveGroupChat,
  removeMembersInGroupChat,
  resetUnreadCount,
} from "../controllers/chatRoom.Controller";
import { deleteMessage, getChatMessages, sendMessage } from "../controllers/chatMessages.Controller";

// import { checkSchemaError } from "../middleware/validations";
// import { createUserSchema, updateUserFcmSchema, updateUserSchema } from "../middleware/schemas/requestSchemas";
// import { apiAuthorizer, updateApiAuthorizer } from "../middleware/authorization";

// DEFINE EXPRESS ROUTE
const router = express.Router();
/*
 ** CHAT ROUTES
 */
router.route("/").post(createChatRoom);
router.route("/group").post(createGroupChat);
router.route("/:userId").get(getUserChatRooms);
router.route("/").get(getChatByUserIds);
router.route("/group/count").patch(resetUnreadCount);
router.route("/group/leave/:chatRoomId/:memberId").patch(leaveGroupChat);
router.route("/group/add-member").patch(addNewMembersInGroupChat);
router.route("/group/remove-member").patch(removeMembersInGroupChat);
router.route("/group/:chatRoomId").delete(deleteGroupChat);
router.route("/:chatRoomId").delete(deleteChatRoom);
/*
 ** Messages
 */
router.route("/message").post(sendMessage);
router.route("/message").get(getChatMessages);
router.route("/message/:messageId/:memberId").get(deleteMessage);

export default router;
