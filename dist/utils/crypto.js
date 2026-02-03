"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSession = encryptSession;
exports.decryptSession = decryptSession;
exports.isEncryptedFormat = isEncryptedFormat;
const crypto = __importStar(require("crypto"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
/**
 * 첫 번째 비-내부 네트워크 인터페이스의 MAC 주소 가져오기
 */
function getPrimaryMacAddress() {
    try {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            const netInterface = interfaces[name];
            if (!netInterface)
                continue;
            for (const info of netInterface) {
                // 내부 인터페이스 및 가상 인터페이스 제외
                if (!info.internal && info.mac && info.mac !== "00:00:00:00:00:00") {
                    return info.mac;
                }
            }
        }
    }
    catch {
        // 실패 시 빈 문자열
    }
    return "";
}
/**
 * CPU 시리얼 번호 또는 고유 식별자 가져오기
 */
function getCpuId() {
    try {
        const cpus = os.cpus();
        if (cpus.length > 0) {
            // CPU 모델 + 코어 수 조합
            return `${cpus[0].model}:${cpus.length}`;
        }
    }
    catch {
        // 실패 시 빈 문자열
    }
    return "";
}
/**
 * 머신 고유 ID 가져오기 (OS별)
 * - Linux: /etc/machine-id
 * - macOS: IOPlatformUUID
 * - Windows: MachineGuid from registry
 */
function getMachineId() {
    try {
        const platform = os.platform();
        if (platform === "linux") {
            // Linux: /etc/machine-id 읽기
            if (fs.existsSync("/etc/machine-id")) {
                return fs.readFileSync("/etc/machine-id", "utf-8").trim();
            }
            // 대체: /var/lib/dbus/machine-id
            if (fs.existsSync("/var/lib/dbus/machine-id")) {
                return fs.readFileSync("/var/lib/dbus/machine-id", "utf-8").trim();
            }
        }
        else if (platform === "darwin") {
            // macOS: IOPlatformUUID
            const output = (0, child_process_1.execSync)("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID", { encoding: "utf-8", timeout: 5000 });
            const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
            if (match) {
                return match[1];
            }
        }
        else if (platform === "win32") {
            // Windows: MachineGuid from registry
            const output = (0, child_process_1.execSync)('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { encoding: "utf-8", timeout: 5000 });
            const match = output.match(/MachineGuid\s+REG_SZ\s+(\S+)/);
            if (match) {
                return match[1];
            }
        }
    }
    catch {
        // 실패 시 빈 문자열
    }
    return "";
}
/**
 * 머신 고유 식별자 기반으로 암호화 키 시드 생성
 * 여러 시스템 특성을 조합하여 복잡한 키 생성
 */
function getMachineSecret() {
    const components = [
        "cokactele:v2", // 버전 식별자
        os.hostname(), // 호스트명
        os.userInfo().username, // 사용자명
        os.userInfo().uid?.toString() || "", // 사용자 UID
        os.homedir(), // 홈 디렉토리
        os.platform(), // 플랫폼 (linux, darwin, win32)
        os.arch(), // 아키텍처 (x64, arm64 등)
        os.endianness(), // 엔디안 (LE, BE)
        getCpuId(), // CPU 모델 + 코어 수
        getPrimaryMacAddress(), // MAC 주소
        getMachineId(), // OS별 머신 고유 ID
    ];
    // 모든 컴포넌트를 조합
    const combined = components.filter(Boolean).join(":");
    // SHA-512로 한번 더 해싱하여 균일한 길이의 시크릿 생성
    return crypto.createHash("sha512").update(combined).digest("hex");
}
/**
 * PBKDF2를 사용하여 암호화 키 파생
 */
function deriveKey(salt) {
    const secret = getMachineSecret();
    return crypto.pbkdf2Sync(secret, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}
/**
 * 세션 문자열 암호화
 * 형식: salt(32) + iv(16) + authTag(16) + encryptedData
 * Base64로 인코딩하여 반환
 */
function encryptSession(plaintext) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(salt);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // salt + iv + authTag + encrypted 결합
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    return combined.toString("base64");
}
/**
 * 암호화된 세션 문자열 복호화
 */
function decryptSession(encryptedData) {
    const combined = Buffer.from(encryptedData, "base64");
    // 최소 길이 검증: salt(32) + iv(16) + authTag(16) = 64 bytes
    if (combined.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error("Invalid encrypted data: too short");
    }
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const key = deriveKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
/**
 * 데이터가 암호화된 형식인지 확인
 * Base64로 디코딩 후 최소 헤더 길이 확인
 */
function isEncryptedFormat(data) {
    try {
        const decoded = Buffer.from(data, "base64");
        // 최소 길이: salt(32) + iv(16) + authTag(16) + 최소 1바이트 데이터 = 65
        if (decoded.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
            return false;
        }
        // 추가 검증: 원본 데이터가 '1'로 시작하면 평문 세션 형식일 가능성 높음
        // telegram 세션은 보통 '1' 또는 숫자로 시작
        if (/^[0-9]/.test(data) && !data.includes("/") && !data.includes("+")) {
            return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
