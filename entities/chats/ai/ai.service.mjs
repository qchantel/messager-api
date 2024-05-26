import { AIHelpers } from "./ai.helpers.mjs";
import { OpenAIService } from "./openai.mjs";

export const AIService = {
  replyToChat: async function (messages) {
    const { temperature = 0.4, model = "gpt-4o" } = {};

    try {
      const res = await OpenAIService.chatCompletion({
        model,
        temperature,
        messages: AIHelpers.buildChatMessage(messages),
        stream: true,
      });
      console.log(res);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
};
