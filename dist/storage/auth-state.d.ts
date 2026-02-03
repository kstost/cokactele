export interface AuthState {
    phone: string;
    phoneCodeHash: string;
    sessionString: string;
}
export declare function saveAuthState(state: AuthState): void;
export declare function loadAuthState(): AuthState | null;
export declare function deleteAuthState(): void;
export declare function authStateExists(): boolean;
