import express from "express";

import { checkSchemaError } from "../middleware/validations";

import {
  createReport,
  getAllReports,
  getReportById,
  getReportByUserId,
  updateReport,
} from "../controllers/reportController";
import { createReportSchema, updateReportSchema } from "../middleware/schemas/requestSchemas";
import { apiAuthorizer, isAdminRole } from "../middleware/authorization";

const router = express.Router();

/*
 ** REPORT ROUTES
 */
router.route("/").post(apiAuthorizer, createReportSchema, checkSchemaError, createReport);
router.route("/all").get(isAdminRole, getAllReports);
router.route("/:reportId").get(isAdminRole, getReportById);
router.route("/user/:reportedId").get(isAdminRole, getReportByUserId);
router.route("/:reportId").patch(isAdminRole, updateReportSchema, checkSchemaError, updateReport);

export default router;
