# 🎖️ 파주시 군 장병 할인업소 지도

파주시 군 장병·사회복무요원 할인업소 **189개소**를 브이월드(V-World) 지도에서
권역·업종별로 찾아보는 모바일 우선 반응형 웹앱입니다.

- **권역 선택** (금촌·운정·문산·법원·탄현·적성 등 12개) → **업종 선택** (음식점·카페·미용·목욕·숙박) 2단계 필터
- 업소 상세에서 할인 내역 확인, 📞 전화 걸기, 🧭 카카오맵 길찾기
- 🪖 사회복무요원 적용 업소(74개) 필터
- 업소명 검색, 현재 위치 이동, 필터 상태 URL 공유(`#r=문산&c=food`)
- 스마트폰: 지도 전체화면 + 바텀시트 목록 / PC(768px↑): 사이드바 + 지도

서버 없이 정적 파일만으로 동작합니다 (GitHub Pages 배포용).

## 배포 방법

1. 저장소 **Settings → Pages** 에서 Source를 배포 브랜치(`main`) / root 로 설정
2. [vworld.kr](https://www.vworld.kr) 인증키 관리에서 배포 주소
   (`https://<계정>.github.io`)와 개발용 `localhost`를 서비스 URL로 등록
3. 접속: `https://<계정>.github.io/paju-military-discount-map/`

## 좌표(지오코딩) 준비 — 최초 1회 권장

브이월드 지오코더는 해외 IP를 차단하므로 좌표 변환은 **브라우저에서** 실행합니다.

- 앱은 좌표 없는 업소를 첫 접속 시 자동으로 지오코딩하고 localStorage에 캐시합니다.
  (방문자마다 첫 로딩 시 수십 초 소요될 수 있음)
- **권장:** 배포 후 `tools/geocode.html` 페이지를 한 번 열어 「지오코딩 시작」→
  「stores.json 다운로드」 실행 후, 받은 파일을 GitHub 웹(Upload files)으로
  `data/stores.json`에 덮어쓰세요. 이후 모든 방문자가 즉시 지도를 볼 수 있습니다.
  변환 실패 목록은 페이지에 표시되며, 해당 업소는 목록에 "위치 미확인"으로 남습니다.

## 데이터 갱신 (엑셀 교체 시)

```bash
# 새 엑셀 파일을 저장소 루트에 넣고 실행 (기존 좌표는 연번 기준으로 보존됨)
python3 scripts/convert.py
```

변환 후 신규 업소 좌표는 `tools/geocode.html`로 다시 채우면 됩니다.

## 구조

```
index.html            앱 진입점
css/style.css         반응형 스타일 (모바일 바텀시트 / PC 사이드바, 다크모드)
js/config.js          브이월드 API 키·카테고리·권역 정의
js/data.js            데이터 로딩 + 브이월드 지오코딩(JSONP) + 캐시
js/map.js             Leaflet 지도, 브이월드 WMTS 타일(장애 시 OSM 폴백), 마커 클러스터
js/ui.js              필터 칩·목록·상세 카드 렌더링
js/app.js             상태 관리, URL 해시 동기화, 초기화
data/stores.json      업소 데이터 (scripts/convert.py 산출물)
scripts/convert.py    엑셀 → JSON 변환 스크립트
tools/geocode.html    일괄 지오코딩 관리 도구
vendor/               Leaflet 1.9.4 + markercluster 1.5.3 (self-host)
```

데이터 출처: 파주시 「2026년도 군 장병 할인업소 현황」 (2026.3.1. 기준)
