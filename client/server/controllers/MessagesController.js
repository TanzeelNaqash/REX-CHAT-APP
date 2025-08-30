import Message from "../models/MessagesModel.js";
import { mkdirSync, renameSync, unlinkSync } from "fs";
import path from "path";

export const getMessages = async (request, response, next) => {
    try {
     
        const user1 = request.userId;
        const user2 = request.body.id;
      if(!user1 || !user2 ) {
        const error = new Error("Both Users ID's are required!");
        error.status = 400;
        throw error;
      }
     

   const messages = await Message.find({
    $or: [
        {sender: user1, recipient: user2},
        {sender: user2, recipient: user1}
    ]
   }).sort({timestamp: 1});
      return response.status(200).json({messages})
    //   return response.status(200).send("User Logged out!")
    } catch (error) {
      console.log({ error });
     next(error)
    }
  };


  

export const uploadFile = async (request, response, next) => {
    try {
     
      if(!request.file) {
        const error = new Error("File is required!");
        error.status = 400;
        throw error;
      } 
      const date = Date.now()
      const fileDir = `uploads/files/${date}`
      const fileName = `${fileDir}/${request.file.originalname}`
      
      
      try {
        mkdirSync(fileDir,{recursive: true})
        renameSync(request.file.path, fileName)
      } catch (error) {
        console.error("Error saving file:", error);
        throw new Error("Failed to save the file");
      }
      return response.status(200).json({filePath:fileName})
    //   return response.status(200).send("User Logged out!")
    } catch (error) {
      // Clean up the temporary file if it exists
      if (request.file && request.file.path) {
        try {
          unlinkSync(request.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up temporary file:", cleanupError);
        }
      }
      console.error("File upload error:", error);
      next(error)
    }
  };

  