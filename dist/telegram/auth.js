"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const telegram_1 = require("telegram");
const client_1 = require("./client");
const session_1 = require("../storage/session");
const output_1 = require("../utils/output");
const input_1 = __importDefault(require("input"));
async function login() {
    let client = null;
    try {
        // 1. 전화번호 입력
        const phone = await input_1.default.text("Enter phone number (with country code, e.g., +820000000000): ");
        if (!phone || !phone.trim()) {
            (0, output_1.outputError)("Phone number is required");
            return;
        }
        client = await (0, client_1.createClient)();
        await (0, client_1.connectClient)(client);
        // 2. 인증 코드 요청
        const sendCodeResult = await client.sendCode({ apiId: client.apiId, apiHash: client.apiHash }, phone.trim());
        const codeType = sendCodeResult.isCodeViaApp ? "app" : "sms";
        console.log(`\nAuthentication code sent via ${codeType}`);
        // 3. 인증 코드 입력
        const code = await input_1.default.text("Enter the code you received: ");
        if (!code || !code.trim()) {
            (0, output_1.outputError)("Authentication code is required");
            return;
        }
        // 4. 로그인
        const result = await client.invoke(new telegram_1.Api.auth.SignIn({
            phoneNumber: phone.trim(),
            phoneCodeHash: sendCodeResult.phoneCodeHash,
            phoneCode: code.trim(),
        }));
        const sessionString = (0, client_1.getSessionString)(client);
        (0, session_1.saveSession)(sessionString);
        let user = null;
        if (result instanceof telegram_1.Api.auth.Authorization && result.user instanceof telegram_1.Api.User) {
            user = {
                id: result.user.id.toString(),
                firstName: result.user.firstName || "",
            };
        }
        (0, output_1.outputSuccess)({
            user: user,
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
