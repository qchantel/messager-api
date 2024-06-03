import { MongoDB } from "../../db/mongodb.mjs";
import { AIService } from "../ai/ai.service.mjs";
import { TelegramService } from "../bot/bot.service.mjs";
import { ConversationService } from "../conversation/conversation.service.mjs";
import { NewsService } from "../news/news.service.mjs";
import { UsersService } from "../users/users.service.mjs";
import { WeatherService } from "../weather/weather.service.mjs";

export const ChatService = {
  generateFirstMessageOfTheDay: async function ({ telegramUserId }, bot) {
    const user = await MongoDB.users.findOne({ telegramUserId });

    const weather = await WeatherService.getWeather(user.location);
    const alerts = weather?.alerts
      ? `Weather alerts: ${JSON.stringify(weather.alerts)}`
      : "";

    const selectedNews = await NewsService.getSelectedNews(
      user.location.country
    );

    const firthThreeNews = selectedNews.slice(0, 3);

    const answer = await AIService.simpleCompletion(
      `You send a daily message every morning. This is one of these messages. This message will be spoken by a voice assistant.
        The user firstname is ${user.first_name} and lives in ${
        user.location.city
      }.

        These are the information I have about the weather, tell them a good morning and the weather.
        When you talk about temperatures, never add the decimals.
        Weather infos:
        ${JSON.stringify(weather.daily[0])}
        ${alerts}

        Now let's talk about the news of the day, make it smooth and natural, like you are talking to a friend. The first one is an important news, be factual. Make a mocking comment for last two ones.
        The news:
        ${JSON.stringify(firthThreeNews)}

        Do not number the news, your discourse shall flow naturally like you talk to a friend.


    `,
      { temperature: 0.5 }
    );

    return { answer, selectedNews };
  },

  answerUser: async function (msg, bot) {
    const telegramUserId = msg.from.id;
    const message = msg.text;

    const user = await UsersService.findOrCreateUser({
      telegramUserId,
      from: msg.from,
    });

    // Add the message to the conversation
    const conversation = await ConversationService.saveMessage({
      telegramUserId,
      message,
      role: "user",
    });

    if (!conversation) {
      return bot.sendMessage(
        telegramUserId,
        `Hey... you sent me too many messages lately. I can't answer you anymore. Let's talk later!`
      );
    }

    // Generate the answer
    const answer = await AIService.conversationCompletion(conversation, {
      temperature: 0.5,
    });

    // Add the answer to the conversation
    await ConversationService.saveMessage({
      telegramUserId,
      message: answer,
      role: "assistant",
    });

    // Send the voice message
    await TelegramService.sendVoiceAIMessage(telegramUserId, bot, answer);
  },
};
