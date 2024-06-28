import axios from "axios";
import { MongoDB } from "../../db/mongodb.mjs";
const removeDuplicates = (arr) => {
  const uniqueUUIDs = new Set();
  return arr.filter((obj) => {
    if (uniqueUUIDs.has(obj.uuid)) {
      return false;
    }
    uniqueUUIDs.add(obj.uuid);
    return true;
  });
};

function encodeData(data) {
  return Object.keys(data)
    .filter((key) => data[key])
    .map(function (key) {
      return [key, data[key]].map(encodeURIComponent).join("=");
    })
    .join("&");
}

export const NEWS_CATEGORIES_LIST = [
  "general",
  "business",
  "politics",
  "health",
  "entertainment",
  "science",
  "tech",
  "travel",
  "sports",
];

export const NewsService = {
  getDbNews: async function getDbNews(code, date = this.getCurrentDate()) {
    const dbNews = await MongoDB.news.findOne({
      date,
    });

    if (dbNews && dbNews[code.toLowerCase()]) return dbNews[code.toLowerCase()];

    return null;
  },
  // TheNewsAPI
  getNews: async function (code, languagesString, overrides = {}) {
    const lowerCode = code.toLowerCase();

    const params = {
      language: languagesString,
      locale: `${lowerCode}`,
      search: "",
      limit: 50,
      api_token: process.env.THE_NEWS_API_KEY,
      headlines_per_category: 6,
      ...overrides,
    };

    try {
      const querystring = encodeData(params);
      const response = await axios.get(
        `https://api.thenewsapi.com/v1/news/headlines?${querystring}`
      );

      const data = response.data.data;

      Object.keys(data).forEach((key) => {
        const category = data[key];
        category.forEach((article) => {
          delete article.similar;
        });
      });

      return data;
    } catch (e) {
      console.error(e);
    }
  },
  // NewsAPI
  getNewsLegacy: async function (code = "us") {
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

  getSelectedNews: async function getSelectedNews(
    countryCode = "us",
    categories = NEWS_CATEGORIES_LIST,
    languages
  ) {
    let news = null;
    const languagesString = (
      languages ? languages.join(",") : countryCode
    ).toLowerCase();
    const langCachingString = `${countryCode.toLowerCase()}-${languagesString}`;

    // Check for news in the database
    news = await this.getDbNews(langCachingString);

    if (!news) {
      // Otherwise get news from the API
      news = await this.getNews(countryCode, languagesString);

      const today = this.getCurrentDate();

      const query = { date: today };
      const update = { $set: { [langCachingString]: news } };
      const options = { upsert: true };
      await MongoDB.news.updateOne(query, update, options);
    }

    const filtered = await this.filterByCategory(categories, news);
    return filtered.slice(0, 5) ?? [];
  },

  filterByCategory: async function (categories, news) {
    const articles = [];

    // For loop that iters 6 times
    for (let i = 0; i < 6; i++) {
      for (const category of categories) {
        if (!news[category]) continue;
        if (!news[category][i]) continue;

        articles.push(news[category][i]);
      }
    }

    return removeDuplicates(articles);
  },
};
