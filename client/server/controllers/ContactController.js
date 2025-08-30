import mongoose from "mongoose";
import User from "../models/UserModel.js";
import Message from "../models/MessagesModel.js";

export const searchContacts = async (request, response, next) => {
  try {
    const { searchTerm } = request.body;
    if (searchTerm === undefined || null) {
      const error = new Error("searchTerm is required!");
      error.status = 400;
      throw error;
    } 
    const sanitizedSearchterm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(sanitizedSearchterm, "i");

    const contacts = await User.find({
      $and: [
        { _id: { $ne: request.userId } },
        {
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
        },
      ],
    });
    return response.status(200).json({ contacts });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const getContactsForDmList = async (request, response, next) => {
  try {
    let { userId } = request;
    userId = new mongoose.Types.ObjectId(userId);
    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessgaeTime: { $first: "$timestamp" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      {
        $unwind: "$contactInfo",
      },
      {
        $project: {
          _id: 1,
          lastMessgaeTime: 1,
          email: "$contactInfo.email",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
        },
      },
      {
        $sort: { lastMessgaeTime: -1 },
      },
    ]);
    return response.status(200).json({ contacts });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};


export const getAllContacts = async (request, response, next) => {
  try {
    const users = await User.find(
      { _id: { $ne: request.userId } },
      "firstName lastName image color _id email"
    );
console.log("users",users)
    const contacts = users.map((user) => ({
      label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email, 
      value: user._id, 
      image: user.image ? `http://localhost:${process.env.PORT}/${user.image}` : null,
      color: user.color,
    }));

    console.log("contats:", contacts);
    

    return response.status(200).json({ contacts });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};
