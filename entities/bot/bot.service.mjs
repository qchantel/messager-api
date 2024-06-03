import { FileService } from "../../files/files.service.mjs";
import { OpenAIService } from "../ai/openai.mjs";
import { CdnService } from "../cdn/cdn.service.mjs";
import { VoiceService } from "../voice/voice.mjs";
import { randomUUID } from "crypto";

export const TelegramService = {
  sendVoiceAIMessage: async function sendVoiceAIMessage(chatId, bot, text) {
    try {
      const fileName = randomUUID();
      const filePath = await OpenAIService.createTextToSpeech(fileName, text);

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
      return cdnPath;
    } catch (error) {
      console.error("Error sending voice message:", error);
    }
  },
  sendTextMessage: async function (chatId, bot, text) {
    try {
      await bot.sendMessage(chatId, text);
    } catch (error) {
      console.error("Error sending text message:", error);
    }
  },
};
