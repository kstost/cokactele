# cokactele

A terminal-based Telegram client for CLI automation and scripting.

[![npm version](https://badge.fury.io/js/cokactele.svg)](https://www.npmjs.com/package/cokactele)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Login** - Interactive Telegram authentication
- **Account Info** - Check account type (premium/free)
- **Chat List** - List all chats (users, groups, channels)
- **Messages** - Read and send messages
- **File Transfer** - Upload and download files with progress bar
- **Batch Upload** - Upload all files in a directory
- **JSON Output** - All outputs are JSON formatted for easy parsing

## Installation

```bash
npm install -g cokactele
```

Or use with npx:

```bash
npx cokactele --help
```

## Requirements

- Node.js >= 16.0.0
- Telegram account

## Quick Start

### 1. Login

```bash
cokactele login
```

Follow the interactive prompts to enter your phone number and verification code.

### 2. List Chats

```bash
cokactele listchat
```

### 3. Send a Message

```bash
cokactele sendmessage <chatId> -m "Hello, World!"
```

## Commands

| Command | Description |
|---------|-------------|
| `login` | Login to Telegram (interactive) |
| `accounttype` | Show account info (premium/free) |
| `listchat` | List all chats |
| `getmessages <chatId>` | Get messages from a chat |
| `sendmessage [chatId]` | Send a message or file |
| `downloadfile` | Download a file from a message |
| `setdefaultchatid <chatId>` | Set default chat ID |

## Command Details

### login

Interactive login to Telegram.

```bash
cokactele login
```

**Output:**
```json
{"success":true,"user":{"id":"123456789","firstName":"John"}}
```

### accounttype

Get account information including premium status.

```bash
cokactele accounttype
```

**Output:**
```json
{
  "success": true,
  "id": "123456789",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "phone": "1234567890",
  "premium": true,
  "accountType": "premium"
}
```

### listchat

List all chats.

```bash
cokactele listchat
```

**Output:**
```json
{
  "success": true,
  "chats": [
    {"id": "123456789", "type": "user", "title": "John Doe", "unreadCount": 0},
    {"id": "-100123456789", "type": "channel", "title": "My Channel", "unreadCount": 5}
  ]
}
```

**Chat Types:**
- `user` - Private chat
- `group` - Regular group
- `supergroup` - Supergroup
- `channel` - Channel

### getmessages

Get messages from a chat.

```bash
cokactele getmessages <chatId> [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--offset <n>` | Message ID offset (0 = latest) | 0 |
| `--limit <n>` | Number of messages | 30 |

**Examples:**
```bash
# Get latest 30 messages
cokactele getmessages 123456789

# Get latest 50 messages
cokactele getmessages 123456789 --limit 50

# Get 30 messages before message ID 1000
cokactele getmessages 123456789 --offset 1000
```

**Output:**
```json
{
  "success": true,
  "chatId": "123456789",
  "messages": [
    {
      "id": 999,
      "date": "2024-01-01T10:00:00.000Z",
      "fromId": "987654321",
      "text": "Hello!",
      "mediaType": null
    }
  ],
  "count": 30,
  "hasMore": true
}
```

**Media Types:**
- `photo` - Photo
- `document` - File/Document
- `webpage` - Web page link
- `geo` - Location
- `contact` - Contact
- `poll` - Poll
- `other` - Other media
- `null` - Text only

### sendmessage

Send a text message or file.

```bash
# Send text message
cokactele sendmessage <chatId> -m "Your message"

# Send file
cokactele sendmessage <chatId> -f /path/to/file

# Send file with caption
cokactele sendmessage <chatId> -f /path/to/file -m "Caption"

# Send all files in a directory
cokactele sendmessage <chatId> -f /path/to/folder

# Show upload progress
cokactele sendmessage <chatId> -f /path/to/file -v
```

**Options:**
| Option | Description |
|--------|-------------|
| `-m, --message <text>` | Text message or caption |
| `-f, --file <path>` | File or directory path |
| `-v, --verbose` | Show upload progress |

**File Size Limits:**
- Free account: 1.9GB
- Premium account: 3.9GB

**Note:** Successfully uploaded files are automatically deleted from local storage.

**Progress Display (-v):**
```
Uploading: large.zip
  [████████████░░░░░░░░] 60% | 1.2 GB/2 GB | ETA: 30s
  ✓ Success (messageId: 1234)

Completed: 1/1 files uploaded
```

### downloadfile

Download a file from a message.

```bash
cokactele downloadfile --chatId <id> --messageId <id> --path <path> [-v]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--chatId <id>` | Chat ID (required) |
| `--messageId <id>` | Message ID (required) |
| `--path <path>` | Save path (required) |
| `-v, --verbose` | Show download progress |

**Example:**
```bash
cokactele downloadfile --chatId 123456789 --messageId 100 --path ./file.zip -v
```

### setdefaultchatid

Set a default chat ID for `sendmessage` command.

```bash
cokactele setdefaultchatid <chatId>
```

After setting, you can omit `chatId` in `sendmessage`:

```bash
cokactele sendmessage -m "Message to default chat"
```

## Security

### Session Encryption

Session tokens are encrypted using **AES-256-GCM** with machine-specific keys:

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Machine Binding**: Keys are derived from hostname, username, and home directory
- **File Permissions**: Session file is stored with 0600 permissions (owner read/write only)

This means:
- Session tokens cannot be decrypted on a different machine
- Session tokens cannot be read by other users on the same system
- If you copy `~/.cokactele/` to another machine, you'll need to login again

### Automatic Migration

If you have an existing plaintext session file, it will be automatically encrypted on the next use.

## Configuration

Configuration files are stored in `~/.cokactele/`:

| File | Description |
|------|-------------|
| `session.txt` | Telegram session token |
| `settings.json` | User settings (defaultChatId, etc.) |
| `file/` | Upload records |

### Settings

**File:** `~/.cokactele/settings.json`

```json
{
  "defaultChatId": "123456789"
}
```

## File Records

Uploaded files are automatically recorded:

**Path:** `~/.cokactele/file/.__telelink__<chatId>_<messageId>.telecokac`

**Content:**
```json
{
  "chatId": "123456789",
  "messageId": 100,
  "fileName": "data.zip",
  "fileSize": 1048576,
  "caption": "",
  "uploadedAt": "2024-01-01T10:00:00.000Z"
}
```

## Logout

To logout, delete the configuration directory:

```bash
rm -rf ~/.cokactele
```

## Environment Variables

For enhanced security, you can set your own Telegram API credentials:

```bash
export TELEGRAM_API_ID=your_api_id
export TELEGRAM_API_HASH=your_api_hash
```

Get your API credentials from [my.telegram.org](https://my.telegram.org).

## Use Cases

### Automation Scripts

```bash
#!/bin/bash
# Send daily backup notification
cokactele sendmessage -m "Backup completed at $(date)"
```

### File Backup to Telegram

```bash
# Upload all files in backup folder
cokactele sendmessage -f ./backup -v
```

### CI/CD Notifications

```bash
# Send build status
cokactele sendmessage -m "Build #${BUILD_NUMBER} ${BUILD_STATUS}"
```

### Download Media

```bash
# Download file from message
cokactele downloadfile --chatId 123456789 --messageId 100 --path ./downloaded.zip
```

## Error Handling

All errors are returned in JSON format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common errors:
- `Not logged in. Run --login first.` - Need to login first
- `File too large for free account. Maximum: 1.9GB` - File exceeds size limit
- `Message does not contain a file` - No downloadable file in message

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

# cokactele (한국어)

터미널 기반 텔레그램 클라이언트로, CLI 자동화 및 스크립팅에 적합합니다.

## 기능

- **로그인** - 대화형 텔레그램 인증
- **계정 정보** - 계정 유형 확인 (프리미엄/일반)
- **채팅 목록** - 모든 채팅 목록 (사용자, 그룹, 채널)
- **메시지** - 메시지 읽기 및 전송
- **파일 전송** - 진행률 표시와 함께 파일 업로드/다운로드
- **일괄 업로드** - 디렉토리 내 모든 파일 업로드
- **JSON 출력** - 파싱하기 쉬운 JSON 형식 출력

## 설치

```bash
npm install -g cokactele
```

## 빠른 시작

### 1. 로그인

```bash
cokactele login
```

### 2. 채팅 목록 확인

```bash
cokactele listchat
```

### 3. 메시지 전송

```bash
cokactele sendmessage <chatId> -m "안녕하세요!"
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `login` | 텔레그램 로그인 (대화형) |
| `accounttype` | 계정 정보 (프리미엄/일반) |
| `listchat` | 채팅 목록 조회 |
| `getmessages <chatId>` | 메시지 조회 |
| `sendmessage [chatId]` | 메시지/파일 전송 |
| `downloadfile` | 파일 다운로드 |
| `setdefaultchatid <chatId>` | 기본 채팅 ID 설정 |

## 파일 크기 제한

- 일반 계정: 1.9GB
- 프리미엄 계정: 3.9GB

## 설정 파일 위치

- 세션: `~/.cokactele/session.txt`
- 설정: `~/.cokactele/settings.json`
- 파일 기록: `~/.cokactele/file/`

자세한 사용법은 [MANUAL.md](MANUAL.md)를 참고하세요.
