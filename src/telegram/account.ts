import { Api } from "telegram";
import { createClient, connectClient } from "./client";
import { loadSession, sessionExists } from "../storage/session";
import { outputSuccess, outputError } from "../utils/output";

export async function getAccountType(): Promise<void> {
  if (!sessionExists()) {
    outputError("Not logged in. Run --login first.");
    return;
  }

  let client = null;

  try {
    const sessionString = loadSession();
    client = await createClient(sessionString);
    await connectClient(client);

    const me = await client.getMe();

    if (me instanceof Api.User) {
      outputSuccess({
        id: me.id.toString(),
        firstName: me.firstName || "",
        lastName: me.lastName || "",
        username: me.username || "",
        phone: me.phone || "",
        premium: me.premium || false,
        accountType: me.premium ? "premium" : "free",
      });
    } else {
      outputError("Failed to get account info");
    }
  } catch (error) {
    outputError(error);
  } finally {
    if (client) {
      await client.disconnect();
    }
  }
}
