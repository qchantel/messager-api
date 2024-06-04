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
import { NotificationsService } from "./entities/notifications/notifications.service.mjs";
import { VoiceService } from "./entities/voice/voice.mjs";
import {
  NEWS_CATEGORIES_LIST,
  NewsService,
} from "./entities/news/news.service.mjs";

const app = express();

// Store user state and context
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.setMyCommands([
  { command: "/location", description: "Set your location 📍" },
  { command: "/time", description: "Set the time of the notification ⏰" },
  { command: "/voice", description: "Pick a voice 🎤" },
  { command: "/categories", description: "Change news categories 📰" },
  { command: "/stop", description: "Stop the notifications 🙊" },
  { command: "/start", description: "Start receiving messages" },
]);

// Ping MongoDB
await MongoDB.ping();

// Migrate if needed
await MongoDB.migrate();

// Create the indexes
await MongoDB.createIndexes();

// Avoid rate-limiting the proxy itself
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

// Start the interval
const interval = setInterval(() => UsersService.notifyUsers(bot), 60 * 1000);

bot.onText(/\/stop/, async (msg) => {
  // Stop the notification for this user
  await UsersService.toggleNotifications(msg.from.id, false);

  bot.sendMessage(
    msg.chat.id,
    "✅ Notifications stopped - type /start to receive them again"
  );
});

bot.onText(/\/time/, async (msg) => {
  const user = await UsersService.findOrCreateUser({
    telegramUserId: msg.from.id,
    from: msg.from,
  });

  const keyboard = [
    [{ text: "7:00" }, { text: "7:30" }, { text: "8:00" }],
    [{ text: "8:30" }, { text: "9:00" }, { text: "9:30" }],
    [{ text: "10:00" }, { text: "10:30" }, { text: "11:00" }],
  ];
  const replyMarkup = {
    keyboard: keyboard,
    one_time_keyboard: true,
    remove_keyboard: true,
  };

  await bot.sendMessage(
    msg.chat.id,
    "⏰ Pick a time for your morning notification 👇",
    {
      reply_markup: replyMarkup,
    }
  );
});

bot.onText(/\/test/, async (msg) => {
  const user = await UsersService.findOrCreateUser({
    telegramUserId: msg.from.id,
    from: msg.from,
  });

  await NotificationsService.createNotification({
    telegramUserId: msg.from.id,
  });
});

// Request location permission
bot.onText(/\/location/, async (msg) => {
  const chatId = msg.chat.id;
  const keyboard = [[{ text: "Share Location 📍", request_location: true }]];
  const replyMarkup = {
    keyboard: keyboard,
    one_time_keyboard: true,
  };

  bot.sendMessage(chatId, "Share your location below 👇", {
    reply_markup: replyMarkup,
  });
});
// Request location permission
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const keyboard = [[{ text: "Share Location 📍", request_location: true }]];
  const replyMarkup = {
    keyboard: keyboard,
    one_time_keyboard: true,
  };

  bot.sendMessage(
    chatId,
    "👋 Hello, it's Heem, I mean... me. Mind sharing your location?",
    {
      reply_markup: replyMarkup,
    }
  );
});

bot.onText(/\/help/, async (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 Hey! This is heem, try these commands if you are lost:\n
    /start - to share your location
    /time - to set the time of the notification
    /stop - to stop the notifications
    `
  );
});

bot.onText(/\/voice/, async (msg) => {
  const user = await UsersService.findOrCreateUser({
    telegramUserId: msg.from.id,
    from: msg.from,
  });

  const keyboard = VoiceService.VOICES.reduce((acc, voice, index) => {
    const rowIndex = Math.floor(index / 3);
    if (!acc[rowIndex]) {
      acc[rowIndex] = [];
    }
    acc[rowIndex].push({ text: voice });
    return acc;
  }, []);

  const replyMarkup = {
    keyboard: keyboard,
    one_time_keyboard: true,
    remove_keyboard: true,
  };

  bot.sendMessage(msg.chat.id, "Pick a voice that you like 👇", {
    reply_markup: replyMarkup,
  });
});

bot.onText(/\/categories/, async (msg) => {
  const user = await UsersService.findOrCreateUser({
    telegramUserId: msg.from.id,
    from: msg.from,
  });
  const userCategories = user.categories ?? NEWS_CATEGORIES_LIST;
  bot.sendMessage(
    msg.chat.id,
    `<b>Available categories</b>:\n${NEWS_CATEGORIES_LIST.map((category) => {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }).join(", ")}\n\n
<b>Your current categories</b>:\n${userCategories
      .map((category) => {
        return category.charAt(0).toUpperCase() + category.slice(1);
      })
      .join(", ")}\n\n

Just tell me the categories you want to have in your news. For example: "I want to have only politics and sports"
    `,
    {
      parse_mode: "HTML",
    }
  );
});

// Detects when the user leaves the chat
bot.on("left_chat_member", async (msg) => {
  console.log("Someone left the chat", msg);
  await UsersService.toggleNotifications(msg.from.id, false);
});

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
    `${selectedNews
      .map((news) => `👉 <a href='${news.url}'>${news.title}</a>\n`)
      .join("")}
    `,
    {
      parse_mode: "HTML",
    }
  );
});

bot.on("voice", async (msg) => {
  await VoiceService.getVoiceMessage({ msg, bot });
});

// Handle incoming messages
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    if (msg?.text && msg.text[0] === "/") {
      // It's a command, let's return
      return;
    }

    // if text matches time format
    if (msg?.text && msg.text.match(/^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
      const match = msg.text.match(/(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/);
      const user = await UsersService.findOrCreateUser({
        telegramUserId: msg.from.id,
        from: msg.from,
      });
      if (!user?.location) {
        const chatId = msg.chat.id;
        const keyboard = [
          [{ text: "Share Location 📍", request_location: true }],
        ];
        const replyMarkup = {
          keyboard: keyboard,
          one_time_keyboard: true,
        };

        return bot.sendMessage(
          chatId,
          "👋 Hello, before I can change time, please share your location so I can work properly. For some reason I did not have it the first time. It only works on your phone! Not your computer.",
          {
            reply_markup: replyMarkup,
          }
        );
      }

      await NotificationsService.setTimeToNotify(user, match[0]);

      bot.sendMessage(
        msg.chat.id,
        `✅ Alright, set at ${match[0]} for ${user.location.timezone}.`
      );

      return;
    }

    // if matches one of the voices perfectly
    if (msg?.text && VoiceService.VOICES.some((item) => item === msg.text)) {
      bot.sendChatAction(chatId, "record_voice");
      const user = await UsersService.findOrCreateUser({
        telegramUserId: msg.from.id,
        from: msg.from,
      });

      await MongoDB.users.findOneAndUpdate(
        { telegramUserId: msg.from.id },
        {
          $set: {
            voice: msg.text,
          },
        }
      );
      await TelegramService.sendVoiceAIMessage(
        chatId,
        bot,
        `Alright, hope you like my new voice ${msg.from.first_name}.`
      );

      return;
    }

    // Handles the message with AI
    if (msg?.text) {
      bot.sendChatAction(chatId, "record_voice");
      await ChatService.answerUser(msg, bot);
    }
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
  bot.sendChatAction(chatId, "record_voice");

  await UsersService.toggleNotifications(msg.from.id, true);

  const place = await WeatherService.getLocationFromCoordinates({
    latitude,
    longitude,
  });

  const user = await UsersService.findOrCreateUser({
    telegramUserId: msg.from.id,
    from: msg.from,
  });

  const weather = await WeatherService.getWeather({ latitude, longitude });

  const updatedUser = await MongoDB.users.findOneAndUpdate(
    { telegramUserId: msg.from.id },
    {
      $set: {
        location: {
          longitude,
          latitude,
          city: place.name,
          country: place.country,
          timezone: weather.timezone,
          timezone_offset: weather.timezone_offset,
          units: place.country === "US" ? "imperial" : "metric",
        },
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!user.time_in_seconds_since_midnight_to_notify) {
    await NotificationsService.setTimeToNotify(updatedUser, "8:00");
  }

  const answer = await AIService.simpleCompletion(
    `The user just shared their location, they are in ${place.name} (${place.country}). 

    Start your answer by "Got it! Thanks ${msg.from.first_name}.".
    Make a one line mocking comment about the place to greet the user.
    Don't ask any question to the user.

    After the comment tell the user that if they want to change it, they just have to share their location again.
    Finish the message by: 
    "Tomorrow morning, expect a wake-up call from my magnificent voice with the weather and all the latest news.
    Try not to be too excited. See you."
    `
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
