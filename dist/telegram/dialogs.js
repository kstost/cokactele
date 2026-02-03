"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChats = listChats;
const telegram_1 = require("telegram");
const client_1 = require("./client");
const session_1 = require("../storage/session");
const output_1 = require("../utils/output");
async function listChats() {
    if (!(0, session_1.sessionExists)()) {
        (0, output_1.outputError)("Not logged in. Run --login first.");
        return;
    }
    let client = null;
    try {
        const sessionString = (0, session_1.loadSession)();
        client = await (0, client_1.createClient)(sessionString);
        await (0, client_1.connectClient)(client);
        const dialogs = await client.getDialogs({});
        const chats = [];
        for (const dialog of dialogs) {
            const entity = dialog.entity;
            if (!entity) {
                continue;
            }
            let chatType = "unknown";
            let title = "";
            let id = "";
            if (entity instanceof telegram_1.Api.User) {
                chatType = "user";
                title = [entity.firstName, entity.lastName].filter(Boolean).join(" ") || entity.username || "Unknown";
                id = entity.id.toString();
            }
            else if (entity instanceof telegram_1.Api.Chat) {
                chatType = "group";
                title = entity.title || "Unknown Group";
                id = `-${entity.id.toString()}`;
            }
            else if (entity instanceof telegram_1.Api.Channel) {
                chatType = entity.megagroup ? "supergroup" : "channel";
                title = entity.title || "Unknown Channel";
                id = `-100${entity.id.toString()}`;
            }
            else if (entity instanceof telegram_1.Api.ChatForbidden) {
                chatType = "group";
                title = entity.title || "Forbidden Group";
                id = `-${entity.id.toString()}`;
            }
            else if (entity instanceof telegram_1.Api.ChannelForbidden) {
                chatType = entity.megagroup ? "supergroup" : "channel";
                title = entity.title || "Forbidden Channel";
                id = `-100${entity.id.toString()}`;
            }
            else {
                continue;
            }
            chats.push({
                id: id,
                type: chatType,
                title: title,
                unreadCount: dialog.unreadCount,
            });
        }
        (0, output_1.outputSuccess)({ chats });
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
