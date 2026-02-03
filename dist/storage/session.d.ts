export declare function ensureConfigDir(): void;
/**
 * 세션 저장 (AES-256-GCM 암호화)
 */
export declare function saveSession(sessionString: string): void;
/**
 * 세션 로드 (암호화된 세션 복호화, 평문 세션 자동 마이그레이션)
 */
export declare function loadSession(): string;
/**
 * 세션 존재 여부 확인
 */
export declare function sessionExists(): boolean;
