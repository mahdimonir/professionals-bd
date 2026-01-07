import { StreamClient } from "@stream-io/node-sdk";
import { env } from "./env.js";

export const streamClient = new StreamClient(
  env.STREAM_API_KEY!,
  env.STREAM_SECRET!
);