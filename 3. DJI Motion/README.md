# DJI 2006—2026 · Data Motion Graphic

[← 모션그래픽 목록](../README.md)

25초, 120 BPM, 1920×1080 · 30fps 데이터 모션그래픽입니다. 모든 수치는 [`dataset/DJI_dataset_2006-2026.md`](dataset/DJI_dataset_2006-2026.md)(기준일 2026-09-29)에서 가져왔습니다. 기획 과정은 [`prompt/STORYBOARD.md`](prompt/STORYBOARD.md)에, 생성에 쓴 프롬프트는 [`prompt/DJI Prompt.txt`](<prompt/DJI Prompt.txt>)에 있습니다.

렌더된 영상: [`out/dji-2006-2026.mp4`](out/dji-2006-2026.mp4)

카메라가 풍경 위를 날며 데이터를 찍는 한 번의 비행으로 구성했습니다. 씬마다 시간대가 바뀌고(밤 → 새벽 → 낮 → 안개 → 황혼), 11개 전환은 모두 카메라 워크입니다: 크레인 업, 틸트 업, 피치 다운, FPV 다이브, 랙 포커스, 셔터 캡처, 하이퍼랩스, 오빗, 구름 통과, 줌 스텝, 짐벌 수평 와이프.

## 실행

빌드 과정도, 외부 의존성도 없습니다.

- **로컬**: `index.html`을 브라우저로 엽니다(`file://`로도 동작).
- **GitHub Pages**: `…/3.%20DJI%20Motion/` 경로에서 바로 재생됩니다.

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

`out/dji-2006-2026.mp4`와 `.wav`가 생성됩니다(WAV와 `out/stills/`는 git에서 제외). Node 22 이상, Chrome 또는 Edge, PATH에 있는 ffmpeg가 필요합니다.

```bash
node tools/render.mjs --from 8 --to 12
node tools/render.mjs --stills 1.2,9.2,24.9
node tools/render.mjs --wav
```

## 구조

```
index.html              무대, 레이어, 스크립트 로드 순서
dataset/                원본 데이터셋 (DJI_dataset_2006-2026.md)
prompt/                 생성 프롬프트 (DJI Prompt.txt) + 스토리보드 (STORYBOARD.md)
out/                    렌더 결과 (dji-2006-2026.mp4, poster.jpg)
css/
  tokens.css            팔레트, 폰트 스택(local() 우선, 시스템 폰트 폴백)
  stage.css             뷰포트 맞춤, 레이어, 레터박스, 캡처 모드, 박 그리드
  hud.css               뷰파인더 브래킷, REC 타임코드, 박 인디케이터, 비행 경로
  scenes.css            공용 컴포넌트와 씬별 스타일
  controls.css          플레이어 UI
js/
  core/util.js          수학, 이징, 시드 난수, DOM/SVG 빌더
  core/timeline.js      BPM → 박 → 프레임 (정수 박 기준이라 누적 오차 없음)
  data.js               DATA: 화면에 나오는 모든 사실 (씬은 여기만 참조)
  ui/components.js      헤드라인, 타이핑 캡션, 카운터, 칩, 태그, 초점 브래킷, 3분할, 레터박스
  ui/products.js        제품 7종의 부품 리그(mm) → 평면 음영 폴리곤, 모핑
  fx/landscape.js       능선 패럴랙스, 등고선, 구름, 해
  fx/textures.js        스피드 스트릭(08), 그레인
  hud.js                상시 HUD (2006–2026 비행 경로 위를 드론 마커가 활공)
  scenes/01…12-*.js     씬별 build() + update(lt)
  transitions.js        카메라 워크 전환 11개
  engine.js             render(t): 씬 활성화, 카메라 롤·호흡, 전환 창, HUD
  audio.js              WebAudio 트랙(로터, 레이더 핑, 무게 틱, 셔터, 임팩트) + OfflineAudioContext WAV
  controls.js           재생, 스크럽, 씬 점프, 그리드, 사운드, WAV
  main.js               부트스트랩, window.seek(t)
tools/render.mjs        무의존 MP4 렌더러 (CDP + ffmpeg)
```

## 제품 모델링

`js/ui/products.js`의 제품은 공식 스펙 페이지의 치수(mm)로 부품을 조립한 작은 3D 리그입니다. 박스, 원통, 원판, 둥근 셸 같은 부품을 요·피치 카메라로 투영하고, 면마다 조명 방향에 따라 같은 색의 명도만 바꿔 평면 폴리곤으로 칠합니다. 같은 모델을 3/4 정면, 정면, 아래에서 올려다본 각도로 그릴 수 있고, 부품 치수를 보간해 모핑합니다(Phantom 1 → Mavic 4 Pro, Mavic Mini → Mini 5 Pro, Osmo Pocket → Pocket 3).

- Phantom 1: 흰 셸 바디, 앞 암의 빨간 띠, 곧은 랜딩기어 두 개, 바디 아래 외장 카메라
- Mavic 4 Pro: 다크 그레이 바디, 앞뒤 높이가 다른 X자 암, 렌즈 3개가 든 둥근 카메라 헤드
- Mavic Mini / Mini 5 Pro: 작은 둥근 바디와 가는 암, Mini 5 Pro는 큰 1" 짐벌 카메라
- Osmo Pocket / Pocket 3: 막대 그립과 짐벌 헤드, Pocket 3는 가로로 돌아가는 화면과 빨간 링 녹화 버튼
- Osmo Action 5 Pro: 가로로 긴 바디, 왼쪽 화면, 오른쪽의 큰 렌즈와 빨간 링

로고와 제품명 각인은 그리지 않았습니다. 경쟁사(GoPro, Insta360)는 제품을 그리지 않고 이름 라벨만 썼습니다. 참고 사진은 저장소에 넣지 않았습니다.

## 표기 원칙

- DJI는 비상장사라 매출과 판매 대수는 보도·위키·애널리스트 추정입니다. 추정치에는 `EST.`와 `~`를, 헤드라인에는 "약"을 붙였습니다.
- 04의 도트 1,000개는 83.48 : 9.82 : 1.40 : 5.30을 최대 잉여 방식으로 835 : 98 : 14 : 53개로 나눴고, 라벨은 원문 값을 씁니다.
- 07의 내부 가이던스(30만–40만 대)는 보도된 범위를 밴드로만 그렸고, 여기서 배수를 계산하지 않았습니다.
- 08의 액션캠 매출 점유(Chanson)와 IDC 핸드헬드 스마트캠 출하 점유 73%는 정의가 달라 같은 차트에 올리지 않고 별도 칩으로 뒀습니다. 2022–23의 >75%, <25%는 범위값이라 빈 원으로 표시했습니다.
- 09는 로그 눈금(10배마다 같은 높이)이고, 출처가 분명한 네 점(2011 · 2013 · 2015 · 2025)만 씁니다.
- 10의 FCC Covered List는 신규 모델 인증만 막았으므로 기존 모델 판매(EXISTING MODELS STILL SOLD)를 함께 표기했습니다.
- 줌 라벨은 파일(T11)에 있는 28mm와 168mm만 씁니다. 11 몽타주의 249 g 컷에는 그 무게의 기체인 Mavic Mini를 그렸습니다.
- REC 타임코드는 타임라인에서 계산한 장식값이며, 데이터가 아닙니다.
