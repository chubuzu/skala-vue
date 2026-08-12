# ⚾ 야구장 날씨 (skala-wthrprjct)

KBO 리그 10개 구단의 홈구장(잠실은 두산 베어스·LG 트윈스 공동 사용이라 구장 기준 9개) 날씨와
오늘의 경기 일정 · 홈팀 라인업을 확인할 수 있는 Vue 3 학습용 프로젝트입니다.

## 진행 단계별 커스터마이징 내역

1. **Mockup** — v-for/v-if/v-model/이벤트 수식어로 도시 날씨 카드 목업 제작
2. **Component** — SearchBox / WeatherList / WeatherCard / StatusBar / Pagination / TempBadge로 컴포넌트 분리
   - 온도 배지를 2색 고정 대신 온도에 따라 파랑→빨강으로 이어지는 그라데이션 색상으로 변경
   - 화면 레이아웃 폭 확대, 국내 광역시 데이터 추가, 5개씩 페이지네이션
3. **Composition** — computed(filteredWeatherList), watch(selectedCityInfo), watchEffect(searchQuery) 적용, 검색 결과 없음 안내
   - 데이터를 KBO 10개 구단 홈구장 테마로 전면 교체 (검색은 구단명/구장명/지역명 모두 지원)
4. **Router** — Vue Router 4단계(HomeView, StadiumDetailView, TeamsView, AboutView) + Catch-all(NotFoundView), 모든 라우트 Lazy Loading
   - 상세보기 클릭 시 `window.alert()` 대신 `router.push('/stadium/:id')`로 실제 페이지 이동
   - 상단 Navigation Bar(RouterLink) 추가
5. **Store (Pinia)** — `configStore`(단위 celsius/fahrenheit 토글) + `favoriteStore`(구장 즐겨찾기, 본인 추가 Store)
6. **Axios** — OpenWeatherMap Current Weather / 5-day Forecast API 연동, API 키 미설정 시 목데이터로 자동 폴백
7. **KBO 경기 일정** — KBO는 공식 무료 API가 없고 홈페이지는 CORS로 직접 호출이 불가해,
   공식 캘린더의 2026년 8~9월 일정을 옮겨 적어 로컬 데이터로 사용 (`src/data/kboSchedule2026.local.js`, git 미포함).
   `src/api/kboScheduleApi.js`가 실제 API와 동일한 Promise 인터페이스를 제공하므로 추후 내부 구현만 교체 가능.
   라인업/선발투수는 신뢰할 수 있는 출처가 없어 제공하지 않음
8. **UI Library (Element Plus)** — el-input, el-pagination, el-table, el-tag, el-skeleton, el-empty, el-alert, el-button 적용
9. **Refinement** — README 정리, 불필요한 목업(스캐폴드 기본 웰컴 컴포넌트) 정리

## 프로젝트 구조

```
src/
├── api/                # 외부 API 통신 모듈 (axios)
│   ├── weatherApi.js    # OpenWeatherMap
│   └── kboScheduleApi.js # KBO 경기 일정/라인업 (현재 목데이터)
├── data/
│   └── stadiums.js      # 9개 구장 기준 데이터 (좌표 포함)
├── stores/               # Pinia
│   ├── configStore.js    # 단위(섭씨/화씨) 설정
│   └── favoriteStore.js  # 즐겨찾기 구장
├── components/           # 재사용 컴포넌트
├── views/                # 라우트별 페이지
├── router/index.js
└── utils/temperature.js
```

## 환경 변수 설정 (필수)

실시간 날씨를 받아오려면 [OpenWeatherMap](https://openweathermap.org/)에 가입 후 API 키를 발급받아야 합니다.

```sh
cp .env.example .env
# .env 파일을 열어 VITE_OPENWEATHER_API_KEY=발급받은키 입력
```

키가 없어도 앱은 정상 동작하며, 이 경우 각 구장의 목데이터(임의 기온/날씨)로 표시됩니다.
(홈 화면 상단에 안내 배너가 표시됩니다.)

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
