const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const cors = require("cors");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.post("/convert", upload.single("file"), (req, res) => {
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
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        } catch (e) {}
      });
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).send("Conversion failed");
    })
    .save(outputPath);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Running on " + PORT);
});