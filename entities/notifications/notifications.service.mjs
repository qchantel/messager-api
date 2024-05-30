import { MongoDB } from "../../db/mongodb.mjs";
import { NewsService } from "../news/news.service.mjs";

export function convertToUTC(userTime, userTimezone) {
  const [hours, minutes] = userTime.split(":");

  const currentDate = new Date();
  const userDateTime = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    parseInt(hours),
    parseInt(minutes)
  );

  const userDateTimeString = userDateTime.toLocaleString("en-US", {
    timeZone: userTimezone,
  });
  const utcDateTime = new Date(userDateTimeString);

  const utcHours = utcDateTime.getUTCHours().toString().padStart(2, "0");
  const utcMinutes = utcDateTime.getUTCMinutes().toString().padStart(2, "0");

  return {
    HHMM: `${utcHours}:${utcMinutes}`,
    minutes: utcDateTime.getUTCMinutes(),
    hours: utcDateTime.getUTCHours(),
    secondsSinceMidnight: secondsSinceMidnight(utcHours, utcMinutes),
  };
}

function secondsSinceMidnight(hours, minutes) {
  return hours * 3600 + minutes * 60;
}

export const NotificationsService = {
  createNotification: async function createNotification({
    telegramUserId,
    cdnVoicePath = "",
  }) {
    const today = NewsService.getCurrentDate();

    const user = await MongoDB.users.findOne({
      telegramUserId,
    });

    const time = new Date();

    await MongoDB.notifications.insertOne({
      _id: MongoDB.uuid(),
      user: user._id,
      telegramUserId,
      date: today,
      timeOfNotification: time,
      cdnVoicePath,
    });
  },

  setTimeToNotify: async function setTimeToNotify(user, time) {
    const timezone = user.location.timezone;

    // Transform it in seconds since midnight in UTC
    const UTCTime = convertToUTC(time, timezone);

    await MongoDB.users.updateOne(
      {
        telegramUserId: user.telegramUserId,
      },
      {
        $set: {
          time_in_seconds_since_midnight_to_notify:
            UTCTime.secondsSinceMidnight,
        },
      }
    );
    return { time, timezone };
  },
};
