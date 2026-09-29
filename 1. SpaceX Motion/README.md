# SpaceX 2002—2026 · Data Motion Graphic

[← 모션그래픽 목록](../README.md)

25초, 120 BPM, 1920×1080 · 30fps 데이터 모션그래픽입니다. 모든 수치는 [`dataset/SpaceX_Dataset_2002-2026.md`](dataset/SpaceX_Dataset_2002-2026.md)(스냅샷 2026-09-29)에서 가져왔고, 기획 과정은 [`prompt/STORYBOARD.md`](prompt/STORYBOARD.md), 생성에 쓴 프롬프트는 [`prompt/SpaceX Prompt.txt`](<prompt/SpaceX Prompt.txt>)에 있습니다.

렌더된 영상: [`out/spacex-2002-2026.mp4`](out/spacex-2002-2026.mp4)

## 실행

빌드 과정도, 외부 의존성도 없습니다.

- **로컬**: `index.html`을 브라우저로 엽니다(`file://`로도 동작).
- **GitHub Pages**: 저장소 Settings → Pages에서 브랜치를 지정하면 `…/1.%20SpaceX%20Motion/` 경로에서 바로 재생됩니다.

오디오는 브라우저 정책상 처음 클릭한 뒤에 재생됩니다(`PLAY · SPACE`).

### 컨트롤

| 입력 | 동작 |
|---|---|
| `Space` | 재생 / 정지 |
| `←` `→` | 1프레임 이동 (`Shift`: 1박) |
| `[` `]` | 이전 / 다음 씬 |
| `G` | 박 그리드 오버레이 |
| `M` | 음소거 |
| 하단 바 | 스크럽(씬 구간 + 박 눈금), 씬 점프, WAV 내보내기 |

URL 파라미터: `?t=12.5`(시작 시각), `?grid`(그리드 켜기), `?capture`(1:1 무대, 컨트롤 숨김)

## MP4 렌더

```bash
node tools/render.mjs
```

`out/spacex-2002-2026.mp4`와 `.wav`가 생성됩니다(WAV와 `out/stills/`는 git에서 제외). 필요한 것: Node 22 이상, Chrome 또는 Edge, PATH에 있는 ffmpeg. npm 패키지는 필요 없습니다. Puppeteer 대신 Node 내장 `WebSocket`으로 Chrome DevTools Protocol을 직접 호출해 `seek(i/30)` → 캡처를 반복하고, 페이지 안에서 `OfflineAudioContext`로 렌더한 WAV와 ffmpeg로 합칩니다.

```bash
node tools/render.mjs --from 8 --to 12
node tools/render.mjs --stills 1.2,5.9,23.5
node tools/render.mjs --wav
```

환경 변수 `CHROME_PATH`, `FFMPEG_PATH`로 실행 파일 경로를 지정할 수 있습니다.

## 구조

```
index.html              무대, 레이어, 스크립트 로드 순서
dataset/                원본 데이터셋 (SpaceX_Dataset_2002-2026.md)
prompt/                 생성 프롬프트 (SpaceX Prompt.txt) + 스토리보드 (STORYBOARD.md)
out/                    렌더 결과 (spacex-2002-2026.mp4, poster.jpg)
css/
  tokens.css            팔레트, 폰트 스택(local() 우선, 시스템 폰트 폴백)
  stage.css             뷰포트 맞춤, 레이어, 캡처 모드, 박 그리드
  hud.css               크롭마크, 씬 번호, 박 인디케이터, 연도 눈금자
  scenes.css            공용 컴포넌트와 씬별 스타일
  controls.css          플레이어 UI
js/
  core/util.js          수학, 이징, 시드 난수, DOM/SVG 빌더
  core/timeline.js      BPM → 박 → 프레임 (정수 박 기준이라 누적 오차 없음)
  data.js               DATA: 화면에 나오는 모든 사실 (씬은 여기만 참조)
  ui/components.js      헤드라인, 타이핑 캡션, 카운터, 링, 도장, 칩
  ui/vehicles.js        단순화한 일반 로켓 실루엣
  ui/globe.js           씬 07·08이 함께 쓰는 정사영 지구
  fx/textures.js        별 필드 패럴랙스, 그레인, 도장 잉크 마스크
  hud.js                상시 HUD
  scenes/01…12-*.js     씬별 build() + update(lt)
  transitions.js        스트립 리빌, 스핀, 링 버스트, 슬라이스 글리치, 아이리스
  engine.js             render(t): 씬 활성화, 전환 창, HUD
  audio.js              WebAudio 트랙 + OfflineAudioContext WAV
  controls.js           재생, 스크럽, 씬 점프, 그리드, 사운드, WAV
  main.js               부트스트랩, window.seek(t)
tools/render.mjs        무의존 MP4 렌더러 (CDP + ffmpeg)
```

`render(t)`는 순수 함수입니다. 모든 상태를 `t`에서 계산하고, 실시간 타이머에 기대지 않으며, 난수는 시드를 고정합니다. 그래서 `window.seek(t)` 한 번으로 어떤 프레임이든 똑같이 재현됩니다.

## 폰트

외부 요청을 하지 않도록 웹폰트 CDN을 쓰지 않습니다. 시스템에 설치된 Pretendard Black / JetBrains Mono를 먼저 찾고, 없으면 Noto Sans KR · Apple SD Gothic Neo · Malgun Gothic / Cascadia Mono · Consolas 순서로 대체합니다. 기획 의도대로 보려면 두 폰트를 설치하세요(둘 다 SIL OFL).

## 표기 원칙

- 범위로 적힌 값은 파일 §8 우선순위(회사 공시 > 독립 카탈로그 > 언론)로 대표값 하나를 고르고, 근사값에는 `~`를 붙였습니다.
- 표에 없는 연도(2011)는 빈 행으로 두었습니다.
- 로켓은 단순화한 일반 실루엣입니다. 공식 로고, 워드마크, 미션 패치는 쓰지 않았습니다.
