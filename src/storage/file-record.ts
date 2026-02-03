import * as fs from "fs";
import * as path from "path";
import { PATHS } from "../config/paths";

const FILE_PREFIX = ".__telelink__";

export interface FileRecord {
  chatId: string;
  messageId: number;
  fileName: string;
  fileSize: number;
  caption: string;
  uploadedAt: string;
}

function ensureFileDir(): void {
  if (!fs.existsSync(PATHS.fileDir)) {
    fs.mkdirSync(PATHS.fileDir, { recursive: true });
  }
}

function getRecordFileName(chatId: string, messageId: number): string {
  return `${FILE_PREFIX}${chatId}_${messageId}.telecokac`;
}

export function saveFileRecord(record: FileRecord): void {
  ensureFileDir();
  const filePath = path.join(PATHS.fileDir, getRecordFileName(record.chatId, record.messageId));
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
}

export function loadFileRecord(chatId: string, messageId: number): FileRecord | null {
  const filePath = path.join(PATHS.fileDir, getRecordFileName(chatId, messageId));
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as FileRecord;
}

export function listFileRecords(): FileRecord[] {
  ensureFileDir();
  const files = fs.readdirSync(PATHS.fileDir).filter(f => f.startsWith(FILE_PREFIX) && f.endsWith(".telecokac"));
  return files.map(f => {
    const content = fs.readFileSync(path.join(PATHS.fileDir, f), "utf-8");
    return JSON.parse(content) as FileRecord;
  });
}
