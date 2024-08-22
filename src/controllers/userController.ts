import { Request, Response } from "express";
import { deleteUserById, Users } from "../models/user.models";
import { creatUserType } from "../types/incomingDataType";
import logger from "../utils/logger";
import { STATUS_CODE } from "../config";
import { formatedError } from "../utils/formatedError";

/*
 ** Creating user in database
 */
export const createUser = async (req: Request, res: Response) => {
  const { email, cognitoId, socialTokens = [] } = req.body as creatUserType;

  try {
    // constructing data
    const userData = {
      cognitoId,
      socialTokens,
      email: email?.toLowerCase(),
    };
    // creating data
    const user = await Users.create(userData);
    console.log("🚀 ~ createUser ~ user:", user);
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: user });
  } catch (error: unknown) {
    console.log("🚀 ~ getUserData ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** updating user in database
 */
export const updateUser = async (req: Request & { params: { userId: string } }, res: Response) => {
  const userId = req.params.userId;
  const { profileImage, name, nickName, profileDescription, privacyStatus, gender, dateOfBirth } = req.body;

  console.log("🚀 ~ updatingData ~ userId:", userId);
  console.log("🚀 ~ updatingData ~ req.body:", req.body);

  try {
    // validation user
    const userData = await Users.findOne({ _id: userId });
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "user with id not found" });
    }
    // UPDATE USER RECORD IN DB
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      {
        profileDescription,
        profileImage,
        name,
        nickName,
        privacyStatus,
        accountStatus: userData?.accountStatus === "NOT-ACTIVE" ? "ACTIVE" : undefined,
        gender,
        dateOfBirth,
      },
      { new: true, runValidators: true },
    );
    console.log("🚀 ~ updateUser ~ updatedUser:", updatedUser);
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: updatedUser });
  } catch (error: unknown) {
    console.log("🚀 ~ getUserData ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** delete user in database
 */
export const deleteUser = async (req: Request & { params: { userId: string } }, res: Response) => {
  const userId = req.params.userId;
  console.log("🚀 ~ updatingData ~ userId:", userId);

  try {
    // validation user
    const userData = await Users.findOne({ _id: userId });
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "user with id not found" });
    }
    // deleting user
    await deleteUserById(userId);

    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: "Successfully deleted" });
  } catch (error: unknown) {
    console.log("🚀 ~ deleteUser ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Get  user data by id
 */
export const getUser = async (req: Request & { params: { userId: string } }, res: Response) => {
  const { userId, cognitoId } = req.query;
  logger.info("This is an info message");

  try {
    let userData;
    // getting user data by id or by cognito id
    if (userId) {
      userData = await Users.findOne({ _id: userId });
    } else if (cognitoId) {
      userData = await Users.findOne({ cognitoId: cognitoId });
    }

    console.log("🚀 ~ getUser ~ userData:", userData);
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: userData });
  } catch (error: unknown) {
    console.log("🚀 ~ getUserData ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Get all users data
 */
export const getAllUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    logger.info("This is an info message");
    // getting total counts
    const totalUsers = await Users.countDocuments();
    // getting total pages according to limit provided
    const totalPages = Math.ceil(totalUsers / limit);
    // getting data
    const userData = await Users.find()
      .skip((page - 1) * limit)
      .limit(limit);
    console.log("🚀 ~ getAllUsers ~ userData:", userData);
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        totalPages,
        page,
        limit,
        items: userData,
      },
    });
  } catch (error: unknown) {
    console.log("🚀 ~ getUserData ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** block user
 */
export const toggleBlockUser = async (req: Request, res: Response) => {
  const blockerId = req.params.userId;
  const { blockedId } = req.body;

  try {
    /*
     ** Checking if the blocked user exists
     */
    const blockedUserData = await Users.findById(blockedId);
    if (!blockedUserData) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Blocked user with the specified ID not found" });
    }

    /*
     ** Checking if the blocker user exists
     */
    const blockerUserData = await Users.findById(blockerId);
    if (!blockerUserData) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Blocker user with the specified ID not found" });
    }

    /*
     ** Checking if the blocked user is already in the blocker's blocked list
     */
    const isAlreadyBlocked = blockerUserData.blockedUsers.some((user) => user.toString() === blockedId);

    if (isAlreadyBlocked) {
      // If already blocked, remove the blocked user
      await Users.findByIdAndUpdate(
        blockerId,
        { $pull: { blockedUsers: blockedUserData._id } },
        { new: true, runValidators: true },
      );
      return res.status(200).json({ success: true, message: "User has been unblocked" });
    } else {
      await Users.findByIdAndUpdate(
        blockerId,
        { $push: { blockedUsers: blockedUserData._id } },
        { new: true, runValidators: true },
      );
      return res.status(200).json({ success: true, message: "User has been blocked" });
    }
  } catch (error: unknown) {
    console.log("🚀 ~ toggleBlockUser ~ error:", error);
    /*
     ** Formatted Error
     */
    return formatedError(res, error);
  }
};
/*
 ** Get all blocked users
 */
export const getBlockedUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    logger.info("This is an info message");
    // Find the user by ID and populate the blockedUsers field
    const userData = await Users.findById(userId).populate({
      path: "blockedUsers",
      select: "name nickName profileImage",
    });

    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "User not found" });
    }
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, data: userData });
  } catch (error: unknown) {
    console.log("🚀 ~ getBlockedUsers ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
/*
 ** updating user fcm token
 */
export const updateUserFcm = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { fcmToken, deviceId, isFcmUpdate } = req.body;

  try {
    // validation user
    const userData = await Users.findById(userId);
    console.log("🚀 ~ updateUserFcm ~ userData:", userData);
    if (!userData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ success: false, message: "user with id not found" });
    }
    let tempFcmTokens = [];

    if (isFcmUpdate) {
      // limiting user only to insert five token at a time meaning user can login 5 device at a time
      if (userData?.fcmTokens?.length === 5) {
        return res
          .status(STATUS_CODE.BAD_REQUEST)
          .json({ error: true, message: "User login limit exceed. you need to logout from previous device" });
      } else {
        // filtering data to data the previous added token on device id
        tempFcmTokens = userData.fcmTokens.filter((fcm) => fcm.deviceId !== deviceId);
        // pusing new token
        tempFcmTokens.push({ deviceId, fcmToken });
      }
    } else {
      // getting all token other then privided device id
      tempFcmTokens = userData.fcmTokens.filter((fcm) => fcm.deviceId !== deviceId);
    }
    console.log("tempFcmTokens:", tempFcmTokens);
    // saving tokens
    await Users.findByIdAndUpdate(
      userId,
      {
        fcmTokens: tempFcmTokens,
      },
      { new: true, runValidators: true },
    );
    return res.status(STATUS_CODE.SUCCESS).json({ success: true, message: "Token successfully updated" });
  } catch (error: unknown) {
    console.log("🚀 ~ getUserData ~ error:", error);
    /*
     ** Formated Error
     */
    return formatedError(res, error);
  }
};
