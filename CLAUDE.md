# Motion Graphic — 작업 규칙

HTML 데이터 모션그래픽 모음이다. 새 작품은 `1. SpaceX Motion/`과 같은 파일 배치·코드 뼈대로 만든다.

## 루트 배치

```
Motion Graphic/
├── README.md                            허브: 작품(영상·재생·코드) → 템플릿 프롬프트
├── CLAUDE.md                            이 문서
├── Motion Graphic Template Prompt.txt   모든 작품의 출발점이 되는 템플릿 프롬프트
├── assets/                              저장소 공용 에셋 (특정 작품에 속하지 않는 것)
│   ├── og-image.html                    OG 이미지 원본 (SVG를 JS로 생성)
│   └── og-image.png                     1280×640 소셜 프리뷰
├── .claude/launch.json                  작품별 로컬 미리보기 서버
└── N. <이름> Motion/                    작품 폴더 (번호 순)
```

OG 이미지를 고치면 `og-image.html`을 수정한 뒤 Chrome headless로 다시 렌더한다:
`chrome --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,640 --screenshot=assets/og-image.png assets/og-image.html`

## 작품 폴더 배치 (모든 작품 공통, 바꾸지 않는다)

```
N. <이름> Motion/
├── index.html          진입점 (file:// · GitHub Pages)
├── README.md           첫 줄 아래 [← 모션그래픽 목록](../README.md), 실행·렌더 방법, 표기 원칙
├── .gitignore          out/*.wav, out/stills/
├── dataset/            원본 데이터 (.md)
├── prompt/             <이름> Prompt.txt (템플릿을 채운 것) + STORYBOARD.md
├── css/                tokens · stage · hud · scenes · controls
├── js/
│   ├── core/           util.js · timeline.js
│   ├── data.js         DATA: 화면 수치의 유일한 출처
│   ├── ui/  fx/        공용 컴포넌트 · 텍스처
│   ├── scenes/         NN-<역할>.js (씬당 파일 하나)
│   └── hud.js · transitions.js · engine.js · audio.js · controls.js · main.js
├── tools/render.mjs    무의존 MP4 렌더러 (CDP + ffmpeg)
└── out/                <NAME>.mp4 + poster.jpg
```

## 새 작품 만드는 순서

1. 다음 번호로 `N. <이름> Motion/` 폴더를 만든다.
2. 데이터 파일을 `dataset/`에 넣는다.
3. `Motion Graphic Template Prompt.txt`를 채워 `prompt/<이름> Prompt.txt`로 저장하고, 1단계 스토리보드를 `prompt/STORYBOARD.md`에 남긴다.
4. 코드는 `1. SpaceX Motion/`의 뼈대를 따른다. `js/core/`, `engine.js`, `hud.js`, `controls.js`, `main.js`, `tools/render.mjs`는 복사해 쓴다. `data.js`, `scenes/`, `transitions.js`, `audio.js`, `css/`는 작품에 맞게 새로 쓴다.
5. `tools/render.mjs` 맨 위의 `NAME`만 바꾸고 `node tools/render.mjs`로 `out/<NAME>.mp4`를 만든다.
6. 포스터를 뽑는다: `ffmpeg -ss <대표 장면 초> -i out/<NAME>.mp4 -frames:v 1 -vf scale=1280:-1 -q:v 3 out/poster.jpg`
7. `.claude/launch.json`에 미리보기 항목을 추가한다(`python -m http.server <포트> --directory "<폴더>"`, 기존 포트와 겹치지 않게).
8. 루트 `README.md`를 갱신한다(아래 형식).

## 허브 README 갱신 형식

README에는 실행 규칙을 넣지 않는다. 작품을 바로 확인하는 곳이고, 템플릿 프롬프트로 이어지는 구조만 유지한다.

- `## 작품` 아래에 작품마다 `### N. <제목>` 섹션을 추가한다. 섹션 구성은 SpaceX 항목을 그대로 따른다.
  - 포스터 이미지: 누르면 MP4로 연결
  - 한 줄 설명
  - 사양 (길이 · BPM · 해상도 · fps · 데이터 기준일)
  - 링크 한 줄: 영상 · 재생 페이지 · 코드 · 프롬프트 · 스토리보드 · 데이터셋
- `## 템플릿 프롬프트` 표에 작품 행(채운 프롬프트, 스토리보드)을 추가한다.
- 링크 경로의 공백은 `%20`으로 쓴다.

## 기술 규칙

- 외부 의존성 금지: CDN, 웹폰트 CDN, npm 런타임 패키지를 쓰지 않는다. 폰트는 `local()` + 시스템 폴백.
- 일반 `<script defer>` + 전역 `SX` 네임스페이스로 짠다. ES module은 `file://`에서 막히므로 쓰지 않는다.
- 하나의 거대한 파일로 만들지 않는다. 역할별로 CSS · JS를 나눈다.
- `render(t)`는 순수 함수로 유지한다: 실시간 타이머 금지, 시드 고정 난수, `window.seek(t)` 노출.
- 화면 수치는 `dataset/` 파일에서만 가져와 `js/data.js`에 모은다. 씬은 DATA만 참조한다.
- 오디오는 WebAudio로 만들고, 같은 스케줄을 `OfflineAudioContext`로 렌더해 WAV를 얻는다.
- 렌더에는 Node 22 이상, Chrome 또는 Edge, PATH의 ffmpeg가 필요하다.
- 검증: `node tools/render.mjs --stills <t,...>`로 씬별 정지 화면을 확인하고, MP4의 프레임 수와 길이를 `ffprobe`로 확인한다.
