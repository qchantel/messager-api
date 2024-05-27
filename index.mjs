import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { TelegramService } from "./entities/bot/bot.service.mjs";

const app = express();

// Store user state and context
const userState = {};
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  console.log("polling", userState, msg);
  // Get the user's current state
  //   const state = userState[chatId] || {};
  TelegramService.sendVoice(chatId, bot);

  return;
});

// Start the Express.js server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
