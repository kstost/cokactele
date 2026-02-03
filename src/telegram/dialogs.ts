import { Api } from "telegram";
import { createClient, connectClient } from "./client";
import { loadSession, sessionExists } from "../storage/session";
import { outputSuccess, outputError } from "../utils/output";

interface ChatInfo {
  id: string;
  type: "user" | "group" | "supergroup" | "channel" | "unknown";
  title: string;
  unreadCount: number;
}

export async function listChats(): Promise<void> {
  if (!sessionExists()) {
    outputError("Not logged in. Run --login first.");
    return;
  }

  let client = null;

  try {
    const sessionString = loadSession();
    client = await createClient(sessionString);
    await connectClient(client);

    const dialogs = await client.getDialogs({});

    const chats: ChatInfo[] = [];

    for (const dialog of dialogs) {
      const entity = dialog.entity;

      if (!entity) {
        continue;
      }

      let chatType: ChatInfo["type"] = "unknown";
      let title = "";
      let id = "";

      if (entity instanceof Api.User) {
        chatType = "user";
        title = [entity.firstName, entity.lastName].filter(Boolean).join(" ") || entity.username || "Unknown";
        id = entity.id.toString();
      } else if (entity instanceof Api.Chat) {
        chatType = "group";
        title = entity.title || "Unknown Group";
        id = `-${entity.id.toString()}`;
      } else if (entity instanceof Api.Channel) {
        chatType = entity.megagroup ? "supergroup" : "channel";
        title = entity.title || "Unknown Channel";
        id = `-100${entity.id.toString()}`;
      } else if (entity instanceof Api.ChatForbidden) {
        chatType = "group";
        title = entity.title || "Forbidden Group";
        id = `-${entity.id.toString()}`;
      } else if (entity instanceof Api.ChannelForbidden) {
        chatType = entity.megagroup ? "supergroup" : "channel";
        title = entity.title || "Forbidden Channel";
        id = `-100${entity.id.toString()}`;
      } else {
        continue;
      }

      chats.push({
        id: id,
        type: chatType,
        title: title,
        unreadCount: dialog.unreadCount,
      });
    }

    outputSuccess({ chats });
  } catch (error) {
    outputError(error);
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}
