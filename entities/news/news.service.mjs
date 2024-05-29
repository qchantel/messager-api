import axios from "axios";
import { AIService } from "../ai/ai.service.mjs";

export const NewsService = {
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

  getSelectedNews: async function getSelectedNews(code = "us", leave = 0) {
    const news = await this.getNews(code);

    const selectedNews = await AIService.neutralCompletion(
      `I will send you an array of articles. Pick 5 of them considering these criteria:
        - not negative
        - surprising or interesting
        - not promotional, they do not talk about prices or sales
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
    console.log(selectedNews);

    try {
      parsed = JSON.parse(selectedNews);
    } catch (e) {
      console.error(e);
      if (leave) return selectedNews;
      console.error("invalid, trying again");
      return await this.getSelectedNews(code, 1);
    }

    return parsed;
  },
};
