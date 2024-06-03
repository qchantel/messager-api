import ffmpeg from "fluent-ffmpeg";
import { AIService } from "../ai/ai.service.mjs";
import { OpenAIService } from "../ai/openai.mjs";
import { ChatService } from "../chats/chats.service.mjs";

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
  getVoiceMessage: async function ({ msg, bot }) {
    const chatId = msg.chat.id;
    const voiceFileId = msg.voice.file_id;

    try {
      // Get the file path using the file_id
      const filePath = await bot.getFileLink(voiceFileId);

      // Use openAI to transcribe the voice message
      const transcription = await OpenAIService.speechToText(filePath);

      bot.sendChatAction(chatId, "record_voice");
      msg.text = transcription.text;
      await ChatService.answerUser(msg, bot);
    } catch (error) {
      console.error("Error downloading voice file:", error);
      bot.sendMessage(
        chatId,
        "An error occurred while processing your voice message."
      );
    }

    return;
  },
};
