# cokactele 사용 설명서

터미널 기반 텔레그램 클라이언트

## 빌드

```bash
npm install
npm run build
```

## 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `--login` | 로그인 (대화형) |
| `--accounttype` | 계정 정보 (프리미엄/일반) |
| `--listchat` | 채팅 목록 조회 |
| `--getmessages <chatId>` | 메시지 조회 |
| `--sendmessage [chatId]` | 메시지/파일 전송 |
| `--downloadfile` | 파일 다운로드 |
| `--setdefaultchatid <chatId>` | 기본 채팅 ID 설정 |

## 명령어 상세

### 로그인

```bash
cokactele --login
```

대화형으로 로그인 진행.

**과정:**
```
$ cokactele --login
? Enter phone number (with country code, e.g., +820000000000): +820000000000

Authentication code sent via app
? Enter the code you received: 12345

{"success":true,"user":{"id":"123456789","firstName":"홍길동"}}
```

### 계정 정보 조회

```bash
cokactele --accounttype
```

로그인된 계정 정보 및 프리미엄 여부 확인.

**출력:**
```json
{
  "success": true,
  "id": "123456789",
  "firstName": "홍길동",
  "lastName": "",
  "username": "gildong",
  "phone": "821012345678",
  "premium": true,
  "accountType": "premium"
}
```

### 채팅 목록 조회

```bash
cokactele --listchat
```

모든 채팅(사용자, 그룹, 채널) 목록 조회.

**출력:**
```json
{
  "success": true,
  "chats": [
    {"id": "123456789", "type": "user", "title": "홍길동", "unreadCount": 0},
    {"id": "-100123456789", "type": "channel", "title": "공지채널", "unreadCount": 5}
  ]
}
```

**채팅 타입:**
- `user`: 개인 대화
- `group`: 일반 그룹
- `supergroup`: 슈퍼그룹
- `channel`: 채널

### 메시지 조회

```bash
cokactele --getmessages <chatId> [options]
```

특정 채팅의 메시지 조회.

**옵션:**
| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--offset <n>` | 이 메시지 ID 이전부터 조회 (0=최신) | 0 |
| `--limit <n>` | 가져올 메시지 수 | 30 |

**예시:**
```bash
# 최신 메시지 30개
cokactele --getmessages 123456789

# 최신 메시지 50개
cokactele --getmessages 123456789 --limit 50

# 메시지 ID 1000 이전의 메시지 30개
cokactele --getmessages 123456789 --offset 1000 --limit 30
```

**출력:**
```json
{
  "success": true,
  "chatId": "123456789",
  "messages": [
    {
      "id": 999,
      "date": "2026-02-03T10:00:00.000Z",
      "fromId": "987654321",
      "text": "안녕하세요",
      "mediaType": null
    }
  ],
  "count": 30,
  "hasMore": true
}
```

**미디어 타입:**
- `photo`: 사진
- `document`: 파일
- `webpage`: 웹페이지 링크
- `geo`: 위치
- `contact`: 연락처
- `poll`: 투표
- `other`: 기타
- `null`: 텍스트만

### 메시지 전송

```bash
cokactele --sendmessage [chatId] -m <text>
```

특정 채팅에 메시지 전송. `chatId` 생략 시 `settings.json`의 `defaultChatId` 사용.

**예시:**
```bash
# chatId 지정
cokactele --sendmessage 123456789 -m "안녕하세요"

# chatId 생략 (defaultChatId 사용)
cokactele --sendmessage -m "안녕하세요"
```

**출력:**
```json
{
  "success": true,
  "messageId": 1234,
  "chatId": "123456789",
  "text": "안녕하세요",
  "date": "2026-02-03T10:00:00.000Z"
}
```

### 파일 전송

```bash
cokactele --sendmessage [chatId] -f <path> [options]
```

특정 채팅에 파일 또는 폴더 내 모든 파일 전송. `chatId` 생략 시 `settings.json`의 `defaultChatId` 사용.

업로드 성공 시 원본 파일은 자동 삭제됩니다. 폴더 업로드 시 파일 크기순(작은 것부터) 정렬하여 전송.

**옵션:**
| 옵션 | 설명 |
|------|------|
| `-f, --file <path>` | 파일 또는 폴더 경로 |
| `-m, --message <text>` | 캡션 (선택) |
| `-v, --verbose` | 업로드 진행률 표시 |

**파일 크기 제한:**
- 일반 유저: 1.9GB
- 프리미엄 유저: 3.9GB

**예시:**
```bash
# 단일 파일 전송
cokactele --sendmessage 123456789 -f /path/to/data.zip

# 파일 + 캡션
cokactele --sendmessage 123456789 -f /path/to/image.jpg -m "사진입니다"

# 폴더 내 모든 파일 전송
cokactele --sendmessage 123456789 -f /path/to/folder

# 진행률 표시
cokactele --sendmessage 123456789 -f /path/to/large.zip -v
```

**진행률 표시 (-v):**
```
Uploading: large.zip
  [████████████░░░░░░░░] 60% | 1.2 GB/2 GB | ETA: 30s
  ✓ Success (messageId: 1234)

Completed: 1/1 files uploaded
```

**단일 파일 출력:**
```json
{
  "success": true,
  "messageId": 1234,
  "chatId": "123456789",
  "fileName": "data.zip",
  "fileSize": 1048576,
  "caption": "",
  "date": "2026-02-03T10:00:00.000Z"
}
```

**폴더 전송 출력:**
```json
{
  "success": true,
  "chatId": "123456789",
  "directory": "/path/to/folder",
  "totalFiles": 3,
  "uploaded": 2,
  "failed": 1,
  "files": [
    {"fileName": "a.txt", "fileSize": 100, "messageId": 1234, "success": true},
    {"fileName": "b.txt", "fileSize": 200, "messageId": 1235, "success": true},
    {"fileName": "c.zip", "fileSize": 5000000000, "messageId": 0, "success": false, "error": "File too large..."}
  ]
}
```

### 파일 다운로드

```bash
cokactele --downloadfile --chatId <id> --messageId <id> --path <path> [options]
```

메시지에 첨부된 파일 다운로드.

**옵션:**
| 옵션 | 설명 |
|------|------|
| `--chatId <id>` | 채팅 ID |
| `--messageId <id>` | 메시지 ID |
| `--path <path>` | 저장 경로 |
| `-v, --verbose` | 다운로드 진행률 표시 |

**예시:**
```bash
# 기본
cokactele --downloadfile --chatId 54335681 --messageId 780204 --path ./data.bin

# 진행률 표시
cokactele --downloadfile --chatId 54335681 --messageId 780204 --path ./data.bin -v
```

**진행률 표시 (-v):**
```
Downloading: dummy.bin
  [████████████░░░░░░░░] 60% | 12 MB/20 MB | ETA: 5s
  ✓ Saved to: ./data.bin

Completed: 20 MB downloaded
```

**출력:**
```json
{
  "success": true,
  "chatId": "54335681",
  "messageId": 780204,
  "fileName": "dummy.bin",
  "fileSize": 20971520,
  "savedPath": "./data.bin"
}
```

### 도움말

```bash
cokactele --help
cokactele <command> --help
```

## 파일 기록

업로드된 파일은 자동으로 기록됩니다.

**저장 경로:**
```
~/.cokactele/file/.__telelink__{{chatId}}_{{messageId}}.telecokac
```

**예시:**
```
~/.cokactele/file/.__telelink__54335681_780204.telecokac
```

**내용:**
```json
{
  "chatId": "54335681",
  "messageId": 780204,
  "fileName": "data.zip",
  "fileSize": 1048576,
  "caption": "",
  "uploadedAt": "2026-02-03T10:00:00.000Z"
}
```

## 설정

**설정 파일:** `~/.cokactele/settings.json`

### defaultChatId 설정하기

#### 1단계: chatId 확인

```bash
cokactele --listchat
```

**출력 예시:**
```json
{
  "success": true,
  "chats": [
    {"id": "54335681", "type": "user", "title": "홍길동", "unreadCount": 0},
    {"id": "-100123456789", "type": "channel", "title": "공지채널", "unreadCount": 5},
    {"id": "-987654321", "type": "group", "title": "스터디그룹", "unreadCount": 2}
  ]
}
```

원하는 채팅의 `id` 값을 복사합니다.

#### 2단계: defaultChatId 설정

**방법 1: CLI 명령어 (권장)**
```bash
cokactele --setdefaultchatid 54335681
```

**출력:**
```json
{"success":true,"defaultChatId":"54335681"}
```

**방법 2: 직접 파일 편집**
```bash
nano ~/.cokactele/settings.json
```

```json
{
  "defaultChatId": "54335681"
}
```

#### 3단계: 확인

```bash
# chatId 없이 메시지 전송 테스트
cokactele --sendmessage -m "테스트 메시지"
```

### 설정 항목

| 설정 | 설명 |
|------|------|
| `defaultChatId` | `--sendmessage`에서 chatId 생략 시 사용할 기본 채팅 ID |

## 세션 정보

- 세션 파일: `~/.cokactele/session.txt`

로그아웃하려면 `~/.cokactele/` 디렉토리 삭제.
