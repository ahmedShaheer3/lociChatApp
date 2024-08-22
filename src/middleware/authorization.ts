import { NextFunction, Request, Response } from "express";
import { API_BYPASS_KEY, STATUS_CODE } from "../config";
import { appUtils } from "../utils";
import { Users } from "../models/user.models";
/*
 ** Validating jwt token
 */
export const apiAuthorizer = async (req: Request, res: Response, next: NextFunction) => {
  console.log("🚀 ~ apiAuthorizer ~ req:", req.headers);
  // if token not found in cookies, check if header contains Auth field
  const authHeader = req.headers.authorization || (req.headers.Authorization as string) || null;
  if (authHeader === API_BYPASS_KEY) {
    console.log("bypass due to api key");
    return next();
  }
  //checking token format
  if (authHeader && authHeader?.startsWith("Bearer ")) {
    console.log("allowed");
    try {
      // verifyning token by cognito verifyer
      const tokenData = await appUtils.verifyCognitoToken(authHeader?.split(" ")[1]);

      console.log("tokenData: in authorizer", tokenData);

      if (tokenData) {
        // checking the token user
        const isUser = await Users.findOne({ cognitoId: tokenData?.sub });
        console.log("isUser", isUser);
        if (!isUser) {
          throw new Error("Token user not found");
        }
        if (req.params.userId && req.params?.userId !== isUser._id?.toString()) {
          throw new Error("Token user does not match");
        }
        // checking user account status
        if (isUser.accountStatus !== "ACTIVE") {
          return res.status(STATUS_CODE.UNAUTHORIZED).json({
            error: true,
            message: `User account is ${isUser?.accountStatus?.toLowerCase()}`,
          });
        }
      }
      return next();
    } catch (error: unknown) {
      console.log("ERROR AUTHORIZATION admin", error);
      if (error instanceof Error) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          error: true,
          message: error.message,
        });
      }
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        error: true,
        message: "Unable to authorize",
      });
    }
  } else {
    return res.status(STATUS_CODE.UNAUTHORIZED).json({
      error: true,
      message: "Token missing or invalid token format",
    });
  }
};
/*
 ** user update api validation
 */
export const updateApiAuthorizer = async (req: Request, res: Response, next: NextFunction) => {
  console.log("🚀 ~ apiAuthorizer ~ req:", req.headers);
  // if token not found in cookies, check if header contains Auth field
  const authHeader = req.headers.authorization || (req.headers.Authorization as string) || null;
  if (authHeader === API_BYPASS_KEY) {
    console.log("bypass due to api key");
    return next();
  }
  //checking token format
  if (authHeader && authHeader?.startsWith("Bearer ")) {
    console.log("allowed");
    try {
      // verifyning token by cognito verifyer
      const tokenData = await appUtils.verifyCognitoToken(authHeader?.split(" ")[1]);

      console.log("tokenData: in authorizer", tokenData);

      if (tokenData) {
        // checking the token user
        const isUser = await Users.findOne({ cognitoId: tokenData?.sub });
        console.log("isUser", isUser);
        if (!isUser) {
          throw new Error("Token user not found");
        }
        console.log("req.params.userid", req.params.userId);
        console.log("isUser._id", isUser._id);
        if (req.params.userId && req.params?.userId !== isUser._id?.toString()) {
          throw new Error("Token user does not match");
        }
      }
      return next();
    } catch (error: unknown) {
      console.log("ERROR AUTHORIZATION admin", error);
      if (error instanceof Error) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          error: true,
          message: error.message,
        });
      }
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        error: true,
        message: "Unable to authorize",
      });
    }
  } else {
    return res.status(STATUS_CODE.UNAUTHORIZED).json({
      error: true,
      message: "Token missing or invalid token format",
    });
  }
};
/*
 ** Checking user roles i.e admin or user
 *
 */
export const isAdminRole = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || (req.headers.Authorization as string) || null;
  if (authHeader === API_BYPASS_KEY) {
    console.log("bypass due to api key");
    return next();
  }
  //checking token format
  if (authHeader && authHeader?.startsWith("Bearer ")) {
    console.log("allowed");
    try {
      // verifyning token by cognito verifyer
      const tokenData = await appUtils.verifyCognitoToken(authHeader?.split(" ")[1], "Admin");

      console.log("tokenData: in authorizer", tokenData);
      return next();
    } catch (error: unknown) {
      console.log("ERROR AUTHORIZATION admin", error);
      if (error instanceof Error) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          error: true,
          message: error.message,
        });
      }
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        error: true,
        message: "Unable to authorize",
      });
    }
  }
  next();
};

// export const isUserDisabale = (req: Request, res: Response, next: NextFunction) => {
//   console.log("THIS IS USER ACTIVE STATUS", req.user);
//   if (req?.user?.accountStatus !== "ACTIVE") {
//     return res.status(403).json({
//       error: true,
//       message: "User is not active unable to perform actions",
//     });
//   }
//   if (req?.user?.verificationStatus !== "VERIFIED") {
//     return res.status(403).json({
//       error: true,
//       message: "User is not verified",
//     });
//   }
//   next();
// };
