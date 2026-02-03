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
exports.ensureConfigDir = ensureConfigDir;
exports.saveSession = saveSession;
exports.loadSession = loadSession;
exports.sessionExists = sessionExists;
const fs = __importStar(require("fs"));
const paths_1 = require("../config/paths");
const crypto_1 = require("../utils/crypto");
function ensureConfigDir() {
    if (!fs.existsSync(paths_1.PATHS.configDir)) {
        fs.mkdirSync(paths_1.PATHS.configDir, { recursive: true, mode: 0o700 });
    }
}
/**
 * 세션 저장 (AES-256-GCM 암호화)
 */
function saveSession(sessionString) {
    ensureConfigDir();
    const encrypted = (0, crypto_1.encryptSession)(sessionString);
    fs.writeFileSync(paths_1.PATHS.session, encrypted, { encoding: "utf-8", mode: 0o600 });
}
/**
 * 세션 로드 (암호화된 세션 복호화, 평문 세션 자동 마이그레이션)
 */
function loadSession() {
    if (!fs.existsSync(paths_1.PATHS.session)) {
        return "";
    }
    const data = fs.readFileSync(paths_1.PATHS.session, "utf-8").trim();
    if (!data) {
        return "";
    }
    // 암호화된 형식인지 확인
    if ((0, crypto_1.isEncryptedFormat)(data)) {
        try {
            return (0, crypto_1.decryptSession)(data);
        }
        catch (error) {
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
function sessionExists() {
    if (!fs.existsSync(paths_1.PATHS.session)) {
        return false;
    }
    const data = fs.readFileSync(paths_1.PATHS.session, "utf-8").trim();
    return data.length > 0;
}
