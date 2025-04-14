import Message from "../models/MessagesModel.js";
import { mkdirSync, renameSync} from "fs"
import User from "../models/UserModel.js";



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
      let fileDir = `uploads/files/${date}`
      let fileName = `${fileDir}/${request.file.originalname}`
      
      
      mkdirSync(fileDir,{recursive: true})
      renameSync(request.file.path, fileName)
      return response.status(200).json({filePath:fileName})
    //   return response.status(200).send("User Logged out!")
    } catch (error) {
      console.log({ error });
      next(error)
    }
  };

  