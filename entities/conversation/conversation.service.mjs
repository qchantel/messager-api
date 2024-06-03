import { randomUUID } from "crypto";
import { MongoDB } from "../../db/mongodb.mjs";

const MAX_MESSAGES_PER_DAY = 30;
const MAX_MESSAGES_PER_CONVERSATION = 10;

// TODO: make a summary if the message is too long.

export const ConversationService = {
  saveMessage: async function ({
    telegramUserId,
    message,
    role,
    id = randomUUID(),
  }) {
    const { conversation = [] } = await MongoDB.users.findOne({
      telegramUserId,
    });

    const newConversation = [
      ...conversation,
      {
        id,
        role,
        content: message,
        timestamp: new Date(),
      },
    ];

    // If the conversation for the day is more than 60 messages, return false
    const isLimit = await this.checkConversationLimit({
      conversation: newConversation,
    });
    if (isLimit) return false;

    // If the conversation is more than 50 messages, remove the oldest message
    if (newConversation.length > MAX_MESSAGES_PER_CONVERSATION)
      newConversation.shift();

    await MongoDB.users.updateOne(
      { telegramUserId },
      {
        $set: {
          conversation: newConversation,
        },
      }
    );

    return newConversation;
  },
  checkConversationLimit: async function ({ conversation }) {
    const today = new Date().setHours(0, 0, 0, 0); // Get the start of the current day

    // Find the messages for the current day
    const todayMessages = conversation.filter((message) => {
      return (
        message.timestamp >= today &&
        message.timestamp < today + 24 * 60 * 60 * 1000
      );
    });

    if (todayMessages.length >= MAX_MESSAGES_PER_DAY) {
      return true; // Return false if the limit is reached
    }
    return false;
  },
};
