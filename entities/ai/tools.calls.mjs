import { NEWS_CATEGORIES_LIST } from "../news/news.service.mjs";

export const TOOLS_AI = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather for this user",
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_information",
      description: "Get the user information like name, location.",
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_notifications",
      description:
        "Toggle the notifications on or off for this user. Use it if the user wants to stop/start receiving notifications.",
      parameters: {
        type: "object",
        properties: {
          toggled: {
            type: "boolean",
            description:
              "true if the user wants to receive notifications. False otherwise.",
          },
        },
        required: ["toggled"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_time_to_notify",
      description:
        "Set the time to notify the user. Use it if the user wants to change the time of the daily notification.",
      parameters: {
        type: "object",
        properties: {
          time: {
            type: "string",
            description:
              "The time to notify the user. It should be in the format HH:MM.",
          },
        },
        required: ["time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_news_categories",
      description:
        "Get the available news categories for this user. Use it if the user wants to change the news categories or know more about their categories.",
    },
  },
  {
    type: "function",
    function: {
      name: "change_news_categories",
      description:
        "Add the news categories for this user. Use it if the user wants to change the news categories.",
      parameters: {
        type: "object",
        properties: {
          categories_to_add: {
            type: "array",
            items: {
              type: "string",
            },
            description: `The news categories the user wants to add. It should be an array of strings among these values: ${NEWS_CATEGORIES_LIST.join(
              ","
            )}.`,
          },
          categories_to_remove: {
            type: "array",
            items: {
              type: "string",
            },
            description: `The news categories the user wants to remove. It should be an array of strings among these values: ${NEWS_CATEGORIES_LIST.join(
              ","
            )}.`,
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_news_languages",
      description:
        "Get all the user ISO codes languages he wants to receive the news in.",
    },
  },
  {
    type: "function",
    function: {
      name: "set_user_news_languages",
      description:
        "Set the languages the user wants to receive the news in. Use it if the user wants to change the languages.",
      parameters: {
        type: "object",
        properties: {
          languages: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "The languages the user wants to receive the news in. It should be an array of ISO codes.",
          },
        },
        required: ["languages"],
      },
    },
  },
];
