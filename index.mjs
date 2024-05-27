import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { OpenAIService } from "./entities/ai/openai.mjs";
import fs from "fs";
import { VoiceService } from "./entities/voice/voice.mjs";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const app = express();

// Store user state and context
const userState = {};

// Handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  console.log("polling", userState, msg);
  // Get the user's current state
  const state = userState[chatId] || {};
  //   const audioStream = await OpenAIService.speechToText(
  //     "Salut Lénouille ! Aujourd'hui on va manger avec ma maman et prendre le train à 15h54."
  //   );

  //   const response = await AIService.replyToChat([
  //     {
  //       role: "system",
  //       content: `You are called "Heem" and are now chatting with ${msg.from.first_name}. You are a friend of him/her, be nice and helpful. Never say you are an AI, if you can't perform an action, just say you don't know. `,
  //     },
  //     { role: "user", content: messageText },
  //   ]);

  //   await bot
  //     .sendAudio(chatId, audioStream, {
  //       caption: "Here is your audio file!",
  //       //   duration: 120, // Duration of the audio in seconds
  //       performer: "Artist Name",
  //       title: "Audio Title",
  //     })
  //     .then(() => {
  //       console.log("Audio sent successfully");
  //     })
  //     .catch((error) => {
  //       console.error("Error sending audio:", error);
  //     });

  // Read the audio file from the file system
  //   const audioPath = "/Users/quentinchantelot/heem/messager-api/speech.ogg";
  //   const audioStream = fs.createReadStream(audioPath);
  await bot.sendVoice(
    chatId,
    "https://assets-notice.b-cdn.net/output_path.ogg",
    {}
  );

  return;

  // Store the updated user state
  userState[chatId] = state;
});

async function sendVoiceMessage(chatId) {
  try {
    // const oggStream = fs.createReadStream(
    //   "/Users/quentinchantelot/heem/messager-api/entities/ai/example.ogg"
    // );

    await bot.sendVoice(
      chatId,
      "https://assets-notice.b-cdn.net/landing/dwsample1-opus.ogg",
      {
        duration: 75,
        caption: "Here is your voice message!",
      }
    );

    console.log("Voice message sent successfully");
  } catch (error) {
    console.error("Error sending voice message:", error);
  }
}

// async function sendVoiceMessage(chatId) {
//   try {
//     const oggStream = await VoiceService.createOggStream(
//       "/Users/quentinchantelot/heem/messager-api/entities/chats/ai/example.mp3"
//     );

//     await bot.sendVoice(chatId, oggStream, {
//       caption: "Here is your voice message!",
//       duration: 120, // Duration of the voice message in seconds
//     });

//     console.log("Voice message sent successfully");
//   } catch (error) {
//     console.error("Error sending voice message:", error);
//   }
// }

// Start the Express.js server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
function ffmpeg(mp3FilePath) {
  throw new Error("Function not implemented.");
}
