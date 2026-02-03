import { TelegramClient, Api } from "telegram";
import { createClient, connectClient, getSessionString } from "./client";
import { saveSession } from "../storage/session";
import { outputSuccess, outputError } from "../utils/output";
import input from "input";

export async function login(): Promise<void> {
  let client: TelegramClient | null = null;

  try {
    // 1. 전화번호 입력
    const phone = await input.text("Enter phone number (with country code, e.g., +820000000000): ");

    if (!phone || !phone.trim()) {
      outputError("Phone number is required");
      return;
    }

    client = await createClient();
    await connectClient(client);

    // 2. 인증 코드 요청
    const sendCodeResult = await client.sendCode(
      { apiId: client.apiId, apiHash: client.apiHash },
      phone.trim()
    );

    const codeType = sendCodeResult.isCodeViaApp ? "app" : "sms";
    console.log(`\nAuthentication code sent via ${codeType}`);

    // 3. 인증 코드 입력
    const code = await input.text("Enter the code you received: ");

    if (!code || !code.trim()) {
      outputError("Authentication code is required");
      return;
    }

    // 4. 로그인
    const result = await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone.trim(),
        phoneCodeHash: sendCodeResult.phoneCodeHash,
        phoneCode: code.trim(),
      })
    );

    const sessionString = getSessionString(client);
    saveSession(sessionString);

    let user: { id: string; firstName: string } | null = null;
    if (result instanceof Api.auth.Authorization && result.user instanceof Api.User) {
      user = {
        id: result.user.id.toString(),
        firstName: result.user.firstName || "",
      };
    }

    outputSuccess({
      user: user,
    });
  } catch (error) {
    outputError(error);
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}
