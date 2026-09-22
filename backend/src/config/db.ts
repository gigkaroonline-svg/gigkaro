import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env.js";

let memoryServer: MongoMemoryServer | null = null;

export async function connectDb() {
  mongoose.set("strictQuery", true);

  let uri = env.mongoUri;
  const useMemory =
    process.env.USE_MEMORY_MONGO === "1" ||
    uri === "memory" ||
    uri.startsWith("memory://");

  if (useMemory) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri("gigkaro");
    console.log("Using in-memory MongoDB (set MONGODB_URI to a real server for persistence)");
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    if (useMemory) throw err;
    console.warn(
      "MongoDB connection failed; falling back to in-memory MongoDB.",
      err instanceof Error ? err.message : err,
    );
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri("gigkaro");
    await mongoose.connect(uri);
    console.log("MongoDB connected (in-memory fallback)");
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
