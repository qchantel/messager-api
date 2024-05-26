import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { AIService } from "./entities/chats/ai/ai.service.mjs";

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

  const response = await AIService.replyToChat([
    {
      role: "system",
      content: `You are called "Heem" and are now chatting with ${msg.from.first_name}. You are a friend of him/her, be nice and helpful. Never say you are an AI, if you can't perform an action, just say you don't know. `,
    },
    { role: "user", content: messageText },
  ]);

  bot.sendMessage(chatId, response);

  return;

  // Process the received message and update the user's state
  if (messageText === "/start") {
    state.step = 1;
    bot.sendMessage(chatId, "Welcome! How can I assist you?");
  } else if (state.step === 1) {
    state.step = 2;
    state.name = messageText;
    bot.sendMessage(
      chatId,
      `Nice to meet you, ${state.name}! How old are you?`
    );
  } else if (state.step === 2) {
    state.age = Number(messageText);
    bot.sendMessage(
      chatId,
      `Thanks, ${state.name}! You are ${state.age} years old.`
    );
    // Add more conversation steps as needed
  }

  // Store the updated user state
  userState[chatId] = state;
});

// Start the Express.js server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
