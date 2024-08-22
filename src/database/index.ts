import mongoose from "mongoose";
import { DATABASE_URL } from "../config";

export const connectToDatabase = async () => {
  try {
    console.log("starting new connection");
    await mongoose.connect(DATABASE_URL);
    console.log("Successfully connected to Database server");
  } catch (error) {
    console.log("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export const dbInstance = undefined;
