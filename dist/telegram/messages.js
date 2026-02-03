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
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.sendFile = sendFile;
exports.downloadFile = downloadFile;
const telegram_1 = require("telegram");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cliProgress = __importStar(require("cli-progress"));
const client_1 = require("./client");
const session_1 = require("../storage/session");
const file_record_1 = require("../storage/file-record");
const output_1 = require("../utils/output");
function formatBytes(bytes) {
    if (!bytes || bytes <= 0 || !Number.isFinite(bytes))
        return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
const MAX_FILE_SIZE_FREE = 1.9 * 1024 * 1024 * 1024; // 1.9GB
const MAX_FILE_SIZE_PREMIUM = 3.9 * 1024 * 1024 * 1024; // 3.9GB
async function getMessages(chatId, offset, limit) {
    if (!(0, session_1.sessionExists)()) {
        (0, output_1.outputError)("Not logged in. Run --login first.");
        return;
    }
    let client = null;
    try {
        const sessionString = (0, session_1.loadSession)();
        client = await (0, client_1.createClient)(sessionString);
        await (0, client_1.connectClient)(client);
        const entity = await client.getEntity(chatId);
        const messages = await client.getMessages(entity, {
            limit: limit,
            offsetId: offset,
        });
        const result = [];
        for (const msg of messages) {
            if (!(msg instanceof telegram_1.Api.Message)) {
                continue;
            }
            let fromId = null;
            if (msg.fromId) {
                if (msg.fromId instanceof telegram_1.Api.PeerUser) {
                    fromId = msg.fromId.userId.toString();
                }
                else if (msg.fromId instanceof telegram_1.Api.PeerChannel) {
                    fromId = `-100${msg.fromId.channelId.toString()}`;
                }
                else if (msg.fromId instanceof telegram_1.Api.PeerChat) {
                    fromId = `-${msg.fromId.chatId.toString()}`;
                }
            }
            let mediaType = null;
            if (msg.media) {
                if (msg.media instanceof telegram_1.Api.MessageMediaPhoto) {
                    mediaType = "photo";
                }
                else if (msg.media instanceof telegram_1.Api.MessageMediaDocument) {
                    mediaType = "document";
                }
                else if (msg.media instanceof telegram_1.Api.MessageMediaWebPage) {
                    mediaType = "webpage";
                }
                else if (msg.media instanceof telegram_1.Api.MessageMediaGeo) {
                    mediaType = "geo";
                }
                else if (msg.media instanceof telegram_1.Api.MessageMediaContact) {
                    mediaType = "contact";
                }
                else if (msg.media instanceof telegram_1.Api.MessageMediaPoll) {
                    mediaType = "poll";
                }
                else {
                    mediaType = "other";
                }
            }
            result.push({
                id: msg.id,
                date: new Date(msg.date * 1000).toISOString(),
                fromId: fromId,
                text: msg.message || "",
                mediaType: mediaType,
            });
        }
        (0, output_1.outputSuccess)({
            chatId: chatId,
            messages: result,
            count: result.length,
            hasMore: messages.length === limit,
        });
    }
    catch (error) {
        (0, output_1.outputError)(error);
    }
    finally {
        if (client) {
            await client.disconnect();
        }
    }
}
async function sendMessage(chatId, message) {
    if (!(0, session_1.sessionExists)()) {
        (0, output_1.outputError)("Not logged in. Run --login first.");
        return;
    }
    let client = null;
    try {
        const sessionString = (0, session_1.loadSession)();
        client = await (0, client_1.createClient)(sessionString);
        await (0, client_1.connectClient)(client);
        const entity = await client.getEntity(chatId);
        const result = await client.sendMessage(entity, { message: message });
        (0, output_1.outputSuccess)({
            messageId: result.id,
            chatId: chatId,
            text: message,
            date: new Date(result.date * 1000).toISOString(),
        });
    }
    catch (error) {
        (0, output_1.outputError)(error);
    }
    finally {
        if (client) {
            await client.disconnect();
        }
    }
}
async function sendFile(chatId, filePath, caption, verbose = false, remove = false) {
    if (!(0, session_1.sessionExists)()) {
        (0, output_1.outputError)("Not logged in. Run --login first.");
        return;
    }
    if (!fs.existsSync(filePath)) {
        (0, output_1.outputError)(`Path not found: ${filePath}`);
        return;
    }
    const stats = fs.statSync(filePath);
    const isDirectory = stats.isDirectory();
    let client = null;
    try {
        const sessionString = (0, session_1.loadSession)();
        client = await (0, client_1.createClient)(sessionString);
        await (0, client_1.connectClient)(client);
        // 프리미엄 상태 확인
        const me = await client.getMe();
        const isPremium = me instanceof telegram_1.Api.User && me.premium === true;
        const maxFileSize = isPremium ? MAX_FILE_SIZE_PREMIUM : MAX_FILE_SIZE_FREE;
        const accountType = isPremium ? "premium" : "free";
        const maxSizeGB = isPremium ? "3.9GB" : "1.9GB";
        const entity = await client.getEntity(chatId);
        if (isDirectory) {
            // 폴더인 경우: 폴더 내 모든 파일 업로드
            const files = fs.readdirSync(filePath)
                .map(f => path.join(filePath, f))
                .filter(f => fs.statSync(f).isFile())
                .sort((a, b) => fs.statSync(a).size - fs.statSync(b).size);
            if (files.length === 0) {
                (0, output_1.outputError)("No files found in directory");
                return;
            }
            const results = [];
            for (const file of files) {
                const fileStats = fs.statSync(file);
                const fileSize = fileStats.size;
                const fileName = path.basename(file);
                if (fileSize > maxFileSize) {
                    results.push({
                        fileName,
                        fileSize,
                        messageId: 0,
                        success: false,
                        error: `File too large for ${accountType} account. Maximum: ${maxSizeGB}`,
                    });
                    continue;
                }
                let progressBar = null;
                if (verbose) {
                    console.log(`\nUploading: ${fileName}`);
                    progressBar = new cliProgress.SingleBar({
                        format: "  [{bar}] {percentage}% | {uploadedSize}/{totalSize} | ETA: {eta}s",
                        barCompleteChar: "█",
                        barIncompleteChar: "░",
                        hideCursor: true,
                    }, cliProgress.Presets.shades_classic);
                    progressBar.start(fileSize, 0, { uploadedSize: "0 B", totalSize: formatBytes(fileSize) });
                }
                try {
                    const result = await client.sendFile(entity, {
                        file: file,
                        caption: caption || "",
                        forceDocument: true,
                        progressCallback: verbose
                            ? (progress) => {
                                const uploadedBytes = Math.floor(progress * fileSize);
                                if (progressBar) {
                                    progressBar.update(uploadedBytes, { uploadedSize: formatBytes(uploadedBytes) });
                                }
                            }
                            : undefined,
                    });
                    if (progressBar) {
                        progressBar.update(fileSize, { uploadedSize: formatBytes(fileSize) });
                        progressBar.stop();
                    }
                    if (result && result.id && result.id > 0) {
                        if (verbose) {
                            console.log(`  ✓ Success (messageId: ${result.id})`);
                        }
                        (0, file_record_1.saveFileRecord)({
                            chatId,
                            messageId: result.id,
                            fileName,
                            fileSize,
                            caption: caption || "",
                            uploadedAt: new Date().toISOString(),
                        });
                        // --remove 옵션이 있을 때만 파일 삭제
                        if (remove) {
                            fs.unlinkSync(file);
                        }
                        results.push({
                            fileName,
                            fileSize,
                            messageId: result.id,
                            success: true,
                        });
                    }
                    else {
                        if (verbose) {
                            console.log(`  ✗ Failed: no valid message ID returned`);
                        }
                        results.push({
                            fileName,
                            fileSize,
                            messageId: 0,
                            success: false,
                            error: "Upload failed: no valid message ID returned",
                        });
                    }
                }
                catch (err) {
                    if (progressBar) {
                        progressBar.stop();
                    }
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    if (verbose) {
                        console.log(`  ✗ Failed: ${errorMsg}`);
                    }
                    results.push({
                        fileName,
                        fileSize,
                        messageId: 0,
                        success: false,
                        error: errorMsg,
                    });
                }
            }
            if (verbose) {
                console.log(`\nCompleted: ${results.filter(r => r.success).length}/${files.length} files uploaded`);
            }
            else {
                (0, output_1.outputSuccess)({
                    chatId: chatId,
                    directory: filePath,
                    totalFiles: files.length,
                    uploaded: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                    files: results,
                });
            }
        }
        else {
            // 단일 파일인 경우
            const fileSize = stats.size;
            if (fileSize > maxFileSize) {
                (0, output_1.outputError)(`File too large for ${accountType} account. Maximum: ${maxSizeGB}, File: ${(fileSize / 1024 / 1024 / 1024).toFixed(2)}GB`);
                return;
            }
            const fileName = path.basename(filePath);
            let progressBar = null;
            if (verbose) {
                console.log(`\nUploading: ${fileName}`);
                progressBar = new cliProgress.SingleBar({
                    format: "  [{bar}] {percentage}% | {uploadedSize}/{totalSize} | ETA: {eta}s",
                    barCompleteChar: "█",
                    barIncompleteChar: "░",
                    hideCursor: true,
                }, cliProgress.Presets.shades_classic);
                progressBar.start(fileSize, 0, { uploadedSize: "0 B", totalSize: formatBytes(fileSize) });
            }
            const result = await client.sendFile(entity, {
                file: filePath,
                caption: caption || "",
                forceDocument: true,
                progressCallback: verbose
                    ? (progress) => {
                        const uploadedBytes = Math.floor(progress * fileSize);
                        if (progressBar) {
                            progressBar.update(uploadedBytes, { uploadedSize: formatBytes(uploadedBytes) });
                        }
                    }
                    : undefined,
            });
            if (progressBar) {
                progressBar.update(fileSize, { uploadedSize: formatBytes(fileSize) });
                progressBar.stop();
            }
            (0, file_record_1.saveFileRecord)({
                chatId,
                messageId: result.id,
                fileName,
                fileSize,
                caption: caption || "",
                uploadedAt: new Date().toISOString(),
            });
            // --remove 옵션이 있을 때만 파일 삭제
            if (remove) {
                fs.unlinkSync(filePath);
            }
            if (verbose) {
                console.log(`  ✓ Success (messageId: ${result.id})`);
                console.log(`\nCompleted: 1/1 files uploaded`);
            }
            else {
                (0, output_1.outputSuccess)({
                    messageId: result.id,
                    chatId: chatId,
                    fileName: fileName,
                    fileSize: fileSize,
                    caption: caption || "",
                    date: new Date(result.date * 1000).toISOString(),
                });
            }
        }
    }
    catch (error) {
        (0, output_1.outputError)(error);
    }
    finally {
        if (client) {
            await client.disconnect();
        }
    }
}
async function downloadFile(chatId, messageId, savePath, verbose = false) {
    if (!(0, session_1.sessionExists)()) {
        (0, output_1.outputError)("Not logged in. Run --login first.");
        return;
    }
    let client = null;
    try {
        const sessionString = (0, session_1.loadSession)();
        client = await (0, client_1.createClient)(sessionString);
        await (0, client_1.connectClient)(client);
        const entity = await client.getEntity(chatId);
        // 메시지 가져오기
        const messages = await client.getMessages(entity, { ids: [messageId] });
        if (!messages || messages.length === 0) {
            (0, output_1.outputError)(`Message not found: ${messageId}`);
            return;
        }
        const msg = messages[0];
        if (!(msg instanceof telegram_1.Api.Message) || !msg.media) {
            (0, output_1.outputError)("Message does not contain a file");
            return;
        }
        // 파일 크기 확인
        let fileSize = 0;
        let fileName = "unknown";
        if (msg.media instanceof telegram_1.Api.MessageMediaDocument && msg.media.document instanceof telegram_1.Api.Document) {
            fileSize = msg.media.document.size.toJSNumber();
            const fileNameAttr = msg.media.document.attributes.find((attr) => attr instanceof telegram_1.Api.DocumentAttributeFilename);
            if (fileNameAttr) {
                fileName = fileNameAttr.fileName;
            }
        }
        else if (msg.media instanceof telegram_1.Api.MessageMediaPhoto) {
            fileName = `photo_${messageId}.jpg`;
        }
        let progressBar = null;
        if (verbose) {
            console.log(`\nDownloading: ${fileName}`);
            progressBar = new cliProgress.SingleBar({
                format: "  [{bar}] {percentage}% | {downloadedSize}/{totalSize} | ETA: {eta}s",
                barCompleteChar: "█",
                barIncompleteChar: "░",
                hideCursor: true,
            }, cliProgress.Presets.shades_classic);
            progressBar.start(fileSize || 100, 0, {
                downloadedSize: "0 B",
                totalSize: fileSize ? formatBytes(fileSize) : "?"
            });
        }
        const buffer = await client.downloadMedia(msg.media, {
            progressCallback: verbose
                ? (downloaded) => {
                    if (progressBar && fileSize) {
                        const downloadedBytes = typeof downloaded === "number"
                            ? downloaded
                            : Number(downloaded);
                        progressBar.update(downloadedBytes, { downloadedSize: formatBytes(downloadedBytes) });
                    }
                }
                : undefined,
        });
        if (progressBar) {
            progressBar.update(fileSize || 100, { downloadedSize: formatBytes(fileSize) });
            progressBar.stop();
        }
        if (!buffer) {
            (0, output_1.outputError)("Failed to download file");
            return;
        }
        // 저장 경로의 디렉토리 생성
        const saveDir = path.dirname(savePath);
        if (saveDir && !fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }
        fs.writeFileSync(savePath, buffer);
        if (verbose) {
            console.log(`  ✓ Saved to: ${savePath}`);
            console.log(`\nCompleted: ${formatBytes(fileSize)} downloaded`);
        }
        else {
            (0, output_1.outputSuccess)({
                chatId: chatId,
                messageId: messageId,
                fileName: fileName,
                fileSize: fileSize,
                savedPath: savePath,
            });
        }
    }
    catch (error) {
        (0, output_1.outputError)(error);
    }
    finally {
        if (client) {
            await client.disconnect();
        }
    }
}
