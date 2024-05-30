import { MongoDB } from "../../db/mongodb.mjs";
import { AIService } from "../ai/ai.service.mjs";
import { NewsService } from "../news/news.service.mjs";
import { UsersService } from "../users/users.service.mjs";
import { WeatherService } from "../weather/weather.service.mjs";

export const ChatService = {
  generateFirstMessageOfTheDay: async function ({ telegramUserId }, bot) {
    const user = await MongoDB.users.findOne({ telegramUserId });

    const weather = await WeatherService.getWeather(user.location);

    const selectedNews = await NewsService.getSelectedNews(
      user.location.country
    );

    const firthThreeNews = selectedNews.slice(0, 3);

    console.log(
      user.first_name,
      user.location.city,
      weather.daily,
      selectedNews
    );

    const answer = await AIService.simpleCompletion(
      `You send a daily message every morning. This is one of these messages. This message will be spoken by a voice assistant.
        The user firstname is ${user.first_name} and lives in ${
        user.location.city
      }.

        These are the information I have about the weather, tell them a good morning and the weather.
        When you talk about temperatures, never add the decimals.
        Weather infos:
        ${JSON.stringify(weather.daily)}

        Now let's talk about the news of the day, make it smooth and natural, like you are talking to a friend. The first one is an important news, be factual. Make a mocking comment for last two ones.
        The news:
        ${JSON.stringify(firthThreeNews)}

        Do not number the news, your discourse shall flow naturally like you talk to a friend.


    `,
      { temperature: 0.5 }
    );

    return { answer, selectedNews };
  },
};
