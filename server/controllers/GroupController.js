import mongoose from "mongoose";
import Group from "../models/GroupModel.js";
import User from "../models/UserModel.js";

export const createGroup = async (request, response, next) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;
    const admin = await User.findById(userId);

    if (!admin) {
      const error = new Error("Admin User not found!");
      error.status = 400;
      throw error;
    }
    const validatMembers = await User.find({ _id: { $in: members } });
    if (validatMembers.length !== members.length) {
      const error = new Error("Some Members aren't valid Users!");
      error.status = 400;
      throw error;
    }
    const newGroup = new Group({
      name,
      members,
      admin: userId,
    });
    await newGroup.save();
    return response.status(201).json({ Group: newGroup });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const getUserGroups = async (request, response, next) => {
    try {
      const userId = new mongoose.Types.ObjectId(request.userId)
      const groups = await Group.find({
        $or: [{ admin: userId}, {members: userId}],
      }).sort({updatedAt: -1})
      return response.status(201).json({ groups});
    } catch (error) {
      console.log({ error });
      next(error);
    }
  };
  
export const getGroupMessages = async (request, response, next) => {
    try {
      const {groupId} = request.params;
    
      const group = await Group.findById(groupId).populate({
        path: "messages",
        populate: {
          path: "sender",
          select: "firstName lastName email _id image color",

        }
      })
  if(!group){
    return response.status(404).send("group not found")
  }
  const messages = group.messages
      return response.status(201).json({ messages});
    } catch (error) {
      console.log({ error });
      next(error);
    }
  };
  