import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const app = express();

// Store user state and context
const userState = {};

// Handle incoming messages
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  console.log("polling");
  // Get the user's current state
  const state = userState[chatId] || {};

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
