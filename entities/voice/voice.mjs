import ffmpeg from "fluent-ffmpeg";

export const VoiceService = {
  // Encode MP3 to OGG and create a readable stream
  createOggStream: function createOggStream(mp3FilePath) {
    return new Promise((resolve, reject) => {
      const oggStream = ffmpeg(mp3FilePath)
        .outputOptions("-acodec libopus")
        .format("ogg")
        .pipe();

      oggStream.on("error", (err) => {
        console.error("Encoding error:", err);
        reject(err);
      });

      resolve(oggStream);
    });
  },
};
