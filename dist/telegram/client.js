"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.connectClient = connectClient;
exports.getSessionString = getSessionString;
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const Logger_1 = require("telegram/extensions/Logger");
const constants_1 = require("../config/constants");
async function createClient(sessionString = "") {
    const session = new sessions_1.StringSession(sessionString);
    const silentLogger = new Logger_1.Logger(Logger_1.LogLevel.NONE);
    const client = new telegram_1.TelegramClient(session, constants_1.API_ID, constants_1.API_HASH, {
        connectionRetries: Infinity,
        timeout: 0,
        retryDelay: 1000,
        baseLogger: silentLogger,
    });
    return client;
}
async function connectClient(client) {
    await client.connect();
}
function getSessionString(client) {
    return client.session.save();
}
