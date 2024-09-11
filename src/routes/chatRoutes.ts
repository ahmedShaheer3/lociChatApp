import express from "express";
import {
  createChatRoom,
  deleteChatRoom,
  getChatByUserIds,
  getChatMessages,
  getUserChatRooms,
  resetUnreadCount,
} from "../controllers/chatRoom.controller";
import { deleteMessage, deleteUserMessages, editMessage, sendMessage } from "../controllers/chatMessages.controller";
import {
  addNewMembersInGroupChat,
  createGroupChat,
  deleteGroupChat,
  leaveChatRoom,
  removeMembersInGroupChat,
  updateGroupDetails,
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
router.route("/user-messages/:chatRoomId/:memberId").delete(deleteUserMessages);
router.route("/count/:chatRoomId/:memberId").patch(resetUnreadCount);
router.route("/messages/:chatRoomId/:memberId").get(getChatMessages);
router.route("/:chatRoomId/:memberId").delete(deleteChatRoom);
/*
 ** Group Chat Room Routes
 *
 */
router.route("/group").post(createGroupChat);
router.route("/group").patch(updateGroupDetails);
router.route("/group/add-member").patch(addNewMembersInGroupChat);
router.route("/group/remove-member").patch(removeMembersInGroupChat);
router.route("/group/:chatRoomId").delete(deleteGroupChat);
router.route("/group/leave").patch(leaveChatRoom);
/*
 ** Messages Routes
 */
router.route("/message/:chatRoomId").post(sendMessage);
router.route("/message/:messageId/:memberId").patch(editMessage);
router.route("/message/:messageId/:memberId").delete(deleteMessage);
router.route("/messages/:chatRoomId/:memberId").delete(deleteUserMessages);

export default router;
