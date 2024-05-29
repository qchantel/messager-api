import { MongoDB } from "../../db/mongodb.mjs";

export const UsersService = {
  findOrCreateUser: async function findOrCreateUser({ telegramUserId, from }) {
    if (from.is_bot) {
      throw new Error("User is a bot");
    }

    const user = await MongoDB.users.findOne({
      telegramUserId,
    });

    if (!!user) return user;

    await MongoDB.users.insertOne({
      _id: MongoDB.uuid(),
      telegramUserId,
      first_name: from.first_name,
      last_name: from.last_name,
      language_code: from.language_code,
    });
  },
};
