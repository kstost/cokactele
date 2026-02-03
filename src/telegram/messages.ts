import { Api } from "telegram";
import * as fs from "fs";
import * as path from "path";
import * as cliProgress from "cli-progress";
import { createClient, connectClient } from "./client";
import { loadSession, sessionExists } from "../storage/session";
import { saveFileRecord } from "../storage/file-record";
import { outputSuccess, outputError } from "../utils/output";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const MAX_FILE_SIZE_FREE = 1.9 * 1024 * 1024 * 1024; // 1.9GB
const MAX_FILE_SIZE_PREMIUM = 3.9 * 1024 * 1024 * 1024; // 3.9GB

interface MessageInfo {
  id: number;
  date: string;
  fromId: string | null;
  text: string;
  mediaType: string | null;
}

export async function getMessages(
  chatId: string,
  offset: number,
  limit: number
): Promise<void> {
  if (!sessionExists()) {
    outputError("Not logged in. Run --login first.");
    return;
  }

  let client = null;

  try {
    const sessionString = loadSession();
    client = await createClient(sessionString);
    await connectClient(client);

    const entity = await client.getEntity(chatId);

    const messages = await client.getMessages(entity, {
      limit: limit,
      offsetId: offset,
    });

    const result: MessageInfo[] = [];

    for (const msg of messages) {
      if (!(msg instanceof Api.Message)) {
        continue;
      }

      let fromId: string | null = null;
      if (msg.fromId) {
        if (msg.fromId instanceof Api.PeerUser) {
          fromId = msg.fromId.userId.toString();
        } else if (msg.fromId instanceof Api.PeerChannel) {
          fromId = `-100${msg.fromId.channelId.toString()}`;
        } else if (msg.fromId instanceof Api.PeerChat) {
          fromId = `-${msg.fromId.chatId.toString()}`;
        }
      }

      let mediaType: string | null = null;
      if (msg.media) {
        if (msg.media instanceof Api.MessageMediaPhoto) {
          mediaType = "photo";
        } else if (msg.media instanceof Api.MessageMediaDocument) {
          mediaType = "document";
        } else if (msg.media instanceof Api.MessageMediaWebPage) {
          mediaType = "webpage";
        } else if (msg.media instanceof Api.MessageMediaGeo) {
          mediaType = "geo";
        } else if (msg.media instanceof Api.MessageMediaContact) {
          mediaType = "contact";
        } else if (msg.media instanceof Api.MessageMediaPoll) {
          mediaType = "poll";
        } else {
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

    outputSuccess({
      chatId: chatId,
      messages: result,
      count: result.length,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    outputError(error);
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}

export async function sendMessage(
  chatId: string,
  message: string
): Promise<void> {
  if (!sessionExists()) {
    outputError("Not logged in. Run --login first.");
    return;
  }

  let client = null;

  try {
    const sessionString = loadSession();
    client = await createClient(sessionString);
    await connectClient(client);

    const entity = await client.getEntity(chatId);
    const result = await client.sendMessage(entity, { message: message });

    outputSuccess({
      messageId: result.id,
      chatId: chatId,
      text: message,
      date: new Date(result.date * 1000).toISOString(),
    });
  } catch (error) {
    outputError(error);
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}

export async function sendFile(
  chatId: string,
  filePath: string,
  caption?: string,
  verbose: boolean = false
): Promise<void> {
  if (!sessionExists()) {
    outputError("Not logged in. Run --login first.");
    return;
  }

  if (!fs.existsSync(filePath)) {
    outputError(`Path not found: ${filePath}`);
    return;
  }

  const stats = fs.statSync(filePath);
  const isDirectory = stats.isDirectory();

  let client = null;

  try {
    const sessionString = loadSession();
    client = await createClient(sessionString);
    await connectClient(client);

    // 프리미엄 상태 확인
    const me = await client.getMe();
    const isPremium = me instanceof Api.User && me.premium === true;
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
        outputError("No files found in directory");
        return;
      }

      const results: Array<{
        fileName: string;
        fileSize: number;
        messageId: number;
        success: boolean;
        error?: string;
      }> = [];

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

        let progressBar: cliProgress.SingleBar | null = null;

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
              ? (progress: number) => {
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
            saveFileRecord({
              chatId,
              messageId: result.id,
              fileName,
              fileSize,
              caption: caption || "",
              uploadedAt: new Date().toISOString(),
            });
            // 업로드 성공 시 파일 삭제
            fs.unlinkSync(file);
            results.push({
              fileName,
              fileSize,
              messageId: result.id,
              success: true,
            });
          } else {
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
        } catch (err) {
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
      } else {
        outputSuccess({
          chatId: chatId,
          directory: filePath,
          totalFiles: files.length,
          uploaded: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          files: results,
        });
      }
    } else {
      // 단일 파일인 경우
      const fileSize = stats.size;

      if (fileSize > maxFileSize) {
        outputError(`File too large for ${accountType} account. Maximum: ${maxSizeGB}, File: ${(fileSize / 1024 / 1024 / 1024).toFixed(2)}GB`);
        return;
      }

      const fileName = path.basename(filePath);

      let progressBar: cliProgress.SingleBar | null = null;

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
          ? (progress: number) => {
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

      saveFileRecord({
        chatId,
        messageId: result.id,
        fileName,
        fileSize,
        caption: caption || "",
        uploadedAt: new Date().toISOString(),
      });

      // 업로드 성공 시 파일 삭제
      fs.unlinkSync(filePath);

      if (verbose) {
        console.log(`  ✓ Success (messageId: ${result.id})`);
        console.log(`\nCompleted: 1/1 files uploaded`);
      } else {
        outputSuccess({
          messageId: result.id,
          chatId: chatId,
          fileName: fileName,
          fileSize: fileSize,
          caption: caption || "",
          date: new Date(result.date * 1000).toISOString(),
        });
      }
    }
  } catch (error) {
    outputError(error);
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}

export async function downloadFile(
  chatId: string,
  messageId: number,
  savePath: string,
  verbose: boolean = false
): Promise<void> {
  if (!sessionExists()) {
    outputError("Not logged in. Run --login first.");
    return;
  }

  let client = null;

  try {
    const sessionString = loadSession();
    client = await createClient(sessionString);
    await connectClient(client);

    const entity = await client.getEntity(chatId);

    // 메시지 가져오기
    const messages = await client.getMessages(entity, { ids: [messageId] });

    if (!messages || messages.length === 0) {
      outputError(`Message not found: ${messageId}`);
      return;
    }

    const msg = messages[0];

    if (!(msg instanceof Api.Message) || !msg.media) {
      outputError("Message does not contain a file");
      return;
    }

    // 파일 크기 확인
    let fileSize = 0;
    let fileName = "unknown";

    if (msg.media instanceof Api.MessageMediaDocument && msg.media.document instanceof Api.Document) {
      fileSize = msg.media.document.size.toJSNumber();
      const fileNameAttr = msg.media.document.attributes.find(
        (attr): attr is Api.DocumentAttributeFilename => attr instanceof Api.DocumentAttributeFilename
      );
      if (fileNameAttr) {
        fileName = fileNameAttr.fileName;
      }
    } else if (msg.media instanceof Api.MessageMediaPhoto) {
      fileName = `photo_${messageId}.jpg`;
    }

    let progressBar: cliProgress.SingleBar | null = null;

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
      outputError("Failed to download file");
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
    } else {
      outputSuccess({
        chatId: chatId,
        messageId: messageId,
        fileName: fileName,
        fileSize: fileSize,
        savedPath: savePath,
      });
    }
  } catch (error) {
    outputError(error);
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}
