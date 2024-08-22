import { NextFunction, Request, Response } from "express";
import { FieldValidationError, validationResult } from "express-validator";
import { STATUS_CODE } from "../config";
/*
 ** checking is there any error of schema i.e is the input paramter coming are valid or not
 */
export const checkSchemaError = (req: Request, res: Response, next: NextFunction) => {
  // valiating error
  const errors = validationResult(req);
  console.log("🚀 ~ checkSchemaError ~ errors:", errors);
  console.log("CHECK_SCHEMA_ERROR", errors.array());
  if (!errors.isEmpty()) {
    return res.status(STATUS_CODE.NOT_ACCEPTABLE).json({
      errors: true,
      message: `${errors.array()[0].msg} provided for ${(errors.array()[0] as FieldValidationError).path}`,
    });
  }
  // moving to the next function
  next();
  return;
};
