export interface FileRecord {
    chatId: string;
    messageId: number;
    fileName: string;
    fileSize: number;
    caption: string;
    uploadedAt: string;
}
export declare function saveFileRecord(record: FileRecord): void;
export declare function loadFileRecord(chatId: string, messageId: number): FileRecord | null;
export declare function listFileRecords(): FileRecord[];
