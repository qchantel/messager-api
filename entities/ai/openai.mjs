import axios from "axios";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

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

  async generateImage(config) {
    const { data } = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        ...config,
        n: 1,
        response_format: "url",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    return data.data[0]?.url;
  },

  createSpeechToTextFile: async function (fileName, text) {
    const speechFile = path.resolve(`./files/${fileName}.mp3`);

    const mp3 = await OpenAIService.openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    return speechFile;
  },

  async getModerationPolicy(input) {
    const { data } = await axios.post(
      "https://api.openai.com/v1/moderations",
      { input },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    return data.results[0];
  },

  async chatCompletion(params) {
    const chatCompletion = await this.openai.chat.completions.create({
      ...params,
      temperature: 0.4,
      stream: false,
    });

    return {
      data: chatCompletion.choices[0]?.message?.content?.trim() ?? "",
      usage: chatCompletion.usage?.total_tokens ?? 0,
    };
  },
};
