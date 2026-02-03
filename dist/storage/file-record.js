"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFileRecord = saveFileRecord;
exports.loadFileRecord = loadFileRecord;
exports.listFileRecords = listFileRecords;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const paths_1 = require("../config/paths");
const FILE_PREFIX = ".__telelink__";
function ensureFileDir() {
    if (!fs.existsSync(paths_1.PATHS.fileDir)) {
        fs.mkdirSync(paths_1.PATHS.fileDir, { recursive: true });
    }
}
function getRecordFileName(chatId, messageId) {
    return `${FILE_PREFIX}${chatId}_${messageId}.telecokac`;
}
function saveFileRecord(record) {
    ensureFileDir();
    const filePath = path.join(paths_1.PATHS.fileDir, getRecordFileName(record.chatId, record.messageId));
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
}
function loadFileRecord(chatId, messageId) {
    const filePath = path.join(paths_1.PATHS.fileDir, getRecordFileName(chatId, messageId));
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
}
function listFileRecords() {
    ensureFileDir();
    const files = fs.readdirSync(paths_1.PATHS.fileDir).filter(f => f.startsWith(FILE_PREFIX) && f.endsWith(".telecokac"));
    return files.map(f => {
        const content = fs.readFileSync(path.join(paths_1.PATHS.fileDir, f), "utf-8");
        return JSON.parse(content);
    });
}
