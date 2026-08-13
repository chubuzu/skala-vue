# Axios 동작 정리

이 프로젝트에서 Axios가 **어디서, 어떻게, 왜 그렇게** 쓰이고 있는지 정리한 문서입니다.
교재 Axios 단계의 개념과 실제 코드를 연결하는 것이 목적입니다.

관련 파일

- `src/api/weatherApi.js` — Axios를 실제로 쓰는 유일한 파일
- `src/api/kboScheduleApi.js` — Axios는 안 쓰지만 **같은 모양의 인터페이스**를 제공
- `src/stores/uiStore.js` — 호출 중임을 전역 진행 바에 알림
- `src/views/*.vue` — 호출하는 쪽

---

## 0. 한눈에 보기

```
View (onMounted / watch)
   │
   │  uiStore.startLoading()      ← 전역 진행 바 켜기
   ▼
api/weatherApi.js
   │  client.get('/weather', { params })
   ▼
Axios 인스턴스 (baseURL, timeout 6초)
   │
   ▼
OpenWeatherMap
   │
   ▼
api/weatherApi.js  ← 응답을 앱 전용 형태로 가공해서 반환
   │
   ▼
View (ref 갱신)
   │
   │  uiStore.stopLoading()       ← finally에서 반드시 실행
   ▼
화면 렌더링
```

핵심 원칙은 하나입니다. **컴포넌트는 Axios를 모릅니다.** 뷰는 `fetchCurrentWeather(lat, lon)`
같은 함수만 부르고, HTTP·인증키·응답 구조는 전부 `api/` 계층 안에 갇혀 있습니다.

---

## 1. Axios 인스턴스

```js
// src/api/weatherApi.js
import axios from 'axios'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const client = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 6000
})
```

`axios.get()`을 직접 쓰지 않고 `axios.create()`로 인스턴스를 만든 이유:

| 설정 | 이유 |
|---|---|
| `baseURL` | 호출부마다 전체 URL을 반복하지 않습니다. `client.get('/weather')`처럼 경로만 씁니다. 나중에 엔드포인트가 바뀌어도 한 줄만 고치면 됩니다 |
| `timeout: 6000` | 응답이 없을 때 무한정 기다리지 않습니다. 홈 화면은 구장 9곳을 동시에 부르므로, 한 곳이 늦으면 화면 전체가 멈춰 보입니다 |

### API 키

키는 `.env`의 `VITE_OPENWEATHER_API_KEY`로 관리하고, 각 요청의 `params.appid`로 넘깁니다.

```js
const { data } = await client.get('/weather', {
  params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'kr' }
})
```

`params` 객체로 넘기면 Axios가 알아서 쿼리스트링으로 직렬화하고 URL 인코딩까지 처리합니다.
문자열을 직접 이어 붙이는 것보다 안전합니다.

`units: 'metric'`으로 섭씨를, `lang: 'kr'`로 한글 날씨 설명을 받습니다.

> **알려진 한계:** `VITE_` 접두사가 붙은 환경변수는 빌드 결과물에 그대로 포함됩니다.
> 즉 배포하면 브라우저 개발자 도구에서 키를 볼 수 있습니다. 프론트엔드만으로는 피할 수 없고,
> 서버(프록시)를 두어야 해결됩니다. 무료 플랜이라 당장의 피해는 제한적이지만 인지하고 있어야 합니다.

### 키가 없을 때

```js
export function hasApiKey() {
  return Boolean(API_KEY)
}
```

각 fetch 함수는 첫 줄에서 이걸 확인하고 없으면 바로 `throw`합니다.
**요청을 보내봐야 401이 돌아올 게 뻔하므로 네트워크를 낭비하지 않습니다.**

`hasApiKey()`는 `ApiKeyNotice.vue`에서도 쓰여, 키가 없으면 전역 배너를 띄웁니다.

---

## 2. 세 개의 조회 함수

`weatherApi.js`는 함수 세 개를 내보냅니다. 셋 다 OpenWeatherMap을 부르지만 용도가 다릅니다.

| 함수 | 엔드포인트 | 반환 | 쓰는 곳 |
|---|---|---|---|
| `fetchCurrentWeather` | `/weather` | 지금 이 순간의 날씨 객체 | 홈, 구장 상세 |
| `fetchForecast` | `/forecast` | 앞으로 24시간(3시간 × 8칸) 배열 | 홈, 구장 상세 |
| `fetchDailySummary` | `/forecast` | **날짜별로 묶은** 요약 객체 | 구장 상세, 경기 일정, 직관 예정 |

`fetchForecast`와 `fetchDailySummary`는 **같은 엔드포인트를 부르지만 가공 방식이 다릅니다.**
전자는 시간축 그대로(시간별 카드용), 후자는 날짜별로 접어서(날짜 칩·직관 지수용) 돌려줍니다.

### 응답을 그대로 넘기지 않습니다

```js
return {
  temp: Math.round(data.main.temp),
  status: data.weather[0].description,
  humidity: data.main.humidity,
  icon: data.weather[0].icon,
  windSpeed: data.wind?.speed ?? null,
  windDeg: data.wind?.deg ?? null,
  sunrise: data.sys?.sunrise ?? null,
  sunset: data.sys?.sunset ?? null
}
```

OpenWeatherMap의 원본 응답은 `data.main.temp`, `data.weather[0].description`처럼 중첩이 깊습니다.
이걸 그대로 컴포넌트에 넘기면 **템플릿이 외부 API의 구조에 종속**됩니다.
API가 바뀌거나 다른 서비스로 갈아탈 때 모든 `.vue` 파일을 뒤져야 하죠.

그래서 API 계층에서 평평한 앱 전용 형태로 바꿔 내보냅니다. 이 과정에서 함께 처리하는 것들:

- **반올림** — `Math.round(data.main.temp)`. 화면에 `28.37℃`를 보여줄 일은 없습니다
- **단위 변환** — `pop`(강수확률)은 0~1 실수라 `Math.round(pop * 100)`으로 %로 바꿉니다
- **없는 값 정규화** — `data.wind?.speed ?? null`. `undefined`가 아니라 항상 `null`로 통일해야
  `comfortScore()`의 `== null` 검사가 일관되게 동작합니다

### 경기 시간대 예보 고르기

이 프로젝트에서 가장 중요한 가공입니다.

```js
export const GAME_HOUR = 18

export function pickGameTimeForecast(forecastList, dateStr) {
  let best = null
  let bestGap = Infinity

  forecastList.forEach((item) => {
    const [date, time] = String(item.time ?? '').split(' ')
    if (date !== dateStr) return

    const gap = Math.abs(Number(time.slice(0, 2)) - GAME_HOUR)
    // 15시·21시가 같은 차이로 비기면 뒤쪽(경기 후반에 가까운 쪽)을 택한다
    if (gap <= bestGap) {
      bestGap = gap
      best = { temp: item.temp, humidity: item.humidity, ... }
    }
  })

  return best
}
```

5일 예보는 3시간 간격이라 18:30 경기에 딱 맞는 값이 없습니다. 그래서 **18시에 가장 가까운 블록**을
고릅니다. 비길 때 뒤쪽을 택하는 건 `<=` 비교 하나로 처리했습니다.

이 함수 덕분에 홈·경기 일정·구장 상세·직관 예정 **네 화면이 같은 숫자**를 보여줍니다.
예전에 홈은 현재 날씨, 일정은 18시 예보를 쓰던 시절 같은 날 같은 구장의 직관 지수가
32점까지 벌어졌던 적이 있습니다.

---

## 3. 호출 패턴 세 가지

호출하는 쪽은 상황에 따라 세 가지 방식을 골라 씁니다. **어느 하나만 실패했을 때
무엇을 살릴 것인가**가 선택 기준입니다.

### (1) `Promise.all` — 전부 있어야 의미가 있을 때

```js
// StadiumDetailView.vue
const [current, forecastList, summary] = await Promise.all([
  fetchCurrentWeather(target.lat, target.lon),
  fetchForecast(target.lat, target.lon),
  fetchDailySummary(target.lat, target.lon)
])
```

구장 상세는 세 데이터를 모두 써서 화면을 구성합니다. 순차 `await` 세 번이면 3배 오래 걸리므로
동시에 보냅니다. 하나라도 실패하면 전체가 `reject`되고 바깥 `catch`에서 목데이터로 폴백합니다.

### (2) `Promise.allSettled` — 일부만 실패해도 살릴 게 있을 때

```js
// HomeView.vue
const [currentResult, forecastResult] = await Promise.allSettled([
  fetchCurrentWeather(stadium.lat, stadium.lon),
  fetchForecast(stadium.lat, stadium.lon)
])

if (currentResult.status !== 'fulfilled') throw currentResult.reason

const forecastList = forecastResult.status === 'fulfilled' ? forecastResult.value : []
```

홈 카드에서 **현재 날씨는 필수, 예보는 부가 정보**(강수확률·직관 지수)입니다.
`Promise.all`을 쓰면 예보가 실패했을 때 멀쩡한 현재 날씨까지 버리게 됩니다.
`allSettled`는 실패해도 `reject`하지 않고 `{ status, value | reason }`을 돌려주므로,
현재 날씨만 확인하고 예보는 빈 배열로 넘어갑니다.

### (3) 구장별 개별 `try-catch` — 한 곳이 전체를 망치지 않도록

```js
// HomeView.vue
const results = await Promise.all(
  stadiums.map(async (stadium) => {
    try {
      /* ... 위 (2)번 코드 ... */
      return { id: stadium.id, ...currentResult.value, precipitationChance, gameTime }
    } catch (error) {
      console.error(`${stadium.name} 날씨 조회 실패:`, error)
      return null // 실패한 구장은 기존 목데이터를 그대로 유지
    }
  })
)
```

바깥은 `Promise.all`이지만 **각 구장의 콜백 안에서 에러를 삼키기 때문에** 절대 `reject`되지 않습니다.
잠실 하나가 실패해도 나머지 8곳은 정상 표시됩니다. `null`을 돌려주고 호출부에서 걸러냅니다.

```js
results.forEach((result) => {
  if (!result) return   // 실패한 구장은 건너뜀 → 초기 목데이터가 남음
  const target = weatherList.value.find((city) => city.id === result.id)
  ...
})
```

`weatherList`를 처음부터 목데이터로 채워두고 성공한 것만 덮어쓰는 구조라,
실패가 곧 빈 화면이 되지 않습니다.

### 호출 횟수 주의

홈 화면은 **구장 9곳 × 2회(현재 + 예보) = 18회**를 거의 동시에 보냅니다.
무료 플랜은 분당 60회 제한이라 새로고침을 연달아 하면 429가 날 수 있습니다.
`weatherStore`로 응답을 캐싱하는 것이 남은 개선 과제입니다.

---

## 4. 로딩 상태는 두 겹입니다

호출 하나가 **두 종류의 로딩 표시**를 건드립니다.

```js
async function loadGames(dateStr) {
  isLoading.value = true      // ① 지역: 이 영역이 준비 중
  uiStore.startLoading()      // ② 전역: 상단 진행 바
  try {
    const result = await fetchGamesByDate(dateStr)
    games.value = result.games
    await loadGameDayWeather(dateStr, result.games)
  } finally {
    isLoading.value = false   // ①
    uiStore.stopLoading()     // ②
  }
}
```

| 구분 | 대상 | 역할 |
|---|---|---|
| ① `isLoading` (지역 `ref`) | `el-skeleton` | **"어디가"** 준비 중인지 — 내용이 들어올 자리를 잡아줌 |
| ② `uiStore` (전역) | `GlobalProgressBar` | **"아직 진행 중"**임을 알림 — 화면 어디에 있든 보임 |

### `finally`가 핵심입니다

`try`가 성공하든 실패하든 **끄는 코드는 반드시 실행**됩니다.
`catch` 안에만 두면 예상 못 한 예외에서 진행 바가 영원히 남습니다.

`uiStore` 쪽은 API 호출을 **카운터**로 셉니다. 홈에서 9개 요청이 동시에 진행돼도
`startLoading()` 9번, `stopLoading()` 9번이 정확히 짝지어지기 때문입니다.
(반면 라우터 이동은 불리언으로 다룹니다 — `beforeEach`/`afterEach`가 1:1로 짝지어지지 않아서인데,
자세한 이유는 `uiStore.js` 주석에 있습니다.)

---

## 5. 에러 처리 전략

계층마다 책임이 다릅니다.

| 계층 | 하는 일 |
|---|---|
| `weatherApi.js` | 키가 없으면 `throw`. HTTP 에러는 Axios가 알아서 `reject` |
| 뷰의 개별 `try-catch` | `console.error`로 남기고 그 항목만 포기 |
| 뷰의 바깥 `catch` | 목데이터로 폴백 |
| `ApiKeyNotice.vue` | 키가 없다는 사실을 전역 배너로 안내 |
| `uiStore` 안전장치 | 15초가 지나면 진행 바를 강제로 해제 |

```js
// StadiumDetailView.vue
} catch {
  // API 키가 없거나 통신에 실패하면 목데이터로 자연스럽게 대체
  weather.value = {
    temp: target.mockTemp,
    status: target.mockStatus,
    humidity: null,
    windSpeed: null,
    ...
  }
}
```

폴백할 때 `humidity`, `windSpeed`를 `null`로 두는 게 중요합니다.
**있지도 않은 습도·풍속을 지어내지 않기 위해서**입니다. `comfortScore()`는 `null`을 받으면
그 항목을 감점 계산에서 빼고, `temp`조차 없으면 아예 점수를 만들지 않고 `null`을 돌려줍니다.

이 프로젝트의 원칙 — **데이터가 없으면 "정보 없음"으로 표시한다** — 이 에러 처리에도 그대로 적용됩니다.

---

## 6. Axios를 안 쓰지만 똑같이 생긴 것

`kboScheduleApi.js`는 로컬 파일을 읽을 뿐 네트워크를 타지 않습니다.
그런데도 **Promise를 반환하고 약간의 지연까지 넣습니다.**

```js
export function fetchGamesByDate(dateStr) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!isWithinScheduleRange(dateStr)) {
        resolve({ outOfRange: true, games: [] })
        return
      }
      const games = (SCHEDULE?.[dateStr] ?? []).map((game) => ({ ... }))
      resolve({ outOfRange: false, games })
    }, 150)
  })
}
```

이유는 **호출부를 바꾸지 않고 나중에 진짜 API로 교체하기 위해서**입니다.
KBO는 공식 API가 없고 CORS로 막혀 있어 지금은 수기 데이터를 쓰지만,
언젠가 API가 생기면 이 함수 내부만 `client.get(...)`으로 바꾸면 됩니다.
`ScheduleView`의 `await fetchGamesByDate(date)`는 그대로입니다.

`setTimeout` 150ms는 스켈레톤이 자연스럽게 보이도록 넣은 값이기도 합니다.

---

## 7. 지금 없는 것 (개선 여지)

교재 범위를 넘어서는 부분이라 아직 적용하지 않았지만, 다음에 손댈 만한 것들입니다.

| 항목 | 현재 | 개선 방향 |
|---|---|---|
| **인터셉터** | 없음 | `client.interceptors.response`로 에러 로깅과 `uiStore` 연동을 한곳에 모을 수 있습니다. 지금은 각 뷰가 `startLoading`/`stopLoading`을 직접 부릅니다 |
| **캐싱** | 없음 | 화면을 오갈 때마다 같은 구장을 다시 부릅니다. `weatherStore`에 5~10분 TTL로 담으면 호출량이 크게 줄어듭니다 |
| **중복 호출** | 있음 | `ScheduleView`는 경기마다 `fetchDailySummary`를 부릅니다. 같은 구장이 두 번 나오면 두 번 부릅니다 (`PlanView`는 `new Set`으로 이미 해결) |
| **요청 취소** | 없음 | 날짜를 빠르게 바꾸면 이전 요청 응답이 나중에 도착해 화면을 덮어쓸 수 있습니다. `AbortController`로 막을 수 있습니다 |
| **재시도** | 없음 | 429(호출 제한)일 때 잠시 뒤 다시 시도하면 사용자 경험이 나아집니다 |
| **키 노출** | 있음 | 프록시 서버를 두면 키를 서버에 숨길 수 있습니다 |

---

## 요약

1. `axios.create()`로 인스턴스를 만들어 `baseURL`과 `timeout`을 한곳에서 관리합니다
2. 응답은 **API 계층에서 앱 전용 형태로 가공**해 내보냅니다. 컴포넌트는 외부 API 구조를 모릅니다
3. **"실패했을 때 무엇을 살릴 것인가"**에 따라 `Promise.all` / `allSettled` / 개별 `try-catch`를 골라 씁니다
4. 로딩은 지역(스켈레톤) + 전역(진행 바) 두 겹이고, 해제는 **반드시 `finally`**에서 합니다
5. 폴백할 때 없는 값은 `null`로 둡니다. **지어내지 않습니다**
6. 네트워크를 타지 않는 `kboScheduleApi`도 같은 Promise 인터페이스를 유지해 교체 가능성을 열어둡니다
