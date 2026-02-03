import * as fs from "fs";
import { PATHS } from "../config/paths";

export interface Settings {
  defaultChatId?: string;
}

export function loadSettings(): Settings {
  if (!fs.existsSync(PATHS.settings)) {
    return {};
  }
  const content = fs.readFileSync(PATHS.settings, "utf-8");
  return JSON.parse(content) as Settings;
}

export function saveSettings(settings: Settings): void {
  fs.writeFileSync(PATHS.settings, JSON.stringify(settings, null, 2));
}

export function getDefaultChatId(): string | null {
  const settings = loadSettings();
  return settings.defaultChatId || null;
}

export function setDefaultChatId(chatId: string): void {
  const settings = loadSettings();
  settings.defaultChatId = chatId;
  saveSettings(settings);
}
