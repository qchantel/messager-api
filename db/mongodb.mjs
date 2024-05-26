if (process.env.NODE_ENV === "production") {
  // const secrets = JSON.parse(process.env.SECRETS_DOPPLER);
  // Object.entries(secrets).forEach(([key, value]) => {
  //   process.env[key] = value;
  // });
}

import { randomUUID } from "crypto";
import { MongoClient } from "mongodb";
import { Logger } from "../helpers/logger.mjs";

// Replace the placeholder with your Atlas connection string
const URI = process.env.MONGODB_CONNECT_STRING;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(URI);
const DB = "heem";

const clientDB = client.db(DB);

async function ping() {
  await clientDB.command({ ping: 1 });
  Logger.info(`Connected to MongoDB. Database name: ${DB}`);
  currentConnections();
}

async function currentConnections() {
  const serverStatus = await clientDB.command({ serverStatus: 1 });
  Logger.info("--------------");

  Logger.info(
    `Current connections to ${DB} DB: ${serverStatus.connections.active}`
  );
  Logger.info("--------------");
}

async function close() {
  await client.close();
  Logger.info(`Closed MongoDB connection to: ${DB}`);
}

const createIndexes = async () => {
  try {
    // Email are uniques
    await clientDB.collection("users").createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: {
          email: { $exists: true },
        },
      }
    );
  } catch (e) {
    Logger.error(
      "Cannot create the index for users email, need to investigate",
      e
    );
  }

  try {
    // authCodes collection expires after 10 minutes
    await clientDB.collection("authCodes").createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 600,
      }
    );
  } catch (e) {
    Logger.error("Dropping index because the other one crashed", e);
    await clientDB.collection("authCodes").dropIndex("createdAt_1");
    await clientDB.collection("authCodes").createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 600,
      }
    );
  }
};

const migrate = async () => {
  // try {
  //   await clientDB.collection("pages").dropIndex("slug_1");
  // } catch (e) {
  //   Logger.error("Migration failed", e);
  // }
};

const dropDb = async () => {
  clientDB.dropDatabase();
};

const uuid = () => randomUUID();

// Collections
const collections = {
  chats: clientDB.collection("chats"),
  users: clientDB.collection("users"),
  authCodes: clientDB.collection("authCodes"),
};

export const MongoDB = {
  ping,
  close,
  uuid,
  clientDB,
  ...collections,
  createIndexes,
  dropDb,
  migrate,
};
