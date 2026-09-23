# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

기준 기획문서는 `PRD.md`다. 이 문서와 PRD.md가 다르면 **PRD.md가 우선**한다.

## 제품 개요

로그인 없이 1인 전용으로 쓰는 영어 말하기 연습 웹앱이다. 문장을 폴더별로 모아 두고 듣기(TTS) → 가리기 → 말하기(STT) → 숙련도 기록 순서로 반복 연습한다. 대상은 영어 스크립트로 공부하는 한국어 화자다.

## 현재 상태

1~6단계(데이터 계층, 폴더·문장 추가 패널, 문장 표 화면, 메인 다이얼, TTS/STT, 예외 처리)까지 구현돼 기능은 MVP 수준으로 완료됐다. 다음 계획은 디자인 작업이다(지금 CSS는 기본 스타일뿐). 다이얼은 `components/Dial.jsx`, 폴더별 중앙 문장 id는 `hooks/CenterContext.jsx`. 현재 폴더는 URL(`:folderId`)이 기준이고 `hooks/FoldersContext.jsx`(폴더 목록·문장 수·변경 동작), `hooks/useCurrentFolder.js`를 쓴다. 테스트는 vitest, 린트 도구는 아직 없다.

- 구현됨: React 19 + Vite + JavaScript + react-router-dom 7 설정. `src/App.jsx`에 라우트 정의(`/`, `/folders/:folderId`, `/folders/:folderId/table`, 그 외는 `/`로 리다이렉트). 빈 페이지(`PracticePage`, `TablePage`)와 빈 패널(`FolderPanel`, `AddSentencePanel`). `services/`는 README만 있는 빈 폴더이고 `styles/index.css`에 기본 CSS. `storage/`(localStorage 한 키 JSON, 오류는 `StorageError.code`)와 `utils/`(`csv.js`, `filter.js`, `navigation.js`)는 구현·테스트 완료. 필터는 통과시킬 숙련도 배열(기본 `[0,1,2]`).
- TTS/STT: `services/tts.js`(speechSynthesis), `services/stt.js`(webkitSpeechRecognition). 화면 연결은 `components/ListenButton.jsx`, `TranscriptCell.jsx`. 예외 안내 문구도 구현됨.
- 주의: STT는 VS Code 안 내장 브라우저에서는 `network` 오류가 나서 동작하지 않는다. 확인은 반드시 외부 Chrome(localhost)에서 한다.
- 미구현: 디자인(레이아웃·색·타이포·반응형 등). 기능 변경 없이 스타일 위주로 진행한다.

명령어:
- `npm install`: 의존성 설치
- `npm run dev`: 개발 서버 (기본 http://localhost:5173)
- `npm run build`: 프로덕션 빌드 (`dist/`)
- `npm test`: vitest 1회 실행 (`npm run test:watch`는 감시 모드). 테스트는 `*.test.js`로 소스 옆에 두고, node 환경용 localStorage 대체는 `src/test/setup.js`.

## 화면과 라우팅

화면(URL)은 두 개다.
- 메인 화면(연습): `/folders/:folderId`. 앱을 열면 처음 보이는 화면. 한 문장에 집중해서 연습하는 다이얼식 표.
- 문장 표 화면: `/folders/:folderId/table`. 문장을 한눈에 보고 수정·삭제하는 화면. 마이크·STT·듣기 기능은 없다.

폴더 패널과 문장 추가 패널은 URL 없이 화면 위에 열리는 오버레이다. 문장 추가 패널은 두 화면에서 공용이다. 별도 라우트를 만들지 않는다.

## 핵심 요구사항 요약

- **폴더**: 만들기(앞뒤 공백 제거, 빈 이름·중복 이름 거부), 삭제(확인 후 안의 문장도 함께 삭제). 이름 변경과 다른 폴더로 문장 이동은 v1 제외.
- **문장 추가**: 직접 입력(en/ko 중 하나만 있어도 됨, 둘 다 비면 거부) 또는 CSV 업로드. 선택한 폴더의 맨 뒤에 이어 붙이고 중복 영어 문장도 허용한다.
- **CSV 형식**: 열은 `id, en, ko, transcript`, 첫 행은 header, UTF-8. id 값은 무시하고(id는 앱이 부여), 폴더 맨 뒤부터 행 순서대로 position을 부여한다. transcript는 최근 발화로 저장한다. 따옴표 안의 쉼표와 한글이 깨지면 안 된다. 형식 오류는 업로드 전체 취소, en/ko가 둘 다 빈 행은 그 행만 건너뛴다. `.xlsx` 직접 업로드는 v1 제외.
- **다이얼식 표(메인)**: 중앙 행은 카드 형태로 강조하고, 중앙과 바로 위·아래 3개 행은 완전한 형태, 그 바깥은 작고 흐리게(scale·opacity 감소, 위아래 각 1~2개). 위/아래 버튼, 마우스 휠, 행 클릭으로 이동한다. 첫 문장에서 위로 가면 마지막 문장으로, 마지막에서 아래로 가면 첫 문장으로 순환한다.
- **열**: 번호 / 영어 / 한국어 / 내가 말한 내용 / 숙련도. 영어·한국어 열은 각각 독립적으로 보임·숨김하며, 숨겨도 열 자리는 유지한다. 이 상태는 저장하지 않는다.
- **중앙 행 전용 기능**: 영어 셀 [듣기](브라우저 내장 TTS, 영어 열이 숨겨져 있어도 사용 가능), 발화 셀의 마이크 + 텍스트 입력창, 숙련도 배지.
- **숙련도**: 0 완전 생소 / 1 활용 미숙 / 2 획득. 사용자가 직접 지정하고 배지 클릭 시 순환하며 즉시 저장한다. 필터(체크박스 3개)는 메인과 문장 표 화면이 같은 상태를 공유한다. 필터를 켜도 번호는 폴더 안 원래 번호를 유지한다.
- **이동 규칙**: 위/아래는 현재 번호보다 작은/큰 번호 중 필터를 통과하는 가장 가까운 문장. 숙련도를 바꿔 현재 문장이 필터에서 빠져도 이동 전까지는 중앙에 그대로 둔다.
- **발화(last_transcript)**: 문장당 최근 1개만 저장하고 새로 말하면 덮어쓴다. 저장 시점은 인식 종료 시, 또는 타이핑 후 입력창을 벗어날 때. 원문과의 자동 비교 표시는 없다.
- **문장 표 화면**: 필터, 정렬(번호순 기본 / 숙련도순, 이 화면에만 적용), 문장 수정·삭제, 행 클릭 시 메인으로 이동해 그 문장이 중앙에 온다. 삭제하면 뒤 문장의 번호가 하나씩 당겨진다.
- **예외 처리**: 폴더 없음, 문장 없음, 필터 결과 0개, STT/TTS 미지원, 마이크 권한 거부, 인식 실패 때 앱이 멈추지 않고 안내 문구가 나와야 한다. 자세한 문구와 동작은 PRD.md 4항 참고.

## 데이터 모델

`folders` 1 : N `sentences`.
- folders: `id`(불변), `name`(필수, 중복 불가)
- sentences: `folder_id`, `id`(불변 고유 식별자, 화면에 안 보임), `position`(폴더 안 순번, 1..N, 화면의 "번호" 열), `en`, `ko`, `proficiency`(0/1/2, 기본 0), `last_transcript`. en/ko 중 하나는 공백 제외 비어 있지 않아야 한다.

주의:
- 문장 삭제 시 뒤 문장의 position을 당기는 갱신은 전부 성공하거나 전부 취소되어야 한다.
- position은 삭제 후 바뀌므로 React key와 "현재 문장" 상태는 id로 잡는다. position으로 잡으면 삭제 후 엉뚱한 문장을 가리킨다.
- 브라우저 저장소는 사용자가 사이트 데이터를 지우면 사라지고 용량 한계가 있다.

## 코드 구조

- `src/App.jsx`: 라우팅 정의
- `src/pages/`: 화면 (`PracticePage`, `TablePage`)
- `src/components/`: 화면 안의 부품 (`FolderPanel`, `AddSentencePanel`, 이후 다이얼 등)
- `src/storage/`: 데이터 저장. localStorage는 여기서만 접근한다.
- `src/services/`: 브라우저 기능(TTS, STT)
- `src/utils/`: 순수 계산 함수 (CSV 파싱, 필터, 이동 규칙)
- `src/hooks/`: React 상태 로직
- `src/styles/`: 기본 CSS

설계 원칙: 화면 코드는 저장소와 브라우저 기능을 직접 호출하지 않고 `storage/`, `services/`를 거친다. 나중에 서버 API나 앱으로 확장할 때 그 폴더만 교체하기 위해서다. 저장소 함수는 `async`로, `createFolder`·`addSentences`처럼 동작 단위로 만든다.

## 기술 스택

- React + Vite, JavaScript, react-router-dom
- 저장: localStorage. 폴더·문장 전체를 한 키(JSON)에 저장한다. 텍스트 위주라 용량(약 5MB)으로 수천 문장까지 가능하고, 한 번의 쓰기라 삭제 후 position 당기기가 전부 성공/전부 취소된다. v2에서 Firebase(Firestore)로 교체할 예정이라 아래 "v2 Firebase 대비"를 따른다.
- TTS/STT: 브라우저 내장 기능만 사용하고 외부 서비스·유료 API는 쓰지 않는다. Chrome 기준이며 지원 브라우저와 STT의 외부 서버 사용 여부는 구현 때 조사한다.
- 백엔드 없음, 호스팅은 v1 로컬 실행
- 디자인은 기본 CSS로 최소한만
- CSV 파서: 직접 작성(`utils/csv.js`, 따옴표 안 쉼표·줄바꿈, BOM, CRLF 처리). 라이브러리 없음.
- 애니메이션: CSS transition(transform/opacity)만 사용. 라이브러리 없음.
- 필터·현재 폴더는 React Context(`hooks/`)로 공유한다. 메인과 문장 표 화면이 같은 필터 상태를 쓰기 위해서다.

## v2 Firebase 대비 (v1에서 지킬 것)

v1은 localStorage만 쓰고 Firebase는 연동하지 않는다. 다만 v2 교체가 저장소 폴더만 바꾸면 되도록 아래를 지킨다.
- 화면·hooks는 `storage/`의 async 함수만 호출한다. localStorage 키, JSON 구조, 동기 접근이 밖으로 새면 안 된다.
- id는 앱이 만든 문자열(`crypto.randomUUID()`)로 부여한다. Firestore 문서 id로 그대로 쓸 수 있다.
- 저장소 함수는 동작 단위(`createFolder`, `addSentences`, `deleteSentence` 등)로 만든다. 삭제 후 position 당기기는 v2에서 `writeBatch`(배치당 500건 한도)로 옮긴다.
- 함수가 돌려주는 값은 순수 객체(폴더·문장 모델 그대로)만 쓴다.
- v2에서 인증 방식(익명 인증 등)과 보안 규칙은 그때 정한다. v1에서는 다루지 않는다.

## 구현 계획 (순서)

각 단계가 끝날 때마다 `npm run dev`로 직접 확인 가능한 상태여야 한다.

1. **데이터 계층 (화면 없음)**
   - `storage/`: `listFolders`, `createFolder`(trim·빈값·중복 거부), `deleteFolder`(문장 함께 삭제), `listSentences(folderId)`, `addSentences`(맨 뒤 position 부여), `updateSentence`, `deleteSentence`(뒤 position -1), `setProficiency`, `setTranscript`
   - `utils/`: `csv.js`(파싱·검증: 필수 열, 빈 파일, 빈 행 skip), `filter.js`, `navigation.js`(필터 통과하는 가장 가까운 이웃, 순환)
   - 테스트 도구가 없으므로 순수 함수 검증 방법(간단 스크립트 또는 vitest 추가)은 이 단계에서 정한다.
2. **폴더 + 문장 추가**
   - `FolderPanel`: 생성/목록/문장 수/삭제(확인)/선택. 폴더가 없으면 자동으로 열림
   - 현재 폴더 상태, `/` 진입 시 첫 폴더로 이동
   - `AddSentencePanel`: 직접 입력 + CSV 업로드 + 결과 요약, 추가할 폴더 선택
3. **문장 표 화면**
   - 표(헤더 고정, 내부 스크롤), 숙련도 필터, 번호순/숙련도순 정렬
   - 수정(저장/취소, en·ko 둘 다 빔 거부), 삭제(확인, 번호 당김), 행 클릭 시 메인에서 그 문장이 중앙에 오게 이동
   - 필터를 공유 Context로 구현해 4단계에서 재사용
4. **메인 다이얼**
   - 중앙 카드 + 위아래 완전한 행 + 바깥 흐린 행. 위/아래 버튼, 휠, 행 클릭, 순환 이동
   - 영어/한국어 열 숨김 토글(열 자리 유지, 저장 안 함), 필터 체크박스
   - 숙련도 배지 순환 + 즉시 저장. 필터에서 빠져도 이동 전까지 중앙 유지
   - 표 화면에서 돌아올 때 이전 중앙 문장 위치 유지
5. **TTS / STT**
   - `services/tts.js`(speechSynthesis, en-US), `services/stt.js`(webkitSpeechRecognition)
   - [듣기], 마이크 버튼(녹음 중 상태, 실시간 표시 가능하면 표시), 발화 입력창(인식 종료·blur 시 저장)
   - 조사: 지원 브라우저, Chrome STT의 외부 서버 사용 여부(서버 처리로 알려져 있어 확인 필요), 마이크는 localhost/HTTPS에서만 동작
6. **예외 처리 마무리**
   - 폴더 없음/문장 없음/필터 0개 문구, STT·TTS 미지원, 마이크 권한 거부, 인식 실패(기존 발화 유지), en 없는 문장 [듣기] 비활성, "(없음)" 표시
   - PRD.md 8항 체크리스트 전체를 수동 점검하고 `npm run build` 성공 확인. STT/TTS는 Chrome에서 실제 마이크로 확인

## v1 범위에서 제외

계정/로그인/서버/DB, 발음 점수화와 원문 자동 비교 표시, 오디오→텍스트 변환과 문장 분리, 오디오 재생 동기화, 모바일 앱, 폴더 이름 변경, 문장의 폴더 간 이동, 발화 이력과 성장 추이, 데이터 내보내기/백업, 숙련도 기반 자동 출제·랜덤 순서, `.xlsx` 직접 업로드.
