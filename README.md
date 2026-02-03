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

## Step-by-Step Guide for Beginners

This guide walks you through using cokactele from scratch.
Follow these steps to send messages and upload files via terminal.

### Step 1: Install cokactele

Make sure Node.js is installed, then run:

```bash
npm install -g cokactele
```

Once installed, the `cokactele` command is available.

### Step 2: Login to Telegram

Connect your Telegram account:

```bash
cokactele login
```

You'll see a prompt asking for your phone number:

```text
Enter phone number (with country code, e.g., +820000000000):
```

Enter your phone number with country code:

```text
+821012345678
```

### Step 3: Enter Verification Code

After entering your phone number, Telegram will send a verification code to your app.

```text
Authentication code sent via app
Enter the code you received:
```

Enter the code from your Telegram app. Once verified, you're logged in!
(You won't need to login again on this machine)

### Step 4: Find Your Chat ID

List all your chats to find the chat ID:

```bash
cokactele listchat
```

Output example:

```json
{
  "success": true,
  "chats": [
    {
      "id": "123456789",
      "type": "user",
      "title": "John Doe",
      "unreadCount": 0
    },
    {
      "id": "-100987654321",
      "type": "channel",
      "title": "My Channel",
      "unreadCount": 5
    }
  ]
}
```

**Important fields:**
- `id` - **Chat ID** (you need this to send messages!)
- `title` - Chat name
- `type` - user / group / channel

**Tip:** Use `jq` for prettier output:

```bash
cokactele listchat | jq
```

### Step 5: Send a Message

Now send a message using the chat ID:

```bash
cokactele sendmessage 123456789 -m "Hello from terminal!"
```

Output:

```json
{
  "success": true,
  "messageId": 1001,
  "chatId": "123456789",
  "text": "Hello from terminal!",
  "date": "2026-01-01T12:00:00.000Z"
}
```

### Step 6: Upload a File

Send a file to a chat:

```bash
cokactele sendmessage 123456789 -f ./example.zip
```

Add `-v` to see upload progress:

```bash
cokactele sendmessage 123456789 -f ./example.zip -v
```

Output:

```
Uploading: example.zip
  [████████████████████████] 100% | 10 MB/10 MB | ETA: 0s
  ✓ Success (messageId: 1002)

Completed: 1/1 files uploaded
```

### Step 7: Upload an Entire Folder

Upload all files in a directory at once:

```bash
cokactele sendmessage 123456789 -f ./backup-folder -v
```

Files are uploaded one by one in order.

### What You Can Do Now

- Send messages from terminal
- Upload files and folders
- Add Telegram notifications to automation scripts
- Send alerts from servers, CI/CD pipelines, or backup jobs

### Example: Automation Script

```bash
#!/bin/bash
# Send notification when a job completes
cokactele sendmessage 123456789 -m "Job completed at $(date)"
```

---

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
| `-r, --remove` | Remove file after successful upload |

**File Size Limits:**
- Free account: 1.9GB
- Premium account: 3.9GB

**Note:** Use `-r` or `--remove` flag to delete local files after successful upload.

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

