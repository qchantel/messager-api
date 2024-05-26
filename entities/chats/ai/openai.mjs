import axios from "axios";
import OpenAI from "openai";

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
      stream: false,
    });

    return {
      data: chatCompletion.choices[0]?.message?.content?.trim() ?? "",
      usage: chatCompletion.usage?.total_tokens ?? 0,
    };
  },
};
