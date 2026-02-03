# cokactele 프로젝트 리포트

## 개요

터미널 기반 텔레그램 클라이언트 (TypeScript + GramJS)

## 프로젝트 구조

```
cokactele/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI 진입점
│   ├── config/
│   │   ├── constants.ts      # API_ID, API_HASH (환경변수 지원)
│   │   └── paths.ts          # ~/.cokactele/ 경로
│   ├── storage/
│   │   ├── session.ts        # 세션 저장/로드
│   │   └── auth-state.ts     # 인증 중간 상태
│   ├── telegram/
│   │   ├── client.ts         # TelegramClient 래퍼
│   │   ├── auth.ts           # 인증 로직
│   │   └── dialogs.ts        # 채팅방 목록
│   ├── types/
│   │   └── input.d.ts        # input 모듈 타입 정의
│   └── utils/
│       └── output.ts         # JSON 출력
└── dist/                     # 컴파일 결과
```

## CLI 명령어

| 명령어 | 설명 |
|--------|------|
| `cokactele --getauthcode` | 전화번호 입력 → 인증코드 요청 |
| `cokactele --login <code>` | 인증코드로 로그인 |
| `cokactele --listchat` | 채팅방 목록 조회 |
| `cokactele --help` | 도움말 출력 |

## 인증 흐름

```
--getauthcode
    ├── API 자격증명 검증
    ├── 전화번호 입력 (stdin)
    ├── client.sendCode() 호출
    ├── phoneCodeHash를 ~/.cokactele/auth_state.json에 저장
    └── JSON 결과 출력

--login <code>
    ├── API 자격증명 검증
    ├── auth_state.json 로드
    ├── client.signIn(phone, phoneCodeHash, code)
    ├── 성공 시 세션을 ~/.cokactele/session.txt에 저장
    ├── auth_state.json 삭제
    └── JSON 결과 출력
```

## JSON 출력 포맷

**--getauthcode 성공:**
```json
{"success": true, "phoneCodeHash": "xxx", "codeType": "app"}
```

**--login 성공:**
```json
{"success": true, "user": {"id": "123", "firstName": "Name"}}
```

**--listchat 성공:**
```json
{"success": true, "chats": [{"id": "-100xxx", "type": "channel", "title": "...", "unreadCount": 5}]}
```

**에러:**
```json
{"success": false, "error": "에러 메시지"}
```

## 저장 파일

| 파일 | 설명 |
|------|------|
| `~/.cokactele/session.txt` | 로그인 세션 (StringSession) |
| `~/.cokactele/auth_state.json` | 인증 중간 상태 (임시) |

## 의존성

```json
{
  "dependencies": {
    "telegram": "^2.22.2",
    "input": "^1.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
```

## 설정 방법

### 환경변수 사용 (권장)
```bash
export TELEGRAM_API_ID=12345678
export TELEGRAM_API_HASH=abcdef1234567890
```

### 직접 수정
`src/config/constants.ts` 파일에서 API_ID와 API_HASH 값을 수정 후 `npm run build`

## 코드 리뷰 및 수정 사항

### 발견된 문제점

| 문제 | 심각도 | 상태 |
|------|--------|------|
| API 자격증명 미검증 | 심각 | 수정됨 |
| JSON.parse 예외 미처리 | 중간 | 수정됨 |
| 에러 타입 캐스팅 불안전 | 중간 | 수정됨 |
| dialog.entity null 체크 누락 | 중간 | 수정됨 |
| ChatForbidden/ChannelForbidden 미처리 | 낮음 | 수정됨 |
| session.save() 이중 캐스팅 | 낮음 | 유지 (타입 정의 문제) |

### 수정 내용

1. **config/constants.ts**
   - 환경변수 지원 추가 (`TELEGRAM_API_ID`, `TELEGRAM_API_HASH`)
   - `validateCredentials()` 함수 추가로 자격증명 미설정 시 명확한 에러 메시지

2. **storage/auth-state.ts**
   - `loadAuthState()`에 try-catch 추가
   - JSON 스키마 검증 추가

3. **utils/output.ts**
   - `outputError(error: unknown)` 타입 변경으로 모든 에러 타입 안전 처리

4. **telegram/dialogs.ts**
   - entity null 체크 추가
   - `Api.ChatForbidden`, `Api.ChannelForbidden` 타입 처리 추가
   - 채팅 타입에 "unknown" 추가

5. **telegram/auth.ts**
   - 에러 타입 캐스팅 제거
   - `validateCredentials()` 호출 추가

## 빌드 및 실행

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 실행
node dist/index.js --help

# 전역 설치 (선택)
npm link
cokactele --help
```

## 검증 방법

1. `npm run build` - TypeScript 컴파일 성공
2. `cokactele --getauthcode` - 전화번호 입력 후 JSON 출력 확인
3. `cokactele --login <code>` - 텔레그램에서 받은 코드로 로그인
4. `cokactele --listchat` - 채팅방 목록 JSON 출력 확인
5. `~/.cokactele/session.txt` 파일 생성 확인
