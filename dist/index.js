#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const auth_1 = require("./telegram/auth");
const dialogs_1 = require("./telegram/dialogs");
const messages_1 = require("./telegram/messages");
const account_1 = require("./telegram/account");
const settings_1 = require("./storage/settings");
// --command 형식을 command 형식으로 변환
const args = process.argv.map(arg => {
    if (arg.startsWith("--") && !arg.includes("=")) {
        const cmd = arg.slice(2);
        if (["login", "accounttype", "listchat", "getmessages", "sendmessage", "downloadfile", "setdefaultchatid"].includes(cmd)) {
            return cmd;
        }
    }
    return arg;
});
const program = new commander_1.Command();
program
    .name("cokactele")
    .description("Terminal-based Telegram client")
    .version("1.0.0");
program
    .command("login")
    .description("Login to Telegram (interactive)")
    .action(async () => {
    await (0, auth_1.login)();
});
program
    .command("accounttype")
    .description("Show account info (premium/free)")
    .action(async () => {
    await (0, account_1.getAccountType)();
});
program
    .command("listchat")
    .description("List all chats")
    .action(async () => {
    await (0, dialogs_1.listChats)();
});
program
    .command("getmessages <chatId>")
    .description("Get messages from a chat")
    .option("--offset <n>", "Message ID offset", "0")
    .option("--limit <n>", "Number of messages", "30")
    .action(async (chatId, options) => {
    await (0, messages_1.getMessages)(chatId, parseInt(options.offset, 10), parseInt(options.limit, 10));
});
program
    .command("sendmessage [chatId]")
    .description("Send a message or file to a chat")
    .option("-m, --message <text>", "Text message or caption")
    .option("-f, --file <path>", "File or directory path to upload")
    .option("-v, --verbose", "Show upload progress", false)
    .option("-r, --remove", "Remove file after successful upload", false)
    .action(async (chatIdArg, options) => {
    const chatId = chatIdArg || (0, settings_1.getDefaultChatId)();
    if (!chatId) {
        console.error("Error: chatId is required. Provide it as argument or set defaultChatId in ~/.cokactele/settings.json");
        process.exit(1);
    }
    if (options.file) {
        await (0, messages_1.sendFile)(chatId, options.file, options.message, options.verbose, options.remove);
    }
    else if (options.message) {
        await (0, messages_1.sendMessage)(chatId, options.message);
    }
    else {
        console.error("Error: --message or --file is required");
        process.exit(1);
    }
});
program
    .command("downloadfile")
    .description("Download a file from a message")
    .requiredOption("--chatId <id>", "Chat ID")
    .requiredOption("--messageId <id>", "Message ID")
    .requiredOption("--path <path>", "Save path")
    .option("-v, --verbose", "Show download progress", false)
    .action(async (options) => {
    await (0, messages_1.downloadFile)(options.chatId, parseInt(options.messageId, 10), options.path, options.verbose);
});
program
    .command("setdefaultchatid <chatId>")
    .description("Set default chat ID for sendmessage")
    .action((chatId) => {
    (0, settings_1.setDefaultChatId)(chatId);
    console.log(JSON.stringify({ success: true, defaultChatId: chatId }));
});
program.parseAsync(args).then(() => {
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
