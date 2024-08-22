import { Request, Response } from "express";
import { deleteUserById, Users } from "../models/user.models";
import { STATUS_CODE } from "../config";
import { formatedError } from "../utils/formatedError";
import { Reports } from "../models/report.model";
import { Posts } from "../models/post.model";

/*
 ** Create a new report
 */
export const createReport = async (req: Request, res: Response) => {
  const { postId, reporterId, reportedId, reportType, reasons, description } = req.body;

  try {
    // creating reports
    const report = await Reports.create({
      postId,
      reportedId,
      reporterId,
      reportType,
      reasons,
      description,
    });
    // updating reports count to the reported user
    await Users.findByIdAndUpdate(reportedId, { $inc: { reportCount: 1 } });
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: report });
  } catch (error: unknown) {
    console.log("🚀 ~ createReport ~ error:", error);

    return formatedError(res, error);
  }
};
/*
 ** Get all reports
 */
export const getAllReports = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const reason = req.query.reason || ("" as string);
  console.log("🚀 ~ getAllReports ~ reason:", reason);
  try {
    // getting total counts
    const totalReports = await Reports.countDocuments();
    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalReports / limit);
    // getting all reports with pagination
    const reports = await Reports.find({ reasons: { $regex: reason, $options: "i" } })
      .populate([
        { path: "reportedId", select: "name nickName profileImage email accountStatus reportCount warningCount" },
        { path: "reporterId", select: "name nickName profileImage email accountStatus" },
        { path: "postId", select: "authorId desciption media location" },
      ])
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        items: reports,
      },
    });
  } catch (error: unknown) {
    console.log("🚀 ~ getAllReports ~ error:", error);
    return formatedError(res, error);
  }
};
/*
 ** Get a report by ID
 */
export const getReportById = async (req: Request & { params: { reportId: string } }, res: Response) => {
  const { reportId } = req.params;
  try {
    // get the report
    const report = await Reports.findById(reportId).populate([
      { path: "reportedId", select: "name nickName profileImage email accountStatus reportCount warningCount" },
      { path: "reporterId", select: "name nickName profileImage email accountStatus" },
      { path: "postId", select: "authorId desciption media location" },
    ]);
    if (!report) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Report not found" });
    }
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: report });
  } catch (error: unknown) {
    console.log("🚀 ~ getReportById: error:", error);
    return formatedError(res, error);
  }
};
/*
 ** Get a report by Id
 */
export const getReportByUserId = async (req: Request & { params: { reportedId: string } }, res: Response) => {
  const { reportedId } = req.params;
  try {
    // getting report
    const report = await Reports.find({ reportedId }).populate([
      { path: "reportedId", select: "name nickName profileImage email accountStatus reportCount warningCount" },
      { path: "reporterId", select: "name nickName profileImage email accountStatus" },
      { path: "postId", select: "authorId desciption media location" },
    ]);
    if (!report) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "Report not found" });
    }
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: report });
  } catch (error: unknown) {
    console.log("🚀 ~ getReportById: error:", error);
    return formatedError(res, error);
  }
};
/*
 ** Update a report (e.g., change ticket status, add admin feedback)
 */
export const updateReport = async (req: Request & { params: { reportId: string } }, res: Response) => {
  const { reportId } = req.params;
  const { ticketStatus, adminFeedback, action } = req.body;

  try {
    // updating report ticket
    const report = await Reports.findByIdAndUpdate(
      reportId,
      { ticketStatus, adminFeedback },
      { new: true, runValidators: true },
    ).populate("reportedId");
    if (action === "BANNED" && report?.reportType === "USER") {
      // UPDATE USER RECORD IN DB
      await Users.findByIdAndUpdate(
        report?.reportedId,
        {
          accountStatus: "BANNED",
        },
        { new: true, runValidators: true },
      );
    } else if (action === "REMOVE" && report?.reportType === "USER") {
      // deleting user
      await deleteUserById(report?.reportedId?.toString());
    } else if (action === "WARN") {
      // UPDATE USER RECORD IN DB
      await Users.findByIdAndUpdate(report?.reportedId, { $inc: { warningCount: 1 } });
    } else if (action === "REMOVE" && report?.reportType === "POST") {
      // deleteing post
      await Posts.findByIdAndDelete(report?.postId);
    }

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Report successfully updated" });
  } catch (error: unknown) {
    return formatedError(res, error);
  }
};
