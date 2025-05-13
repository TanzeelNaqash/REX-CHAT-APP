import {Router} from 'express'
import { getUserInfo, login, signup , updateProfile, addProfileImage, removeProfileImage, logout, forgotPassword, verifyOTP, resetPassword, addBackgroundImage, removeBackgroundImage} from '../controllers/AuthController.js'
import { verifyToken } from '../middleware/AuthMiddleware.js';
import multer from "multer"
import { mkdirSync } from 'fs'
import path from 'path'

// Ensure upload directories exist
mkdirSync('uploads/profiles', { recursive: true })
mkdirSync('uploads/backgrounds', { recursive: true })

// Configure multer for profile image uploads
const profileUpload = multer({
  dest: 'uploads/profiles/',
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and SVG files are allowed.'))
    }
  }
})

// Configure multer for background image uploads
const backgroundUpload = multer({
  dest: 'uploads/backgrounds/',
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and SVG files are allowed.'))
    }
  }
})

const authRoutes = Router()
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/update-profile", verifyToken, updateProfile);
authRoutes.post("/add-profile-image", verifyToken, profileUpload.single("profile-image"), addProfileImage);
authRoutes.delete("/remove-profile-image", verifyToken, removeProfileImage);
authRoutes.post("/add-background-image", verifyToken, backgroundUpload.single("background-image"), addBackgroundImage);
authRoutes.delete("/remove-background-image", verifyToken, removeBackgroundImage);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/verify-otp", verifyOTP);
authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/logout", verifyToken, logout);
authRoutes.get("/get-user-info/:id", verifyToken, getUserInfo);
authRoutes.get("/get-user-info", verifyToken, getUserInfo);

export default authRoutes