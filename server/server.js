import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import setupSocket from "./socket.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import multer from "multer"; // Importing multer
import ffmpeg from "fluent-ffmpeg"; // Importing fluent-ffmpeg
import path from "path"; // Path module for file handling

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/videos/"); // Store uploaded videos in the 'uploads/videos' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`); // Create unique filenames
    },
});

const upload = multer({ storage });

// Middleware
app.use(
    cors({
        origin: [process.env.ORIGIN],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    })
);
app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));
app.use("/uploads/backgrounds", express.static("uploads/backgrounds"));
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
//To check the health of backend container
app.get('/health', (req, res) => {
    res.status(200).send('Healthy');
});
// Video upload and conversion route
app.post("/upload-video", upload.single("video"), (req, res) => {
    const videoPath = req.file.path; // Get the path of the uploaded video
    const outputDir = path.join("uploads", "converted_videos"); // Output directory for converted files

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Define output paths for HLS or DASH formats
    const hlsOutput = path.join(outputDir, "output.m3u8"); // HLS format
    const dashOutput = path.join(outputDir, "output.mpd"); // DASH format

    // Convert video to HLS format using FFmpeg
    ffmpeg(videoPath)
    .output(hlsOutput)
    .outputOptions([
      "-preset fast",
      "-g 60",
      "-hls_time 10",
      "-hls_list_size 0",
      "-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"),
    ])
    .output(dashOutput)
    .outputOptions([
      "-preset fast",
      "-f dash", // DASH output format
      "-dash_segment_filename", path.join(outputDir, "segment_$Number$.m4s"),
      "-segment_format mp4"
    ])
    .on("end", () => {
      console.log("HLS and DASH conversion finished!");
      res.json({
        message: "Video uploaded and converted to HLS/DASH format successfully",
        hls: hlsOutput,
        dash: dashOutput,
      });
    })
    .on("error", (err) => {
      console.error("Error converting video: ", err);
      res.status(500).json({ error: "Error converting video" });
    })
    .run();
  
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running @ http://localhost:${port}`);
});


setupSocket(server);

mongoose.connect(databaseURL).then(() => console.log("DB connected")).catch((err) => console.log(err.message));
