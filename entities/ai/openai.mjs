import axios from "axios";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { WeatherService } from "../weather/weather.service.mjs";
import { UsersService } from "../users/users.service.mjs";
import { NotificationsService } from "../notifications/notifications.service.mjs";
import { NEWS_CATEGORIES_LIST } from "../news/news.service.mjs";
import { AVAILABLE_LANGUAGES } from "../users/languages.const.mjs";

export const OpenAIService = {
  openai: new OpenAI({
    organization: "org-vSOjVhGwNyLw2qiEAoj2LcAv",
    apiKey: process.env.OPENAI_API_KEY,
  }),

  MAX_TOKEN: {
    "gpt-4": 8192,
    "gpt-3.5-turbo": 4096,
    "text-davinci-003": 4096,
    "text-curie-001": 2048,
    "text-babbage-001": 2048,
    "text-ada-001": 2048,
  },

  getTokenCount(prompt) {
    return OpenAIService.countToken(prompt);
  },

  countToken: (text) => {
    return text.split(" ").length;
  },

  createTextToSpeech: async function (fileName, text, voice = "alloy") {
    const speechFile = path.resolve(`./files/${fileName}.mp3`);

    const mp3 = await OpenAIService.openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    return speechFile;
  },

  async speechToText(filePath) {
    const response = await axios.get(filePath, { responseType: "arraybuffer" });
    const audioData = response.data;

    // Create a temporary file path
    const tempFilePath = path.join(os.tmpdir(), "temp_audio_file.oga");

    // Write the downloaded audio data to the temporary file
    fs.writeFileSync(tempFilePath, audioData);

    const transcription =
      await OpenAIService.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
      });

    return transcription;
  },

  async chatCompletion(params, tools = [], user) {
    const messages = params.messages;
    const { longitude, latitude } = user?.location ?? {};
    let resData = {};

    const payload = {
      temperature: 0.4,
      ...params,
    };

    if (tools?.length) {
      payload.tools = tools;
      payload.tool_choice = "auto";
    }

    resData = await this.openai.chat.completions.create(payload);
    const responseMessage = resData.choices[0].message;

    // Function calling  // Step 2: check if the model wanted to call a function
    const toolCalls = responseMessage.tool_calls;

    if (responseMessage.tool_calls) {
      // Step 3: call the function
      // Note: the JSON response may not always be valid; be sure to handle errors
      const availableFunctions = {
        get_current_weather: () =>
          WeatherService.getWeather({ latitude, longitude }),
        get_user_information: () => user,
        toggle_notifications: ({ toggled }) =>
          UsersService.toggleNotifications(user.telegramUserId, toggled),
        set_time_to_notify: async ({ time }) => {
          return await NotificationsService.setTimeToNotify(user, time);
        },
        get_news_categories: () => {
          return {
            availableCategories: NEWS_CATEGORIES_LIST,
            usersCategories: user.categories ?? NEWS_CATEGORIES_LIST,
          };
        },
        get_user_news_languages: () => {
          return {
            userLanguages: user.languages ?? user?.location?.country,
          };
        },
        set_user_news_languages: async ({ languages }) => {
          return await UsersService.setLanguages(
            user.telegramUserId,
            languages
          );
        },
        change_news_categories: async ({
          categories_to_add,
          categories_to_remove,
        }) => {
          return await UsersService.changeNewsCategories(
            user.telegramUserId,
            categories_to_add,
            categories_to_remove
          );
        },
      };
      messages.push(responseMessage); // extend conversation with assistant's reply

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const functionResponse = await functionToCall(functionArgs);
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResponse ? JSON.stringify(functionResponse) : "",
        }); // extend conversation with function response
      }

      resData = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
      }); // get a new response from the model where it can see the function response
    }

    return {
      data: resData.choices[0]?.message?.content?.trim() ?? "",
      usage: resData.usage?.total_tokens ?? 0,
    };
  },
};
