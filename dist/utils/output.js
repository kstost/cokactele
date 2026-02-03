"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outputJson = outputJson;
exports.outputSuccess = outputSuccess;
exports.outputError = outputError;
function outputJson(result) {
    console.log(JSON.stringify(result));
}
function outputSuccess(data) {
    outputJson({ success: true, ...data });
}
function outputError(error) {
    let message;
    if (error instanceof Error) {
        message = error.message;
    }
    else if (typeof error === "string") {
        message = error;
    }
    else {
        message = String(error);
    }
    outputJson({ success: false, error: message });
}
