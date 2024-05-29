import "express-async-errors";

import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { TelegramService } from "./entities/bot/bot.service.mjs";
import { AIService } from "./entities/ai/ai.service.mjs";
import { MongoDB } from "./db/mongodb.mjs";
import { UsersService } from "./entities/users/users.service.mjs";
import { WeatherService } from "./entities/weather/weather.service.mjs";
import { ChatService } from "./entities/chats/chats.service.mjs";

const app = express();

// Store user state and context
const userState = {};
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Ping MongoDB
await MongoDB.ping();

// Migrate if needed
await MongoDB.migrate();

// Create the indexes
await MongoDB.createIndexes();

// Avoid rate-limiting the proxy itself
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

// Request location permission
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const keyboard = [[{ text: "Share Location 📍", request_location: true }]];
  const replyMarkup = {
    keyboard: keyboard,
    one_time_keyboard: true,
  };

  bot.sendMessage(chatId, "👋 hey, mind sharing your location?", {
    reply_markup: replyMarkup,
  });
});

// Request location permission
bot.onText(/\/hello/, async (msg) => {
  bot.sendMessage(msg.chat.id, "👋 hey ho, hello");
});

// Request location permission
bot.onText(/\/daily/, async (msg) => {
  const telegramUserId = msg.from.id;
  const chatId = msg.chat.id;

  const { answer, selectedNews } =
    await ChatService.generateFirstMessageOfTheDay(
      {
        telegramUserId,
      },
      bot
    );

  await TelegramService.sendVoiceAIMessage(chatId, bot, answer);

  await bot.sendMessage(
    chatId,
    `Link to articles below for more info:
${selectedNews
  .map((news) => `👉 <a href='${news.url}'>${news.title}</a>\n`)
  .join("")}
    `,
    {
      parse_mode: "HTML",
    }
  );
});

// Handle incoming messages
bot.on("message", async (msg) => {
  try {
    const telegramUserId = msg.from.id;

    const user = await UsersService.findOrCreateUser({
      telegramUserId,
      from: msg.from,
    });

    const chatId = msg.chat.id;

    const messageText = msg.text;

    console.log("polling", userState, msg);

    return;
  } catch (e) {
    console.error(e);
  }
});

// Handle the location message
bot.on("location", async (msg) => {
  const chatId = msg.chat.id;
  const location = msg.location;
  const latitude = location.latitude;
  const longitude = location.longitude;

  const place = await WeatherService.getLocationFromCoordinates({
    latitude,
    longitude,
  });

  await MongoDB.users.updateOne(
    { telegramUserId: msg.from.id },
    {
      $set: {
        location: {
          longitude,
          latitude,
          city: place.name,
          country: place.country,
        },
      },
    }
  );

  const answer = await AIService.simpleCompletion(
    `The user just shared their location, they are in ${place.name}. 

    Start your answer by "Got it! Thanks.".
    Make a one line mocking comment about the place to greet the user.
    Don't ask any question to the user.

    After the comment tell the user that if they want to change it, they just have to share their location again.

    Write in the country language of the place, this is the code: ${place.country}`
  );

  TelegramService.sendVoiceAIMessage(chatId, bot, answer);

  //   bot.sendMessage(
  //     chatId,
  //     `Got it ${msg.from.first_name}, ${place.name} is a nice place!`
  //   );
});

app.use((err, req, res, next) => {
  if (err.message === "access denied") {
    res.status(403);
    return res.json({ errors: [{ msg: "Access denied" }] });
  }

  // Duplicate error from MONGODB
  if (err.code === 11000) {
    console.error(err);
    res.status(400);
    return res.json({ errors: [{ msg: "This already exists" }] });
  }

  // Payment required
  if (err.code === "SUBSCRIPTION_REQUIRED") {
    return res.status(402).json({ error: err.message });
  }
  // TODO: Log the error to slack (maybe just log the error in Logger)
  console.error(err);
  return res.status(500).json({ error: "Unexpected error" });
});

// Start the Express.js server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
