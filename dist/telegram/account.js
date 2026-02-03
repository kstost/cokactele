"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountType = getAccountType;
const telegram_1 = require("telegram");
const client_1 = require("./client");
const session_1 = require("../storage/session");
const output_1 = require("../utils/output");
async function getAccountType() {
    if (!(0, session_1.sessionExists)()) {
        (0, output_1.outputError)("Not logged in. Run --login first.");
        return;
    }
    let client = null;
    try {
        const sessionString = (0, session_1.loadSession)();
        client = await (0, client_1.createClient)(sessionString);
        await (0, client_1.connectClient)(client);
        const me = await client.getMe();
        if (me instanceof telegram_1.Api.User) {
            (0, output_1.outputSuccess)({
                id: me.id.toString(),
                firstName: me.firstName || "",
                lastName: me.lastName || "",
                username: me.username || "",
                phone: me.phone || "",
                premium: me.premium || false,
                accountType: me.premium ? "premium" : "free",
            });
        }
        else {
            (0, output_1.outputError)("Failed to get account info");
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
