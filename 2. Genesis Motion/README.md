# Genesis 2015—2026 · Data Motion Graphic

[← 모션그래픽 목록](../README.md)

25초, 120 BPM, 1920×1080 · 30fps 데이터 모션그래픽입니다. 모든 수치는 [`dataset/genesis_brand_dataset.md`](dataset/genesis_brand_dataset.md)(기준일 2026-09-29)에서 가져왔고, 기획 과정은 [`prompt/STORYBOARD.md`](prompt/STORYBOARD.md), 생성에 쓴 프롬프트는 [`prompt/Genesis Prompt.txt`](<prompt/Genesis Prompt.txt>)에 있습니다.

렌더된 영상: [`out/genesis-2015-2026.mp4`](out/genesis-2015-2026.mp4)

## 실행

빌드 과정도, 외부 의존성도 없습니다.

- **로컬**: `index.html`을 브라우저로 엽니다(`file://`로도 동작).
- **GitHub Pages**: `…/2.%20Genesis%20Motion/` 경로에서 바로 재생됩니다.

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

`out/genesis-2015-2026.mp4`와 `.wav`가 생성됩니다(WAV와 `out/stills/`는 git에서 제외). 필요한 것: Node 22 이상, Chrome 또는 Edge, PATH에 있는 ffmpeg.

```bash
node tools/render.mjs --from 8 --to 12
node tools/render.mjs --stills 1.2,5.6,23.8
node tools/render.mjs --wav
```

## 구조

```
index.html              무대, 레이어, 스크립트 로드 순서
dataset/                원본 데이터셋 (genesis_brand_dataset.md)
prompt/                 생성 프롬프트 (Genesis Prompt.txt) + 스토리보드 (STORYBOARD.md)
out/                    렌더 결과 (genesis-2015-2026.mp4, poster.jpg)
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
  ui/cars.js            모델별 측면 실루엣 11종 + 세단→SUV 모핑
  fx/textures.js        지나가는 빛 스트릭, 그레인, 도장 잉크 마스크
  hud.js                상시 HUD
  scenes/01…12-*.js     씬별 build() + update(lt)
  transitions.js        스트립 셔터, 링 버스트, 모션블러 슬라이드, 아이리스, 슬라이스 글리치, 클록 와이프
  engine.js             render(t): 씬 활성화, 전환 창, HUD
  audio.js              WebAudio 트랙(10번 씬 엔진 사운드 포함) + OfflineAudioContext WAV
  controls.js           재생, 스크럽, 씬 점프, 그리드, 사운드, WAV
  main.js               부트스트랩, window.seek(t)
tools/render.mjs        무의존 MP4 렌더러 (CDP + ffmpeg)
```

## 차량 실루엣

`js/ui/cars.js`의 실루엣은 실제 차량 디자인을 바탕으로 직접 그린 SVG입니다. 비례, 루프라인, 창문 라인, 포물선 캐릭터 라인, 램프 그래픽으로 모델을 구분하고, 씬이 다루는 시점의 세대를 그립니다. 예를 들어 02의 카드는 두 줄 램프 이전 세대(HI · DH · IK)이고, 03에서 GV80과 함께 두 줄 램프가 처음 켜집니다. 엠블럼, 워드마크, Magma 로고는 그리지 않았고, 외부 사진이나 이미지 파일은 쓰지 않았습니다.

## 표기 원칙

- 글로벌 연간 판매표와 누적 보도는 섞지 않았습니다(연간 합산 1,524,176 ≠ 누적 1,510,368).
- 미국 연간은 데이터셋 지침대로 CarBuzz(B열)를 썼습니다. Infiniti는 데이터가 있는 세 해만 점으로 표시했습니다.
- 2024년 GV80과 GV80 Coupe는 합산 셀 그대로 두었습니다.
- 근사값에는 `~`를 붙였고, 루머·목표치는 쓰지 않았습니다.
