const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const cors = require("cors");
const fs = require("fs");


ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());

const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.post("/convert", upload.single("file"), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `${inputPath}.mp3`;

  ffmpeg(inputPath)
    .toFormat("mp3")
    .on("end", () => {
      res.download(outputPath, () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).send("Conversion failed");
    })
    .save(outputPath);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));