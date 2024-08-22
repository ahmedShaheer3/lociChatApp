import mongoose from "mongoose";
import { locationType } from "../types/appTypes";

// GENERATE QUERY BASED ON LOCATION SEARCH
const getLocationQuery = (location: locationType) => {
  console.log("🚀 ~ getLocationQuery ~ location:", location.type, location.coordinates);

  // HANDLE POLYGON QUERY
  if (location.type === "Polygon") {
    return {
      $match: {
        location: {
          $geoWithin: {
            $geometry: {
              type: "Polygon",
              coordinates: [location.coordinates],
            },
          },
        },
      },
    };
  }
  // HANDLE POINT QUERY
  else if (location.type === "Point") {
    return {
      $geoNear: {
        near: {
          type: location.type,
          coordinates: location.coordinates,
        },
        maxDistance: location.maxDistance || 300,
        distanceField: "distance",
        spherical: true,
      },
    };
  } else {
    return {
      // BECAUSE EMPTY WAS GIVING ERROR
      $addFields: {},
    };
  }
};

// ALL AGGREGATIONS FOR POST APIS
const postAggregations = {
  getAllPosts: (location: locationType, userId: string) => {
    // QUERY FOR FILTERING WITH LOCATION
    const locationQuery = getLocationQuery(location);
    return [
      locationQuery,
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorData",
        },
      },
      {
        $unwind: {
          path: "$authorData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          taggedUsers: {
            $ifNull: ["$taggedUsers", []],
          },
        },
      },
      {
        $addFields: {
          isTaggedPost: {
            $in: [new mongoose.Types.ObjectId(userId), "$taggedUsers"], // if userId is in taggerUsers then isTaggedPost will be true else false
          },
        },
      },
      // { $skip: page * rows },
      // { $limit: rows },
    ];
  },
  getAllSavedPosts: (userId: string, page: number, rows: number) => [
    { $match: { userId: new mongoose.Types.ObjectId(userId as string) } },
    {
      $lookup: {
        from: "posts",
        localField: "postId",
        foreignField: "_id",
        as: "posts",
      },
    },
    { $unwind: "$posts" },
    {
      $replaceRoot: { newRoot: "$posts" },
    },
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "authorData",
      },
    },
    {
      $unwind: {
        path: "$authorData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        authorData: {
          $cond: {
            if: { $eq: [{ $type: "$authorData._id" }, "missing"] }, // Check if _id field exists in roomData
            then: { isDeleted: true },
            else: "$authorData",
          },
        },
      },
    },
    {
      $project: {
        authorId: 0,
        "authorData.cognitoId": 0,
        "authorData.privacyStatus": 0,
        "authorData.notification": 0,
        "authorData.fcmTokens": 0,
        "authorData.__v": 0,
        "authorData.updatedAt": 0,
        "authorData.blockedUsers": 0,
      },
    },
    {
      $skip: page * rows,
    },
    {
      $limit: rows,
    },
  ],
};

export default postAggregations;
