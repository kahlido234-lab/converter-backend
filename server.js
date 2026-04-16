const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const cors = require("cors");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

// ⚠️ IMPORTANT: ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }
});

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// ✅ Convert route
app.post("/convert", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const inputPath = req.file.path;
  const outputPath = `${inputPath}.mp3`;

  ffmpeg(inputPath)
    .toFormat("mp3")
    .on("end", () => {
      res.download(outputPath, "converted.mp3", (err) => {
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {
          console.log("Cleanup error:", e);
        }

        if (err) {
          console.error("Download error:", err);
        }
      });
    })
    .on("error", (err) => {
      console.error("FFmpeg error:", err);

      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      } catch (e) {}

      res.status(500).send("Conversion failed");
    })
    .save(outputPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});