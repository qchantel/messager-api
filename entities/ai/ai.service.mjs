import { AIHelpers } from "./ai.helpers.mjs";
import { OpenAIService } from "./openai.mjs";

export const AIService = {
  replyToChat: async function (messages, params) {
    const { temperature = 0.4, model = "gpt-4o" } = {};

    try {
      const res = await OpenAIService.chatCompletion({
        model,
        temperature,
        messages: AIHelpers.buildChatMessage(messages),
        stream: true,
        ...params,
      });

      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  simpleCompletion: async function (text, params) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are Heem, a daily assistant. You are nice but mock people.`,
        },
        { role: "user", content: text },
      ];
      const res = await this.replyToChat(messages);
      return res;
    } catch (error) {
      console.error(error);
    }
  },

  neutralCompletion: async function (text, params = 0) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are data processor. Your output is only valid JSON. You don't include any commentary.`,
        },
        { role: "user", content: text },
      ];
      const res = await this.replyToChat(messages, params);
      return res;
    } catch (error) {
      console.error(error);
    }
  },
};
