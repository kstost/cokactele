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
exports.saveAuthState = saveAuthState;
exports.loadAuthState = loadAuthState;
exports.deleteAuthState = deleteAuthState;
exports.authStateExists = authStateExists;
const fs = __importStar(require("fs"));
const paths_1 = require("../config/paths");
const session_1 = require("./session");
function saveAuthState(state) {
    (0, session_1.ensureConfigDir)();
    fs.writeFileSync(paths_1.PATHS.authState, JSON.stringify(state, null, 2), "utf-8");
}
function loadAuthState() {
    if (!fs.existsSync(paths_1.PATHS.authState)) {
        return null;
    }
    try {
        const data = fs.readFileSync(paths_1.PATHS.authState, "utf-8");
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed.phone === "string" && typeof parsed.phoneCodeHash === "string" && typeof parsed.sessionString === "string") {
            return parsed;
        }
        return null;
    }
    catch {
        return null;
    }
}
function deleteAuthState() {
    if (fs.existsSync(paths_1.PATHS.authState)) {
        fs.unlinkSync(paths_1.PATHS.authState);
    }
}
function authStateExists() {
    return fs.existsSync(paths_1.PATHS.authState);
}
