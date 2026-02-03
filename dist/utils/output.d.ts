export interface SuccessResult {
    success: true;
    [key: string]: unknown;
}
export interface ErrorResult {
    success: false;
    error: string;
}
export type Result = SuccessResult | ErrorResult;
export declare function outputJson(result: Result): void;
export declare function outputSuccess(data: Record<string, unknown>): void;
export declare function outputError(error: unknown): void;
