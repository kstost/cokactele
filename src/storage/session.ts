import * as fs from "fs";
import { PATHS } from "../config/paths";
import { encryptSession, decryptSession, isEncryptedFormat } from "../utils/crypto";

export function ensureConfigDir(): void {
  if (!fs.existsSync(PATHS.configDir)) {
    fs.mkdirSync(PATHS.configDir, { recursive: true, mode: 0o700 });
  }
}

/**
 * 세션 저장 (AES-256-GCM 암호화)
 */
export function saveSession(sessionString: string): void {
  ensureConfigDir();
  const encrypted = encryptSession(sessionString);
  fs.writeFileSync(PATHS.session, encrypted, { encoding: "utf-8", mode: 0o600 });
}

/**
 * 세션 로드 (암호화된 세션 복호화, 평문 세션 자동 마이그레이션)
 */
export function loadSession(): string {
  if (!fs.existsSync(PATHS.session)) {
    return "";
  }

  const data = fs.readFileSync(PATHS.session, "utf-8").trim();
  if (!data) {
    return "";
  }

  // 암호화된 형식인지 확인
  if (isEncryptedFormat(data)) {
    try {
      return decryptSession(data);
    } catch (error) {
      // 복호화 실패 시 (다른 머신에서 생성된 세션 등)
      throw new Error("Failed to decrypt session. Please login again.");
    }
  }

  // 평문 세션인 경우: 암호화하여 다시 저장 (마이그레이션)
  saveSession(data);
  return data;
}

/**
 * 세션 존재 여부 확인
 */
export function sessionExists(): boolean {
  if (!fs.existsSync(PATHS.session)) {
    return false;
  }
  const data = fs.readFileSync(PATHS.session, "utf-8").trim();
  return data.length > 0;
}
