import express from "express";
import { getAllNotifications, deleteNotification, deleteAllNotifications } from "../controllers/notificationController";
import { apiAuthorizer } from "../middleware/authorization";

const router = express.Router();

router.route("/:userId").get(apiAuthorizer, getAllNotifications);
router.route("/:userId/:notificationId").delete(apiAuthorizer, deleteNotification);
router.route("/:userId").delete(apiAuthorizer, deleteAllNotifications);

export default router;
