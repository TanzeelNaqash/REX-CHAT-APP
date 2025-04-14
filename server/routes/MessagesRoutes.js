import { Router } from "express";
import {  getMessages,  uploadFile } from "../controllers/MessagesController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import multer from "multer";

const upload = multer({dest:"uploads/backgrounds/"})
 
const messagesRoutes = Router();




messagesRoutes.post("/get-messages", verifyToken, getMessages);
messagesRoutes.post("/upload-file", verifyToken, upload.single("file"), uploadFile);
export default messagesRoutes;
