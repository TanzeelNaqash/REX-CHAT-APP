import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import setupSocket from "./socket.js";
import errorHandler from "./middleware/ErrorMiddleware.js";
import groupRoutes from "./routes/GroupRoutes.js";

// import callRoutes from "./routes/CallRoutes.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

// Middleware
app.use(
    cors({
        origin: process.env.ORIGIN,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    })
);

app.use(express.static("public"));
app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));
app.use("/uploads/backgrounds", express.static("uploads/backgrounds"));
app.use(cookieParser());
app.use(express.json());


app.set("view engine", "ejs");
app.set("views", path.join(path.resolve(), "views"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/group", groupRoutes);
// app.use("/api/call", callRoutes)

// app.get("/test-error", (req, res, next) => {
//     next(new Error("This is a test error"));
// });
app.get("/", (req, res) => {
    res.render("home"); 
});

app.use((request, response, next) => {
    const error = new Error("Not Found");
    error.status = 404;
    next(error);
});



app.use(errorHandler);

const server = app.listen(port, () => {
    console.log(`Server is running @ http://localhost:${port}`);
});

setupSocket(server);


mongoose
    .connect(databaseURL)
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(err.message));
