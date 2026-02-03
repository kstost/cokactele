export declare function getMessages(chatId: string, offset: number, limit: number): Promise<void>;
export declare function sendMessage(chatId: string, message: string): Promise<void>;
export declare function sendFile(chatId: string, filePath: string, caption?: string, verbose?: boolean): Promise<void>;
export declare function downloadFile(chatId: string, messageId: number, savePath: string, verbose?: boolean): Promise<void>;
