import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Logger, LogLevel } from "telegram/extensions/Logger";
import { API_ID, API_HASH } from "../config/constants";

export async function createClient(sessionString: string = ""): Promise<TelegramClient> {
  const session = new StringSession(sessionString);
  const silentLogger = new Logger(LogLevel.NONE);
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: Infinity,
    timeout: 0,
    retryDelay: 1000,
    baseLogger: silentLogger,
  });
  return client;
}

export async function connectClient(client: TelegramClient): Promise<void> {
  await client.connect();
}

export function getSessionString(client: TelegramClient): string {
  return client.session.save() as unknown as string;
}
