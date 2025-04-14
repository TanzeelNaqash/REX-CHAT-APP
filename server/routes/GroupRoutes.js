import { Router } from "express";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import { createGroup, getGroupMessages, getUserGroups } from "../controllers/GroupController.js";



const groupRoutes = Router()
groupRoutes.post("/create-group", verifyToken, createGroup);
groupRoutes.get("/get-user-groups", verifyToken, getUserGroups);
groupRoutes.get("/get-group-messages/:groupId", verifyToken, getGroupMessages);



export default groupRoutes