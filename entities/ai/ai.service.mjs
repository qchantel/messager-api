import { AIHelpers } from "./ai.helpers.mjs";
import { OpenAIService } from "./openai.mjs";
import { TOOLS_AI } from "./tools.calls.mjs";

export const AIService = {
  replyToChat: async function (messages, params) {
    const { temperature = 0.4, model = "gpt-4o" } = params ?? {};

    try {
      const res = await OpenAIService.chatCompletion({
        model,
        temperature,
        messages,
        ...params,
      });

      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  conversationCompletion: async function (conversation, user) {
    try {
      const res = await OpenAIService.chatCompletion(
        {
          model: "gpt-4o",
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content: `You are Heem, a daily assistant. You are nice but you are sassy and cheeky.
            You have access to information about the conversation you have with the user.
            `,
            },
            ...conversation,
          ],
        },
        TOOLS_AI,
        user
      );

      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  simpleCompletion: async function (text) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are Heem, a daily assistant. You are nice but you are sassy and cheeky.`,
        },
        { role: "user", content: text },
      ];
      const res = await this.replyToChat(messages);
      return res;
    } catch (error) {
      console.error(error);
    }
  },

  neutralCompletion: async function (text, params = { temperature: 0 }) {
    try {
      const messages = [
        {
          role: "system",
          content: `You are a data processor. Your output is only valid JSON. You don't include any commentary.`,
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
