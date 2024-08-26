import express from "express";
import {
  createChatRoom,
  deleteChatRoom,
  getChatByUserIds,
  getUserChatRooms,
  resetUnreadCount,
} from "../controllers/chatRoom.Controller";
import {
  deleteMessage,
  deleteUserMessages,
  editMessage,
  getChatMessages,
  sendMessage,
} from "../controllers/chatMessages.Controller";
import {
  addNewMembersInGroupChat,
  createGroupChat,
  deleteGroupChat,
  leaveChatRoom,
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
router.route("/count").patch(resetUnreadCount);
router.route("/:chatRoomId").delete(deleteChatRoom);
router.route("/user-messages/:chatRoomId/:memberId").delete(deleteUserMessages);
/*
 ** Group Chat Room Routes
 *
 */
router.route("/group").post(createGroupChat);
router.route("/group/add-member").patch(addNewMembersInGroupChat);
router.route("/group/remove-member").patch(removeMembersInGroupChat);
router.route("/group/:chatRoomId").delete(deleteGroupChat);
router.route("/group/leave/:chatRoomId/:memberId").patch(leaveChatRoom);
/*
 ** Messages Routes
 */
router.route("/message").post(sendMessage);
router.route("/message").get(getChatMessages);
router.route("/message/:messageId/:memberId").patch(editMessage);
router.route("/message/:messageId/:memberId").delete(deleteMessage);

export default router;
