import axios from "axios";
import { AIService } from "../ai/ai.service.mjs";
import { MongoDB } from "../../db/mongodb.mjs";

export const NewsService = {
  getDbNews: async function getDbNews(code, date = this.getCurrentDate()) {
    const dbNews = await MongoDB.news.findOne({
      date,
    });

    if (!dbNews) return null;

    return dbNews[code];
  },
  getNews: async function getNews(code = "us") {
    try {
      const response = await axios.get(
        `https://newsapi.org/v2/top-headlines?country=${code.toLowerCase()}&apiKey=${
          process.env.NEWS_API_KEY
        }`
      );

      return response.data;
    } catch (e) {}
  },

  getCurrentDate: function () {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  },

  getSelectedNews: async function getSelectedNews(code = "us", leave = 0) {
    // Check for news in the database
    const dbNews = await this.getDbNews(code);
    if (dbNews) return dbNews;

    // Otherwise get news from the API
    const news = await this.getNews(code);

    const selectedNews = await AIService.neutralCompletion(
      `I will send you an array of news. You will need to select 5 of them.

      1) the first one shall be the most important news of the day
      2) the second one shall be a surprising news
      3) the second one shall be a positive news
      4) the second one shall be a an international news
      5) the second one shall be any of your choice

      Do not include the same news twice.

      Here are the news:
      ${JSON.stringify(news.articles)}

  
        Provide your response as a JSON array structure in the form:
        [
          {
            ... // article 1
          },
          {
            ... // article 2
          },
          ...
        }
        
        Include no other commentary.
        `
    );

    let parsed = [];

    try {
      parsed = JSON.parse(selectedNews);
    } catch (e) {
      console.error(e);
      if (leave) return selectedNews;
      console.error("invalid, trying again");
      return await this.getSelectedNews(code, 1);
    }

    const today = this.getCurrentDate();

    const query = { date: today };
    const update = { $set: { [code]: parsed } };
    const options = { upsert: true };
    await MongoDB.news.updateOne(query, update, options);

    return parsed;
  },
};
