import { Router } from "express";
import { getMessages, uploadFile } from "../controllers/MessagesController.js";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import multer from "multer";
import { mkdirSync } from "fs";
import path from "path";

// Ensure upload directories exist
mkdirSync('uploads/files', { recursive: true });

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/files/',
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now since we're handling different types of files
    cb(null, true);
  }
});
 
const messagesRoutes = Router();

messagesRoutes.post("/get-messages", verifyToken, getMessages);
messagesRoutes.post("/upload-file", verifyToken, upload.single("file"), uploadFile);

export default messagesRoutes;
