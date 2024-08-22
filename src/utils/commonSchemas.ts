import { body } from "express-validator";
import { Request } from "express";
/*
 ** Reusable email schema
 */
export const emailSchema = ({ dataIn = "body", required = true }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: true } },
  errorMessage: "Email is required",
  isString: {
    errorMessage: "Email must be a string",
    bail: true,
  },
  notEmpty: {
    options: { ignore_whitespace: true },
    errorMessage: "Email must not be empty",
    bail: true,
  },
  isEmail: {
    errorMessage: "Invalid email format",
    bail: true,
  },
  normalizeEmail: false,
  trim: true,
});

// reusable text schema for simple text
export const textSchema = ({ label = "", required = true }) => ({
  in: "body",
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: true } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
    bail: true,
  },
  notEmpty: {
    options: { ignore_whitespace: true },
    errorMessage: `${label} should not be empty`,
    bail: true,
  },
  isLength: {
    options: { max: 30 },
    errorMessage: `${label} must not be more than 30 characters`,
    bail: true,
  },
  trim: true,
});

// reusable text schema for simple text
export const dateSchema = ({ required = true }) => ({
  in: "body",
  optional: required ? null : { options: { nullable: true } },
  errorMessage: "dateOfBirth required",
  isISO8601: {
    errorMessage: "dateOfBirth must be a valid ISO 8601 date",
    bail: true,
  },
});
/*
 ** Reusable scehma function for userid, dogId, reviewerId
 */
export const idSchema = ({ dataIn = "body", label = "userId" }) => ({
  in: [dataIn],
  exists: { options: { checkNull: true, checkFalsy: true } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
    bail: true,
  },
  notEmpty: {
    options: { ignore_whitespace: true },
    errorMessage: `${label} Required`,
    bail: true,
  },
  isLength: {
    options: { max: 40 },
    errorMessage: `${label} must not be more than 40 characters`,
    bail: true,
  },
});
/*
 ** Reusable scehma function for bson id
 */
export const bsonIdSchema = ({ dataIn = "body", label = "userId" }) => ({
  in: [dataIn],
  exists: { options: { checkNull: true, checkFalsy: true } },
  errorMessage: `${label} required`,
  isMongoId: {
    errorMessage: `${label} is invalid`,
  },
});
/*
 ** Resuable gender schema
 */
export const genderSchema = ({ dataIn = "body", label = "", required = true }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: true } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
    bail: true,
  },
  matches: {
    options: [/\b(?:MALE|FEMALE|OTHER)\b/],
    errorMessage: `${label} should be MALE | FEMALE | OTHER`,
  },
});
/*
 ** Resuable privacy status schema
 */
export const privacyStatusSchema = ({ dataIn = "body", label = "", required = true }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: true } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
    bail: true,
  },
  matches: {
    options: [/\b(?:PUBLIC|PRIVATE)\b/],
    errorMessage: `${label} should be PUBLIC | PRIVATE`,
  },
});
/*
 ** Resuable account status schema
 */
export const accountStatusSchema = ({ dataIn = "body", label = "", required = true }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: true } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
    bail: true,
  },
  matches: {
    options: [/\b(?:ACTIVE|DISABLED)\b/],
    errorMessage: `${label} should be ACTIVE | DISABLED`,
  },
});
/*
 ** user profile image schema used for url validation
 */
export const urlSchema = ({ dataIn = "body", label = "userProfile", required = true }) => ({
  in: [dataIn],
  // exists: { options: { checkNull: true, checkFalsy: true } },
  optional: required ? null : { options: { nullable: true } },
  errorMessage: `${label} required`,
  isString: {
    errorMessage: `${label} must be string`,
  },
  notEmpty: {
    options: { ignore_whitespace: true },
    errorMessage: `${label} Required`,
    bail: true,
  },
  isURL: {
    errorMessage: `${label} invalid url`,
  },
});

/*
 ** Reusable schema for social schema
 */
export const socialTokenSchema = () => {
  return [
    body("socialTokens").optional().isArray().withMessage("SocialTokens must be an array if provided").bail(),
    body("socialTokens.*.socialId").optional().isString().withMessage("SocialId must be a string if provided"),
    body("socialTokens.*.socialPlatform")
      .optional()
      .isString()
      .withMessage("SocialPlatform must be a string if provided"),
  ];
};

export const connectionStatusSchema = ({ dataIn = "body", label = "connectionStatus", required = true }) => ({
  in: [dataIn],
  exists: required ? { options: { checkNull: true, checkFalsy: true } } : null,
  optional: required ? null : { options: { nullable: true } },
  errorMessage: `${label} is required`,
  isString: {
    errorMessage: `${label} must be a string`,
    bail: true,
  },
  matches: {
    options: [/\b(?:ACCEPTED|REJECTED)\b/],
    errorMessage: `${label} must be one of the following values: ACCEPTED, REJECTED`,
  },
});

interface Field {
  type: string;
  required?: boolean;
}

interface Fields {
  [key: string]: Field;
}

interface OptionsParams {
  req: Request;
  location: string;
  path: string;
}

export const objectSchemaFunc = ({
  dataIn = "body",
  label = "",
  required = true,
  fields = {} as Fields,
}: {
  dataIn?: "body" | "query" | "params";
  label?: string;
  required?: boolean;
  fields?: Fields;
}) => ({
  custom: {
    options: (value: string, { req, location, path }: OptionsParams) => {
      const extractedParamValue = req?.[dataIn]?.[label];

      if (!extractedParamValue && !required) {
        return value + req.body + location + path;
      }

      // IF FIELD IS REQUIRED AND NO VALUE IS FOUND THROW AN ERROR
      if (required && !extractedParamValue) {
        throw new Error(`${label} required`);
      }

      // IF FIELD IS NOT OBJECT THROW AN ERROR
      if (extractedParamValue && typeof extractedParamValue !== "object") {
        throw new Error(`${label} must be an object`);
      }

      const allowedFields: { [key: string]: string } = {};

      // MAP ALL ALLOWED FIELDS TO A VARIABLE
      for (const key in fields) {
        allowedFields[key] = key;
      }

      const keys = extractedParamValue ? Object.keys(extractedParamValue) : [];

      if (required && keys?.length == 0) {
        throw new Error(`${label} should not be an empty object`);
      }

      // THROW AN ERROR IF ANY OTHER VALUE IS PROVIDED EXCEPT FOR THE MENTIONED VALUES
      keys.forEach((value) => {
        if (!allowedFields[value]) {
          throw new Error(`Invalid key "${value}" in ${label}`);
        }
      });

      for (const key in fields) {
        const { type = "", required = true } = fields[key];
        console.debug(
          "type, required",
          type,
          required,
          // typeof actualValue,
          // 'IS ARRAY:',
          // Array.isArray(actualValue),
        );
        const actualValue = extractedParamValue ? extractedParamValue[key] : "";

        // IF TYPE IS ARRAY AND ACTUAL VALUE IS NOT OF TYPE ARRAY THROW ERROR
        if (type === "array" && !Array.isArray(actualValue) && required) {
          throw new Error(`${key} must be an array`);
        } else if (required && actualValue && typeof actualValue !== type && type !== "array") {
          // THROW AN ERROR IF VALUE TYPES OF KEYS OF GIVEN FIELDS ARE NOT EQUAL TO EXPECTED VALUE TYPES
          throw new Error(`${key} should be of type ${type}`);
        }

        // IF EMPTY OR NOT FOUND THROW ERROR
        if (required && !actualValue) {
          throw new Error(`${key} required in ${label}`);
        }
      }

      return value + req.body + location + path;
    },
  },
});
