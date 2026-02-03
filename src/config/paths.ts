import * as path from "path";
import * as os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".cokactele");

export const PATHS = {
  configDir: CONFIG_DIR,
  session: path.join(CONFIG_DIR, "session.txt"),
  authState: path.join(CONFIG_DIR, "auth_state.json"),
  config: path.join(CONFIG_DIR, "config.json"),
  settings: path.join(CONFIG_DIR, "settings.json"),
  fileDir: path.join(CONFIG_DIR, "file"),
};
