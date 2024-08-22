import mongoose from "mongoose";

export const gettingPostComments = (postId: string, limit: number, page: number) => [
  // Match comments for the given postId
  {
    $match: { postId: new mongoose.Types.ObjectId(postId), parentId: null },
  },
  // Sort comments by creation date (optional)
  {
    $sort: { createdAt: 1 },
  },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "parentId",
      as: "replies",
      pipeline: [
        { $sort: { createdAt: 1 } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
              {
                $project: {
                  email: 1,
                  profileImage: 1,
                  name: 1,
                  nickName: 1,
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            email: 1,
            profileImage: 1,
            name: 1,
            nickName: 1,
          },
        },
      ],
      as: "user",
    },
  },
  {
    $addFields: {
      user: {
        $arrayElemAt: ["$user", 0],
      },
    },
  },
  {
    $skip: (page - 1) * limit,
  },
  { $limit: limit },
];
