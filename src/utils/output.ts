export interface SuccessResult {
  success: true;
  [key: string]: unknown;
}

export interface ErrorResult {
  success: false;
  error: string;
}

export type Result = SuccessResult | ErrorResult;

export function outputJson(result: Result): void {
  console.log(JSON.stringify(result));
}

export function outputSuccess(data: Record<string, unknown>): void {
  outputJson({ success: true, ...data });
}

export function outputError(error: unknown): void {
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = String(error);
  }
  outputJson({ success: false, error: message });
}
