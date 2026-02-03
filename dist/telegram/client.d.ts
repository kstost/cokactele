import { TelegramClient } from "telegram";
export declare function createClient(sessionString?: string): Promise<TelegramClient>;
export declare function connectClient(client: TelegramClient): Promise<void>;
export declare function getSessionString(client: TelegramClient): string;
