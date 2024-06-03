import { MongoDB } from "../../db/mongodb.mjs";
import { TelegramService } from "../bot/bot.service.mjs";
import { ChatService } from "../chats/chats.service.mjs";
import { NewsService } from "../news/news.service.mjs";
import { NotificationsService } from "../notifications/notifications.service.mjs";

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
      created_at: new Date(),
    });
  },

  toggleNotifications: async function (telegramUserId, value = true) {
    await MongoDB.users.updateOne(
      { telegramUserId },
      {
        $set: {
          notifications: value,
        },
      }
    );
  },

  notifyUsers: async function notifyUsers(bot) {
    const usersToNotify = await this.usersToNotify();
    console.log({ usersToNotify });
    const today = NewsService.getCurrentDate();

    const filter = { _id: { $in: usersToNotify.map((user) => user._id) } };
    const update = { $addToSet: { date_of_notifications: today } };
    console.log(usersToNotify);
    await MongoDB.users.updateMany(filter, update);

    console.log("finished updating users");

    for (const user of usersToNotify) {
      const { telegramUserId } = user;

      const { answer, selectedNews } =
        await ChatService.generateFirstMessageOfTheDay(
          {
            telegramUserId,
          },
          bot
        );

      const cdnVoicePath = await TelegramService.sendVoiceAIMessage(
        telegramUserId,
        bot,
        answer
      );

      const firstThreeNews = selectedNews.slice(0, 3);
      const remainingNews = selectedNews.slice(3);

      await bot.sendMessage(
        telegramUserId,
        `The news I talked about below 👇\n
${firstThreeNews
  .map((news) => `🗞️ <a href='${news.url}'>${news.title}</a>\n`)
  .join("")}\n
Other news you might be interested in 👇\n
${remainingNews
  .map((news) => `🗞️ <a href='${news.url}'>${news.title}</a>\n`)
  .join("")}
      `,
        {
          parse_mode: "HTML",
        }
      );
      await NotificationsService.createNotification({
        telegramUserId,
        cdnVoicePath,
      });
    }
  },

  usersToNotify: async function () {
    const today = NewsService.getCurrentDate();

    const currentTimeUTC = new Date();
    const currentSeconds =
      currentTimeUTC.getUTCHours() * 3600 +
      currentTimeUTC.getUTCMinutes() * 60 +
      currentTimeUTC.getUTCSeconds();

    const upperBound = currentSeconds + 60 * 10;

    console.log({ currentSeconds, upperBound });
    const usersToNotify = await MongoDB.users
      .find({
        time_in_seconds_since_midnight_to_notify: {
          $gte: currentSeconds,
          $lt: upperBound,
        },
        date_of_notifications: {
          $ne: today,
        },
      })
      .toArray();

    return usersToNotify;
  },
};
