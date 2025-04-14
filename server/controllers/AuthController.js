import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { renameSync, unlinkSync } from "fs";
import OTP from "../models/OTPModel.js";
import bcrypt from "bcryptjs";

const { compare } = bcrypt;
import crypto from "crypto";
import nodemailer from "nodemailer";
import { sendMail } from "../mailer.js";
const maxAge = 3 * 24 * 60 * 60 * 1000;
const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};
export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      const error = new Error("Email and Password are required!");
      error.status = 400;
      throw error;
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("Email is already in use!");
      error.status = 409;
      throw error;
    }
      
    const user = await User.create({ email, password });
    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });
    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password)
      {
        const error = new Error("Email and Password are required!");
        error.status = 400;
        throw error;
      }
    
    const user = await User.findOne({ email });
    if (!user)  {
      const error = new Error("User not found!");
      error.status = 404;
      throw error;
    }
    const auth = await compare(password, user.password);
    if (!auth) {
      const error = new Error("Password is incorrect!");
      error.status = 400;
      throw error;
    } 
    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });
    return response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      const error = new Error("User with the given ID not found!");
      error.status = 404;
      throw error;
    }
      
    console.log("userdata", userData);
    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      backgroundImage: userData.backgroundImage,
    });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const { userId } = request;
    const { firstName, lastName, color } = request.body;
    if (!firstName || !lastName || color === undefined)
      {
        const error = new Error("First Name, Last Name and Color are required!");
        error.status = 400;
        throw error;
      }
     

    const userData = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        color,
        profileSetup: true,
      },
      { new: true, runValidators: true }
    );
    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const addProfileImage = async (request, response, next) => {
  try {
    if (!request.file) {
      const error = new Error("File is required!");
      error.status = 400;
      throw error;
    }   
    const date = Date.now();
    let fileName = "uploads/profiles/" + date + request.file.originalname;
    renameSync(request.file.path, fileName);
    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      { image: fileName },
      { new: true, runValidators: true }
    );
    return response.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const removeProfileImage = async (request, response, next) => {
  try {
    const { userId } = request;
    const user = await User.findById(userId);
    if (!user)  {
      const error = new Error("User not found!");
      error.status = 404;
      throw error;
    }  
    if (user.image) {
      unlinkSync(user.image);
    }
    user.image = null;
    await user.save();

    return response.status(200).send("Profile image Removed!");
  } catch (error) {
    console.log({ error });
    next(error);
  }
};
export const addBackgroundImage = async (request, response, next) => {
  try {
    if (!request.file) {
      const error = new Error("File is required!");
      error.status = 400;
      throw error;
    }   
    const date = Date.now();
    let fileName = "uploads/backgrounds/" + date + request.file.originalname;
    renameSync(request.file.path, fileName);
    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      { backgroundImage: fileName },
      { new: true, runValidators: true }
    );
    return response.status(200).json({
      backgroundImage: updatedUser.backgroundImage,
    });
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const removeBackgroundImage = async (request, response, next) => {
  try {
    const { userId } = request;
    const user = await User.findById(userId);
    if (!user){
      const error = new Error("User not found!");
      error.status = 404;
      throw error;
    }  
    if (user.backgroundImage) {
      unlinkSync(user.backgroundImage);
    }
    user.backgroundImage = null;
    await user.save();

    return response.status(200).send("background image Removed!");
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

export const logout = async (request, response, next) => {
  try {
    response.cookie("jwt", "", { maxAge: 1, secure: true, sameSite: "None" });
    return response.status(200).send("User Logged out!");
  } catch (error) {
    console.log({ error });
    next(error);
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const forgotPassword = async (request, response, next) => {
  try {
    const { email } = request.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found!");
      error.status = 404;
      throw error;
    }  
 

    const otp = crypto.randomInt(100000, 999999).toString(); 

    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    const mailSent = await sendMail(
      email,
      "Password Reset OTP",
      `Your OTP is: ${otp}`
    );

    if (!mailSent){
      const error = new Error("Failed to send OTP!");
      error.status = 500;
      throw error;
    }  

    response.status(200).json({ message: "OTP sent to email!" });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
export const verifyOTP = async (request, response, next) => {
  try {
    const { email, otp } = request.body;
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord || otpRecord.otp !== otp) {
      const error = new Error("Invalid or expired OTP!");
      error.status = 400;
      throw error;
    }
    response.status(200).json({ message: "OTP Verified!" });
  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPassword = async (request, response, next) => {
  try {
    const { email, newPassword } = request.body;
    const user = await User.findOne({ email });

    if (!user){
      const error = new Error("User not found!");
      error.status = 404;
      throw error;
    } 

    user.password = newPassword;
    await user.save();

    // Delete OTP after successful password reset
    await OTP.deleteOne({ email });

    response.status(200).json({ message: "Password reset successful!" });
  } catch (error) {
    next(error);
  }
};
