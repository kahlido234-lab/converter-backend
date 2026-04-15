const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const cors = require("cors");
const fs = require("fs");

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup
const upload = multer({
  dest: "/tmp/",
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Health check route (VERY IMPORTANT for Railway)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Convert route
app.post("/convert", upload.single("file"), (req, res) => {
  try {
    // 🚨 VERY IMPORTANT CHECK
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const inputPath = req.file.path;
    const outputPath = `${inputPath}.mp3`;

    ffmpeg(inputPath)
      .toFormat("mp3")
      .on("end", () => {
        res.download(outputPath, "converted.mp3", () => {
          try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch (e) {
            console.log("cleanup error:", e);
          }
        });
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).send("Conversion failed");
      })
      .save(outputPath);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
});

// IMPORTANT: Use Railway port
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});