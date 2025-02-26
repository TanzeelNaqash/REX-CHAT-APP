import { Router } from "express";
import { verifyToken } from "../middleware/AuthMiddleware.js";
import { getContactsForDmList, searchContacts } from "../controllers/ContactController.js";


const contactsRoutes = Router()
contactsRoutes.post("/search", verifyToken, searchContacts);
contactsRoutes.get("/get-contacts-for-dm", verifyToken, getContactsForDmList);


export default contactsRoutes