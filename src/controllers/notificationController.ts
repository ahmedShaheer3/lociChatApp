import { Request, Response } from "express";
import { Notifications } from "../models/notification.model";
import { STATUS_CODE } from "../config";
import { formatedError } from "../utils/formatedError";

export const getAllNotifications = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    // Getting total counts
    const totalNotifications = await Notifications.countDocuments({ userId });
    // Getting total pages according to limit provided
    const totalPages = Math.ceil(totalNotifications / limit);
    // Getting all notifications
    const notifications = await Notifications.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        items: notifications,
      },
    });
  } catch (error: unknown) {
    console.log("🚀 ~ getAllNotifications ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const { userId, notificationId } = req.params;

  try {
    await Notifications.deleteOne({ _id: notificationId, userId });
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Successfully deleted" });
  } catch (error: unknown) {
    console.log("🚀 ~ deleteNotification ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};

export const deleteAllNotifications = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    await Notifications.deleteMany({ userId });
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, message: "All notifications deleted successfully" });
  } catch (error: unknown) {
    console.log("🚀 ~ deleteAllNotifications ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
