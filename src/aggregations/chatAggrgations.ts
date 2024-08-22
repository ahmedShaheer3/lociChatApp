import mongoose from "mongoose";

const chatAggregations = {
  getUserInbox: (userId: string) => [
    {
      $match: {
        "users.userId": new mongoose.Types.ObjectId(userId as string),
      },
    },
    {
      $unwind: "$users",
    },
    {
      $addFields: {
        unreadMsgCount: {
          $cond: {
            if: { $eq: ["$users.userId", new mongoose.Types.ObjectId(userId as string)] },
            then: "$users.unreadMsgCount",
            else: null,
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        users: {
          $push: {
            userId: {
              $cond: {
                if: { $ne: ["$users.userId", new mongoose.Types.ObjectId(userId as string)] },
                then: "$users.userId",
                else: "$$REMOVE",
              },
            },
            unreadMsgCount: {
              $cond: {
                if: { $eq: ["$users.userId", new mongoose.Types.ObjectId(userId as string)] },
                then: "$users.unreadMsgCount",
                else: "$$REMOVE",
              },
            },
          },
        },

        lastMessage: { $first: "$lastMessage" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        __v: { $first: "$__v" },
        lastMessageTimestamp: { $first: "$lastMessageTimestamp" },
      },
    },
    {
      $addFields: {
        field1: {
          $arrayElemAt: ["$users", 0],
        },
        field2: {
          $arrayElemAt: ["$users", 1],
        },
      },
    },
    {
      $addFields: {
        users: {
          $mergeObjects: ["$field1", "$field2"],
        },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "users.userId",
        foreignField: "_id",
        as: "user",
      },
    },

    {
      $project: {
        unreadMsgCount: "$users.unreadMsgCount",
        lastName: { $ifNull: [{ $arrayElemAt: ["$user.lastName", 0] }, ""] },
        firstName: { $ifNull: [{ $arrayElemAt: ["$user.firstName", 0] }, ""] },
        profileImage: { $ifNull: [{ $arrayElemAt: ["$user.profileImage", 0] }, ""] },
        userId: "$users.userId",
        inboxId: "$_id",
        lastMessage: 1,
        lastMessageTimestamp: 1,
        createdAt: 1,
        updatedAt: 1,
        isDeleted: { $cond: { if: { $eq: [{ $size: "$user" }, 0] }, then: true, else: false } },
      },
    },
  ],
};

export default chatAggregations;
