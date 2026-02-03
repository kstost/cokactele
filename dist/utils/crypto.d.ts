/**
 * 세션 문자열 암호화
 * 형식: salt(32) + iv(16) + authTag(16) + encryptedData
 * Base64로 인코딩하여 반환
 */
export declare function encryptSession(plaintext: string): string;
/**
 * 암호화된 세션 문자열 복호화
 */
export declare function decryptSession(encryptedData: string): string;
/**
 * 데이터가 암호화된 형식인지 확인
 * Base64로 디코딩 후 최소 헤더 길이 확인
 */
export declare function isEncryptedFormat(data: string): boolean;
