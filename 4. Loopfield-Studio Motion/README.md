# Loopfield Studio · Motion Graphic

[← 모션그래픽 목록](../README.md)

25초, 120 BPM, 1920×1080 · 30fps 모션그래픽입니다. 모든 수치는 [`dataset/loopfield-studio-dataset.md`](dataset/loopfield-studio-dataset.md)(스냅샷 2026-10-01)에서 가져왔습니다. 기획 과정은 [`prompt/STORYBOARD.md`](prompt/STORYBOARD.md)에, 생성에 쓴 프롬프트는 [`prompt/Loopfield-Studio Prompt.txt`](<prompt/Loopfield-Studio Prompt.txt>)에 있습니다.

렌더된 영상: [`out/loopfield-studio.mp4`](out/loopfield-studio.mp4)

화면 전체를 셰이더 캔버스로 만들었습니다. 씬 배경은 Loopfield Studio의 프리셋 GLSL을 영상 안에서 WebGL 2로 직접 렌더한 패턴입니다. 11개 전환도 라이브러리 패턴의 수학으로 만든 GLSL 패스입니다: 프랙탈 줌, 만화경 접기, 트루셰 타일 회전, 블렌드 스윕, 극좌표 펼치기, 도메인 워프, 로그 나선 소용돌이, 해상도 단계, 보로노이 파쇄, 육각 펄스, 시에르핀스키 분할. 엔드카드에는 도메인 Loopfield.studio가 나옵니다.

## 실행

빌드 과정도, 외부 의존성도 없습니다. WebGL 2가 필요합니다(Chrome / Edge 권장, Loopfield Studio와 같은 조건).

- **로컬**: `index.html`을 브라우저로 엽니다(`file://`로도 동작).
- **GitHub Pages**: `…/4.%20Loopfield-Studio%20Motion/` 경로에서 바로 재생됩니다.

오디오는 브라우저 정책 때문에 처음 클릭한 뒤에 재생됩니다(`PLAY · SPACE`).

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

`out/loopfield-studio.mp4`와 `.wav`가 생성됩니다(WAV와 `out/stills/`는 git에서 제외). Node 22 이상, Chrome 또는 Edge, PATH에 있는 ffmpeg가 필요합니다. 셰이더는 렌더용 Chrome이 잡은 GPU에서 돌아갑니다.

```bash
node tools/render.mjs --from 8 --to 12
node tools/render.mjs --stills 1.4,13.2,24.3
node tools/render.mjs --wav
```

## 구조

```
index.html              무대, 레이어(GL 캔버스 · 씬 DOM · 그레인 · HUD), 스크립트 로드 순서
dataset/                원본 데이터셋 (loopfield-studio-dataset.md)
prompt/                 생성 프롬프트 (Loopfield-Studio Prompt.txt) + 스토리보드 (STORYBOARD.md)
out/                    렌더 결과 (loopfield-studio.mp4, poster.jpg)
css/
  tokens.css            팔레트(데이터셋 기본 배경 · 모노 · 오로라 · 테마색), 폰트 스택
  stage.css             뷰포트 맞춤, 레이어, 캡처 모드, 박 그리드
  hud.css               크롭마크, uLoop 위상, 박 인디케이터, 재생 트랜스포트
  scenes.css            헤드라인 · 캡션 · 카운터 · 칩 · 태그, 몽타주 판, 엔드카드
  controls.css          플레이어 UI
js/
  core/util.js          수학, 이징, 시드 난수, DOM/SVG 빌더
  core/timeline.js      BPM → 박 → 프레임 (정수 박 기준이라 누적 오차 없음)
  data.js               DATA: 화면에 나오는 모든 수치 (씬은 여기만 참조)
  ui/components.js      헤드라인, 타이핑 캡션, 카운터, 칩, 태그
  fx/presets.js         Loopfield 프리셋 32종 GLSL과 팔레트 6종 (저장소 원문)
  fx/gl.js              WebGL 2 렌더러: Loopfield GLSL API 헤더, 프리셋 그리기, 레이어 합성, 오프스크린 타깃
  fx/ink.js             작도선 · 라벨 · 슬라이더 같은 2D 오버레이 (GL 텍스처로 합성)
  fx/textures.js        그레인
  hud.js                상시 HUD
  scenes/01…12-*.js     씬별 build() · update(lt) (DOM) + draw(G, lt) (GL)
  transitions.js        패턴 수학 전환 11개 (GLSL 패스)
  engine.js             render(t): 현재 씬 → 타깃 A, 전환 창에서 다음 씬 → 타깃 B, 합성, HUD
  audio.js              WebAudio 트랙 + OfflineAudioContext WAV
  controls.js           재생, 스크럽, 씬 점프, 그리드, 사운드, WAV
  main.js               부트스트랩(로컬 폰트 선로딩), window.seek(t)
tools/render.mjs        무의존 MP4 렌더러 (CDP + ffmpeg)
```

## 패턴 렌더링

`js/fx/presets.js`는 Loopfield Studio 저장소의 `js/presets.js`, `js/presets-extra.js`에 있는 프리셋 GLSL 32종과 팔레트 6종을 그대로 옮긴 것입니다(MIT, JTech Co.). `js/fx/gl.js`는 데이터셋 6절의 GLSL API v1과 같은 공용 헤더(`uLoop` · `uAngle` · `uCycle` · `palette()` · `fbm()` 등)를 붙여 컴파일합니다. 그래서 화면 속 망델브로, 프리즘 블룸, 줄리아, 32칸 시트는 앱이 그리는 것과 같은 수식으로 그려집니다. 04의 레이어 합성도 앱의 블렌드 공식(normal · screen · add · multiply · difference)을 같은 방식으로 계산합니다.

- 패턴의 위상은 전부 시간 t에서 계산합니다. 07의 PHASE 0 · PHASE 1 · DIFFERENCE 창은 실제로 두 위상을 렌더하고 차이를 구해 검정이 되는 것을 보여 줍니다.
- 06의 장미 곡선은 rose 프리셋과 같은 극방정식을 페이퍼 배경 위 잉크 선으로 다시 그린 것입니다.
- 엔드카드의 궤도 로고는 Loopfield 저장소의 `assets/favicon.svg` 형태를 작도선으로 다시 그렸습니다. 썸네일과 화면 캡처 이미지 파일은 이 저장소에 넣지 않았습니다.

## 표기 원칙

- 엔드카드의 도메인 Loopfield.studio는 요청에 따른 표기입니다. 데이터셋의 실행 주소는 `jtech-co.github.io/Loopfield-Studio/`입니다.
- 루프 경계 검사 32/32는 표본 4장 · 320×180 · 평균절대오차 ≤ 0.5/255 조건을 붙였고, 데이터셋 원문대로 "SAMPLE CHECK, NOT A PROOF"를 함께 적었습니다.
- 네이티브 인코딩 표본(1920×1080 · 24fps · 2초 · 48프레임 · avc1.640028 · 약 5.7MB · 2026-09-26)은 조건을 모두 함께 씁니다. SwiftShader 테스트 환경의 결과는 성능 주장으로 쓰지 않았습니다.
- 01의 반복 횟수 1 → 128 단계는 수식이 패턴으로 자라는 과정을 보여 주는 연출이라 숫자로 쓰지 않고, 기본값 160만 표기했습니다.
- 04의 레이어 1·2는 예제 01 「겹쳐지는 궤도」의 값이고, 레이어 3·4(파동 간섭 ADD, 모아레 DIFFERENCE)는 블렌드를 보여 주기 위한 시연 조합입니다.
- 별·포크 수, 사용자 수, 기본 언어 문서 불일치, 서로 다른 시험의 4K PNG 크기는 쓰지 않았습니다.
- HUD의 uLoop는 t ÷ 25로 계산한 장식값이며, 마지막 프레임은 0.999(749/750)입니다.
- 영상의 120 BPM 트랙은 시리즈 형식의 장식입니다. Loopfield는 무음 MP4를 내보냅니다(데이터셋 F34).
