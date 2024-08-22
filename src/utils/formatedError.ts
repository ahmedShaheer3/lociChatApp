import { Response } from "express";
import { STATUS_CODE } from "../config";
import { MongoServerError } from "mongodb";
import { Error as MongoError, MongooseError } from "mongoose";

export const formatedError = (
  res: Response,
  error: MongoError.ValidationError | MongoServerError | MongooseError | unknown,
) => {
  if (error instanceof Error && "code" in error && "keyPattern" in error) {
    /*
     ** Mongo server error handling
     */
    if (error.code === 11000 && error.keyPattern) {
      console.log("Duplicate key error:", error?.keyPattern);
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ error: true, message: `Duplicate key: ${Object.keys(error?.keyPattern)[0]}` });
    } else {
      return res.status(STATUS_CODE.INTERNAL_SERVER).json({ error: true, message: "Internal Server Error" });
    }
  } else if (error instanceof MongoError.ValidationError) {
    console.log("mongoose validation error", error.message);
    /*
     ** Mongoose validation error handling
     */
    return res.status(STATUS_CODE.NOT_ACCEPTABLE).json({ error: true, message: error.message });
  } else if (error instanceof MongooseError) {
    console.log("mongoose  error", error.message);

    /*
     ** Mongoose validation error handling
     */
    if (error?.name === "CastError") {
      return res
        .status(STATUS_CODE.NOT_ACCEPTABLE)
        .json({ error: true, message: "Invalid ObjectId or invalid BSON format" });
    }
    return res.status(STATUS_CODE.NOT_ACCEPTABLE).json({ error: true, message: error.message });
  } else {
    return res.status(STATUS_CODE.INTERNAL_SERVER).json({ error: true, message: "Internal Server Error" });
  }
};
