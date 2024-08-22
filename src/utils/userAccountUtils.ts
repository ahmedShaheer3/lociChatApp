// import { APIGatewayEvent } from "aws-lambda";
// import { userAccountType } from "../models/userTypes";
// import { userServices } from "../databases";

// export class UserAccountUtils {
//   readonly DEFAULT_LANGUAGE_ENGLISH: string = "English";
//   readonly DEFAULT_LANGUAGE_GERMAN: string = "German";
//   readonly DEFAULT_COUNTRY_GERMANY: string = "Germany";

//   constructor() {
//     console.debug("UserAccountUtils constructor is called");
//   }
//   /*
//    ** Validating user before update if its exits or not
//    */
//   async validateUserForUpdate(
//     event: APIGatewayEvent & { body: { userId: string } }
//   ): Promise<userAccountType | undefined> {
//     try {
//       const { userId } = event.body;
//       if (!userId) {
//         throw new Error("userId required");
//       }
//       const userData = await userServices.getUser(userId);
//       if (!userData) {
//         throw new Error("User not found");
//       }
//       return userData as userAccountType;
//     } catch (err) {
//       console.debug("ERROr[VALIDATE_USER_FOR_UPDATE]", err);
//       throw new Error("Unable to validate userId");
//     }
//   }
// }
