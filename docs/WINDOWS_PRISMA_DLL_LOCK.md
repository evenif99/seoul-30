# Windows Prisma DLL 잠금 문제 — 원인·해결·재발 방지 가이드

> 대상 환경: Windows 10/11, Node.js, Prisma 5+, Next.js  
> 핵심 원칙: **구조적으로 충돌 불가능한 실행 순서를 만들어라. 임시 해결은 반드시 재발한다.**

---

## 1. 원인 분석

### 무슨 일이 일어나는가

`prisma generate`는 `node_modules/.prisma/client/` 안에 플랫폼별 네이티브 바이너리를 생성한다.  
Windows에서는 이 파일이 `.dll.node` 확장자의 공유 라이브러리다.

```
node_modules/.prisma/client/query_engine-windows.dll.node
```

Prisma는 이 파일을 교체할 때 **임시 파일을 먼저 쓴 뒤 rename** 방식으로 원자 교체한다.

```
query_engine-windows.dll.node.tmp.xxxx  →  query_engine-windows.dll.node
```

문제는 이 rename 시점에 `.dll.node`를 **이미 다른 프로세스가 열고(lock) 있으면** Windows는 rename을 거부한다.

```
EPERM: operation not permitted, rename '...dll.node.tmp.xxxx' -> '...dll.node'
```

### 어떤 프로세스가 잠그는가

| 프로세스 | 잠금 이유 |
|---|---|
| `next dev` (Next.js 개발 서버) | `@prisma/client` import 시 DLL 로드 — 서버가 살아있는 한 계속 점유 |
| `vitest`, `jest` | 테스트 실행 중 Prisma client를 import하면 로드 |
| `ts-node`, `tsx`, `ts-node-dev` | TypeScript 파일 직접 실행 시 |
| `nodemon` | 재시작 루프 중에도 로드 상태 유지 |
| 바이러스 백신(Windows Defender 포함) | 새 DLL 파일 생성 직후 스캔으로 일시 잠금 |
| VS Code 확장 (Prisma 공식 extension 포함) | Language Server가 schema를 감시하며 간접 로드 |

### Windows에서 특히 잘 발생하는 이유

Linux/macOS는 **파일이 열려 있어도 unlink 후 새 파일로 교체** 가능 (inode 교체 방식).  
Windows는 **파일 핸들이 열려 있으면 rename/delete 모두 거부** — 이것이 근본 차이다.

```
Linux:  open file → rename 가능 (구 inode는 마지막 핸들 닫힐 때 삭제)
Windows: open file → rename EPERM → 무조건 실패
```

---

## 2. 즉시 해결 방법

### Step 1 — 모든 Node 프로세스 종료

```powershell
# 방법 A: 작업 관리자에서 node.exe 전체 종료 (GUI)

# 방법 B: PowerShell (권장)
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name "next-server" -Force -ErrorAction SilentlyContinue
```

VS Code를 사용한다면 **터미널 탭 전체를 닫은 후** VS Code 자체도 재시작한다.  
(Prisma VS Code 익스텐션이 Language Server를 유지할 수 있음)

### Step 2 — 잠긴 파일 확인 (선택, 원인 특정 시)

```powershell
# Sysinternals handle.exe가 있다면:
handle.exe query_engine-windows.dll.node

# 또는 PowerShell로 점유 프로세스 확인
$file = "node_modules\.prisma\client\query_engine-windows.dll.node"
Get-Process | Where-Object { $_.Modules.FileName -like "*query_engine*" }
```

### Step 3 — Prisma 캐시 및 생성 파일 삭제

```powershell
# node_modules/.prisma 디렉터리 삭제 (generate 결과물)
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# Next.js 빌드 캐시도 함께 정리
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

> **주의**: `node_modules` 전체는 삭제하지 않아도 된다. `.prisma` 디렉터리만으로 충분하다.

### Step 4 — 재생성

```powershell
npx prisma generate
```

오류 없이 완료되면 `npm run dev`로 재시작.

### Step 5 — 그래도 실패한다면 (Windows Defender 개입 의심)

```powershell
# 잠시 실시간 보호 비활성화 후 generate (관리자 PowerShell)
Set-MpPreference -DisableRealtimeMonitoring $true
npx prisma generate
Set-MpPreference -DisableRealtimeMonitoring $false
```

또는 Windows Defender 제외 경로 등록 (영구 해결, 아래 섹션 참고).

---

## 3. 영구 예방 방법

### [핵심] dev 서버 시작 전에 generate를 완료하라

가장 중요한 원칙이다. `next dev`가 올라가기 **전에** generate가 끝나 있으면 충돌할 이유가 없다.

#### npm `predev` 훅 활용 (권장)

npm은 `dev` 스크립트 실행 전에 `predev`를 자동 실행한다.

```json
// package.json
{
  "scripts": {
    "predev": "prisma generate",
    "dev": "next dev -p 3001",
    "build": "prisma generate && next build",
    "start": "next start"
  }
}
```

이렇게 하면 `npm run dev` 실행 시 항상 generate → next dev 순서가 보장된다.  
`next dev`가 실행 중일 때는 generate를 절대 따로 돌리지 않는다.

#### 비권장 패턴

```json
// ❌ 비권장: dev 실행 중에 별도 터미널에서 prisma generate 실행
// → 항상 EPERM 위험

// ❌ 비권장: postinstall에서 generate
// "postinstall": "prisma generate"
// → npm install 도중에 기존 dev 서버가 살아있으면 충돌
```

### schema 변경 워크플로

```
schema.prisma 수정
  → npm run dev 중지 (Ctrl+C)
  → npx prisma generate
  → npx prisma db push  (스키마 변경 시)
  → npm run dev 재시작
```

dev 서버를 **절대 켜진 상태**에서 `prisma generate`를 실행하지 않는다.

### Windows Defender 제외 경로 등록 (재발 방지)

바이러스 백신의 실시간 스캔이 DLL 파일을 일시적으로 잠그는 케이스를 방지한다.

```powershell
# 관리자 PowerShell에서 실행
$projectPath = "C:\project\seoul-30-webapp"  # 실제 경로로 변경

Add-MpPreference -ExclusionPath "$projectPath\node_modules"
Add-MpPreference -ExclusionPath "$projectPath\.next"
Add-MpPreference -ExclusionProcess "node.exe"
```

> **보안 주의**: 프로젝트 디렉터리를 신뢰할 수 있는 경우에만 적용. 팀 공유 PC에서는 신중히.

### VS Code Prisma 익스텐션 충돌 방지

Prisma 공식 익스텐션(Language Server)이 schema 변경 감지 후 내부적으로 DLL을 로드할 수 있다.

```json
// .vscode/settings.json (프로젝트 전용)
{
  "prisma.showPrismaDataPlatformNotification": false
}
```

generate 실행 전에는 VS Code 터미널에서 실행하지 말고,  
**외부 터미널(PowerShell, Windows Terminal)** 에서 실행하면 Language Server와 분리된다.

### 동시 실행 프로세스 수 최소화

```
권장 실행 패턴:
  터미널 1: npm run dev (next dev 전용)
  터미널 2: npm run test (필요할 때만, dev와 동시에 피하기)

비권장:
  터미널 1: next dev 실행 중
  터미널 2: prisma generate 실행  ← 충돌 발생
  터미널 3: vitest watch 실행     ← DLL 추가 점유
```

---

## 4. 권장 프로젝트 구조

### package.json scripts (이 프로젝트 기준)

```json
{
  "scripts": {
    "predev": "prisma generate",
    "dev": "next dev -p 3001",
    "build": "prisma generate && next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

`db:generate` / `db:push` / `db:studio`를 별도 명령으로 분리하면,  
"DB 작업은 dev 서버 끄고 해야 한다"는 맥락이 명확해진다.

### 개발 실행 흐름

```
# 최초 셋업 또는 schema 변경 시
npm install          # 의존성 설치
npx prisma generate  # 클라이언트 생성 (dev 서버 OFF 상태에서)
npx prisma db push   # DB 스키마 반영 (schema 변경 시만)

# 일반 개발
npm run dev          # predev가 prisma generate 자동 실행 → next dev 시작
```

### pnpm 사용 시

```json
{
  "scripts": {
    "predev": "prisma generate",
    "dev": "next dev -p 3001"
  }
}
```

pnpm도 `preX` 훅을 지원한다. 동일하게 동작한다.

### yarn 사용 시

```json
{
  "scripts": {
    "predev": "prisma generate",
    "dev": "next dev -p 3001"
  }
}
```

yarn berry(v2+)는 `predev` 훅을 기본 지원하지 않는다.  
이 경우 `dev` 스크립트에 직접 체이닝한다.

```json
{
  "scripts": {
    "dev": "prisma generate && next dev -p 3001"
  }
}
```

---

## 5. 체크리스트

### 즉시 해결 체크리스트

```
□ 터미널의 모든 node 프로세스 종료 (Ctrl+C 또는 Stop-Process)
□ VS Code 재시작 (Prisma Language Server 포함 종료)
□ node_modules\.prisma 디렉터리 삭제
□ .next 디렉터리 삭제 (선택)
□ npx prisma generate 재실행
□ npm run dev로 정상 기동 확인
```

### 재발 방지 체크리스트

```
□ package.json에 "predev": "prisma generate" 추가됨
□ dev 서버 켠 상태로 prisma generate 실행하지 않음
□ schema.prisma 변경 시 → dev 중지 → generate → db push → dev 재시작 순서 준수
□ node_modules 전체를 Windows Defender 제외 경로에 등록함
□ VS Code에서 Prisma 파일을 편집 중일 때 generate 실행 피함
□ vitest watch 모드와 next dev 동시 실행 최소화
□ CI/CD(GitHub Actions)에서는 build 스크립트가 generate를 포함하므로 별도 조치 불필요
```

### 팀 공유 원칙 (한 줄 요약)

> **"dev 서버가 켜진 상태에서 `prisma generate`를 절대 실행하지 않는다.  
> `npm run dev`가 자동으로 generate를 선행한다."**

---

## macOS / Linux 차이

| 항목 | Windows | macOS / Linux |
|---|---|---|
| DLL 잠금 | 파일 열려 있으면 rename 불가 | 열려 있어도 rename 가능 (inode 교체) |
| 바이러스 백신 개입 | Windows Defender 자동 활성 | 대부분 없음 |
| 재현 빈도 | 높음 | 거의 없음 |
| 해결 난이도 | 높음 (프로세스 종료 필수) | 낮음 (대부분 자동 해결) |

macOS/Linux에서 이 오류가 발생하면 대부분 동시에 `prisma generate`를 두 번 실행한 경쟁 조건이다.  
해결책은 동일: 모든 Node 프로세스 종료 후 재생성.

---

_Last updated: 2026-05-21_
