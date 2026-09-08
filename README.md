# Heem — Telegram AI daily assistant

Heem is a Telegram bot that sends you a personalised voice briefing every morning: the weather where you are, plus the day's headlines in the categories and languages you picked, narrated by an OpenAI voice with a sassy tone. Outside of the daily briefing you can chat with it by text or voice message. It answers with a voice note and can change its own settings through function calling ("send my daily at 9am tomorrow", "only science and tech news", "je veux les news en français").

## Features

- **Daily voice briefing** at a user-chosen local time, computed from the timezone of the shared location.
- **Weather** from OpenWeatherMap (current conditions, daily forecast, alerts).
- **News** from TheNewsAPI, cached per day / country / language in MongoDB, filtered by the user's categories.
- **Conversational agent** on `gpt-4o` with tool calling: weather lookup, user profile, notification toggle, notification time, news categories, news languages.
- **Voice in and out**: incoming voice notes are transcribed with Whisper; replies are synthesised with OpenAI TTS, transcoded to Opus/OGG with ffmpeg, uploaded to Bunny storage and sent as a Telegram voice message.
- **Six selectable voices** (`alloy`, `echo`, `fable`, `nova`, `onyx`, `shimmer`).
- **Rate limiting**: 30 messages per user per day, rolling window of the last 10 messages kept as context.

## Bot commands

| Command | What it does |
| --- | --- |
| `/start` | Ask for your location and enable notifications |
| `/location` | Update your location |
| `/time` | Pick the time of the morning briefing |
| `/voice` | Pick the voice |
| `/categories` | Show and change news categories |
| `/languages` | Explain how to change the news languages |
| `/infos` | Show your current settings |
| `/daily` | Send the briefing now |
| `/stop` | Stop the notifications |

## Architecture

```
index.mjs                     Telegram bot setup, command handlers, 60s notification loop
entities/
  ai/        openai.mjs       OpenAI client: chat completions + tool calling, TTS, Whisper
             ai.service.mjs   Prompt presets (assistant persona, neutral JSON processor)
             tools.calls.mjs  Tool definitions exposed to the model
  bot/                        Send text / voice messages to Telegram
  chats/                      Daily briefing generation, chat answering, broadcast
  conversation/               Per-user conversation history + daily limits (MongoDB)
  news/                       TheNewsAPI client + per-day cache
  notifications/              UTC time conversion, notification records
  users/                      User CRUD, who to notify now, categories, languages
  voice/                      Voice note transcription, mp3 -> ogg/opus transcoding
  weather/                    OpenWeatherMap client + reverse geocoding
  cdn/                        Upload voice files to Bunny storage
db/mongodb.mjs                MongoDB client, collections and indexes
```

Runtime: Node 18+, plain ES modules, no build step. Data lives in a MongoDB database named `heem` (`users`, `news`, `notifications`, `chats`, `authCodes`).

## Configuration

All configuration comes from environment variables (loaded with `dotenv` in dev). See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `OPENAI_API_KEY` | OpenAI API key (chat, TTS, Whisper) |
| `MONGODB_CONNECT_STRING` | MongoDB connection string |
| `WEATHER_API_KEY` | OpenWeatherMap key (One Call 3.0 + geocoding) |
| `THE_NEWS_API_KEY` | TheNewsAPI token |
| `NEWS_API_KEY` | NewsAPI.org key (legacy provider, optional) |
| `BUNNY_FILES_STORAGE_URL` | Bunny storage zone upload URL |
| `BUNNY_FILES_STORAGE_KEY` | Bunny storage access key |
| `FILES_ENDPOINT` | Public CDN base URL for the uploaded voice files |
| `PORT` | HTTP port of the (minimal) Express server |
| `NODE_ENV` | `development` or `production` |
| `DEBUG` | Set to anything to enable debug logs |

Secrets are managed with [Doppler](https://www.doppler.com/) (project `heem`, config `prd`). `doppler.sh` pulls them into a local `.env`.

## Running locally

```bash
brew install ffmpeg          # required for voice transcoding
npm install
cp .env.example .env         # or: ./doppler.sh
npm run dev                  # nodemon, restarts on change
```

The bot uses long polling, so no public URL or webhook is needed for development.

## Deployment

`.github/workflows/deploy.yml` SSHes into the server on every push to `main`, refreshes `.env` from Doppler, pulls, installs and restarts the `pm2` process. `digitalocean-setup.md` documents the initial provisioning of the Debian droplet (nginx, certbot, Node, pm2, MongoDB, Doppler).

## Notes

- The ffmpeg settings used for Telegram-compatible voice notes:
  `-c:a libopus -b:a 32k -vbr on -compression_level 10 -frame_duration 60 -application voip`
- Notification times are stored as seconds since midnight UTC and matched every minute against a 10 minute window.
