import { FileService } from "../../files/files.service.mjs";
import { OpenAIService } from "../ai/openai.mjs";
import { CdnService } from "../cdn/cdn.service.mjs";
import { VoiceService } from "../voice/voice.mjs";
import { randomUUID } from "crypto";
import fs from "fs";

export const TelegramService = {
  sendVoice: async function sendVoiceMessage(chatId, bot) {
    try {
      const fileName = randomUUID();
      const filePath = await OpenAIService.createSpeechToTextFile(
        fileName,
        "Hello, how are you?"
      );

      // Convert the file to .ogg container
      const oggFilePath = await VoiceService.createOggFileFromMp3(filePath);

      // Upload the .ogg to a bucket
      const cdnPath = await CdnService.uploadFile(
        oggFilePath,
        fileName + ".ogg"
      );

      // Delete .mp3 and .ogg when it's done
      FileService.deleteFile(filePath);
      FileService.deleteFile(oggFilePath);

      await bot.sendVoice(chatId, cdnPath, {});

      console.log("Voice message sent successfully");
    } catch (error) {
      console.error("Error sending voice message:", error);
    }
  },
};
