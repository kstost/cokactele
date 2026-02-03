export interface Settings {
    defaultChatId?: string;
}
export declare function loadSettings(): Settings;
export declare function saveSettings(settings: Settings): void;
export declare function getDefaultChatId(): string | null;
export declare function setDefaultChatId(chatId: string): void;
