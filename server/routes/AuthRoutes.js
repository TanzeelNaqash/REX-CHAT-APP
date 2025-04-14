 import {Router} from 'express'
 import { getUserInfo, login, signup , updateProfile, addProfileImage, removeProfileImage, logout, forgotPassword, verifyOTP, resetPassword, addBackgroundImage, removeBackgroundImage} from '../controllers/AuthController.js'
import { verifyToken } from '../middleware/AuthMiddleware.js';
import multer from "multer"
 

const upload = multer({dest:"uploads/profiles/"})
 
 const authRoutes = Router()
 authRoutes.post("/signup", signup); 
 authRoutes.post("/login", login); 
 authRoutes.get("/user-info", verifyToken, getUserInfo); 
 authRoutes.post("/update-profile", verifyToken, updateProfile); 
 authRoutes.post("/add-profile-image", verifyToken,upload.single("profile-image"), addProfileImage); 
 authRoutes.delete("/remove-profile-image", verifyToken, removeProfileImage); 
 authRoutes.post("/add-background-image", verifyToken,upload.single("background-image"), addBackgroundImage); 
 authRoutes.delete("/remove-background-image", verifyToken, removeBackgroundImage); 

 authRoutes.post("/logout", logout);
 authRoutes.post("/forgot-password", forgotPassword);
 authRoutes.post("/verify-otp", verifyOTP);
authRoutes.post("/reset-password", resetPassword);
 

 export default authRoutes;