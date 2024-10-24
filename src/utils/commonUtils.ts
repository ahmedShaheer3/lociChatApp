import { CognitoJwtVerifier } from "aws-jwt-verify";
import { JwtExpiredError } from "aws-jwt-verify/error";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import { CLIENT_ID, USER_POOL_ID } from "../config";
import { messaging } from "firebase-admin";
import { UserType } from "../types/entityTypes";

export class CommonUtils {
  /*
   ** Get unique array - remove duplicates
   */
  uniqueArray = <T>(array: T[]): T[] => {
    return array.filter((v, i, a) => a.indexOf(v) === i);
  };
  /*
   ** Shuffle arrays
   */
  shuffleArray = <T>(array: T[]): T[] => {
    let currentIndex = array.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };
  /*
   **
   To title case
   */
  toTitleCase = (text = "", allWords = false) => {
    if (allWords) {
      return text
        .split(" ")
        .map((item) => item[0].toUpperCase() + item.substring(1, item.length))
        .join(" ");
    }
    return text[0].toUpperCase() + text.substring(1, text.length);
  };
  /*
   **get unique object make array into object key value pair key would be the id
   */
  getUniqueObject = <T, Key extends keyof T>(data: T[], keyName: Key): Record<Key, T> => {
    const newData = {} as Record<Key, T>;
    data.forEach((item: T) => {
      newData[item[keyName] as Key] = { ...item };
    });
    return newData;
  };
  /*
   ** generating temp password
   */
  generateTempPass = (): string => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };
  /*
   ** Sending push notifications by firbase
   */
  sendPushNotification = async (
    user: UserType,
    title: string,
    body: string,
    chatRoomId: string,
    senderData: { username: string; profileImage: string; _id: string },
  ) => {
    // Ensure the user exists and has FCM tokens
    if (user && user.fcmTokens.length > 0) {
      const fcmTokens = user.fcmTokens.map((token) => token.fcmToken);
      console.log("🚀 ~ fcmTokens:", fcmTokens);

      // Prepare the notification payload for FCM
      const message = {
        notification: {
          title: title || "You have a new notification",
          body: body,
        },
        // Adding notificationType to custom data
        // Adding referenceId as string (since it's an ObjectId)
        data: {
          notificationType: "CHAT_MESSAGE",
          chatRoomId: chatRoomId,
          senderName: senderData?.username,
          senderImage: senderData?.profileImage,
          senderId: senderData?._id,
        },
        // Send notification to all of the user's registered devices
        tokens: fcmTokens,
      };

      // Send notification via Firebase Admin SDK
      try {
        const response = await messaging().sendMulticast(message);
        console.log(`Successfully sent ${response.responses} notifications`);
      } catch (error) {
        console.error("Error sending FCM notification:", error);
      }
    }
  };
}

export class AppUtils extends CommonUtils {
  constructor() {
    super();
  }
  /*
   ** Verifying cognito token
   */
  verifyCognitoToken = async (token: string, group?: string): Promise<CognitoAccessTokenPayload | undefined> => {
    try {
      console.log("token is:", token);

      // creating instace to verify token
      const verifier = CognitoJwtVerifier.create({
        userPoolId: USER_POOL_ID as string,
        tokenUse: "access",
        groups: group ? group : undefined,
        clientId: CLIENT_ID as string,
        includeRawJwtInErrors: true,
      });

      // verifying token
      const userData = await verifier.verify(token);
      return userData;
    } catch (error) {
      console.log("cognito verification failed", error);
      if (error instanceof JwtExpiredError) {
        throw new Error("Token Expired");
      } else {
        throw new Error("Token validation failed");
      }
    }
  };

  /*
   ** Verifying normal jwt Token
   */
  //   verifyJwtToken = (authorizationToken: string) => {
  //     // Spliting token from bearer token
  //     const token = authorizationToken.split(" ")[1];
  //     console.log("token:", token);
  //     const { payload } = jwt.decode(token, { complete: true });
  //     // getting current time stamp
  //     const currentTimestamp = Math.floor(Date.now() / 1000);
  //     // Get the token timestamp in seconds
  //     const expirationTimestamp = payload?.exp;
  //     //check wheater the token is expire or not
  //     if (currentTimestamp > expirationTimestamp) {
  //       throw new Error("Token expire");
  //     } else {
  //       return payload as { sub: string; exp: number };
  //     }
  //   };
  /*
   ** Verifying facebook token
   */
  //   verifyFaceBookToken = async (authorizationToken: string) => {
  //     try {
  //       // Spliting token from bearer token
  //       const token = authorizationToken.split(" ")[1];
  //       const url = `https://graph.facebook.com/v17.0/debug_token?input_token=${token}&access_token=966153207740123%7C4aJJISpbAabapainPiqe-WT8TnM`;

  //       // api call for facebook token validation
  //       const result = await axios.request({
  //         method: "get",
  //         maxBodyLength: Infinity,
  //         url,
  //         headers: {},
  //       });
  //       console.log("validating facebook token api call ", result?.data?.data);
  //       // getting current time stamp
  //       const currentTimestamp = Math.floor(Date.now() / 1000);
  //       //   // Get the current timestamp in seconds
  //       const expirationTimestamp = result?.data?.data?.expires_at;
  //       // checking token expiretion
  //       if (currentTimestamp > expirationTimestamp) {
  //         throw new Error("Toekn expired");
  //       }
  //       return result?.data?.data;
  //     } catch (error) {
  //       console.log("verifyFaceBookToken error", error);
  //       //   throw new Error(error);
  //     }
  //   };
  /*
   ** Getting diff of days between two dates
   */
  getDateDiffInDays = (date1: Date, date2: Date) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / msPerDay);
  };
  /*
   ** Getting unique data per day
   */
  getUniqueDataPerDay = (data: { createdAt: string }[]) => {
    // getting unique data on a single day
    const uniqueLogsByDate = new Map();
    data.forEach((log) => {
      const dateKey = log.createdAt.split("T")[0];
      if (!uniqueLogsByDate.has(dateKey)) {
        uniqueLogsByDate.set(dateKey, log);
      }
    });
    // Convert the map values back to an array if needed
    const uniqueLogsArray = Array.from(uniqueLogsByDate.values());
    return uniqueLogsArray;
  };
}
