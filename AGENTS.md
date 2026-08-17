# 펭귄의 북극 모험 (Penguin's Arctic Adventure)

순수 클라이언트 사이드 HTML5 canvas 게임입니다. 빌드 단계, 번들러, 패키지 매니저, 자동화 테스트, 린트 설정이 없습니다.

- `index.html` — 페이지 구조와 HUD
- `style.css` — 스타일
- `game.js` — 게임 로직 전체 (vanilla JS, canvas 렌더링)
- `assets/` — 캐릭터/장애물 PNG 스프라이트 (penguin, bear, wolf, hunter)

## Cursor Cloud specific instructions

- 이 저장소는 정적 파일만으로 이루어져 있어 설치할 의존성이 없습니다. `python3`(베이스 이미지에 이미 설치됨)만 있으면 됩니다.
- 게임은 반드시 로컬 HTTP 서버로 열어야 합니다. `file://`로 열면 canvas가 `assets/*.png` 스프라이트를 로드하지 못해 캐릭터가 그려지지 않습니다. 서버 실행: `python3 -m http.server 8765` (저장소 루트에서). 이후 `http://127.0.0.1:8765/index.html` 접속.
- 진행 상태(닉네임, 최고 점수, 코인, 낮/밤 테마, 상점 구매)는 브라우저 `localStorage`에 저장됩니다. 서버 쪽 상태나 DB는 없습니다. 깨끗한 상태로 테스트하려면 브라우저 저장소를 비우세요.
- 첫 플레이 시 닉네임 입력 오버레이가 먼저 뜨고, 저장한 뒤에야 "시작하기" 버튼으로 게임을 시작할 수 있습니다.
- 조작: 스페이스바 / ↑ / 마우스 클릭 / 터치로 점프. 게임은 자동으로 우측으로 달립니다.
