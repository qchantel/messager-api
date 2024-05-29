import ffmpeg from "fluent-ffmpeg";

export const VoiceService = {
  createOggFileFromMp3: async function createOggFileFromMp3(mp3FilePath) {
    const targetPath = mp3FilePath.replace(".mp3", ".ogg");

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(mp3FilePath)
          .outputOptions([
            "-c:a libopus",
            "-b:a 32k",
            "-vbr on",
            "-compression_level 10",
            "-frame_duration 60",
            "-application voip",
          ])
          .output(targetPath)
          .on("end", () => {
            console.log("Transcoding finished successfully");
            resolve();
          })
          .on("error", (err) => {
            console.error("Error transcoding file:", err);
            reject(err);
          })
          .run();
      });

      return targetPath;
    } catch (error) {
      console.error("Error encoding file:", error);
      throw error;
    }
  },
};
