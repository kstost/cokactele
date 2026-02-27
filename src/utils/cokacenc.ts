import * as fs from "fs";
import * as path from "path";

const MAGIC = Buffer.from("COKACENC");
const EXPECTED_VERSION = 2;
const HEADER_MIN_SIZE = 46; // magic(8) + version(4) + salt(16) + iv(16) + filename_len(2)

// cokacdir naming: [key_prefix_]<16hex_group_id>_<4letter_seq>.cokacenc
const COKACENC_PATTERN = /^(?:[^_]+_)?([0-9a-f]{16})_([a-z]{4})\.cokacenc$/;

export function isCokacencFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  return COKACENC_PATTERN.test(basename);
}

export function readOriginalName(filePath: string): string | null {
  try {
    const fd = fs.openSync(filePath, "r");
    try {
      const header = Buffer.alloc(HEADER_MIN_SIZE);
      const bytesRead = fs.readSync(fd, header, 0, HEADER_MIN_SIZE, 0);
      if (bytesRead < HEADER_MIN_SIZE) return null;

      // magic check
      if (!header.subarray(0, 8).equals(MAGIC)) return null;

      // version check
      const version = header.readUInt32LE(8);
      if (version !== EXPECTED_VERSION) return null;

      // skip salt(16) + iv(16), read filename length at offset 44
      const filenameLen = header.readUInt16LE(44);
      if (filenameLen === 0 || filenameLen > 1024) return null;

      const nameBuf = Buffer.alloc(filenameLen);
      const nameRead = fs.readSync(fd, nameBuf, 0, filenameLen, HEADER_MIN_SIZE);
      if (nameRead < filenameLen) return null;

      return nameBuf.toString("utf-8");
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return null;
  }
}
