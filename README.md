# ⚾ 야구장 날씨 (skala-wthrprjct)

> SK AX 풀스택 교육과정 — Frontend Framework (Vue.js) 실습 과제
> 교재 커리큘럼을 모두 이행한 뒤, 각 단계에서 배운 개념을 확장해 자체 기능을 구현했습니다.

KBO 10개 구단의 홈구장(잠실은 두산·LG 공동 사용이라 구장 기준 9곳)에 대해 **경기 시간대 날씨**를 보여주고,
직관 갈 경기를 담아 서로 비교하는 Vue 3 SPA입니다.

교재 예제는 도시 목록의 현재 기온을 보여주는 것이 목표였으나, 저는 **"오늘 이 구장에 야구를 보러 가도 될까"**라는
질문에 답하는 서비스로 주제를 바꿔 진행했습니다. 이 질문에 답하려면 하루 최고기온이 아니라 경기가 열리는
저녁 시간대 예보가 필요하고, 기온만이 아니라 강수·바람·습도를 함께 봐야 했기에 교재 범위를 넘어서는
개념들을 추가로 학습해 적용했습니다.

---

## 목차

- [1. 실행 방법](#1-실행-방법)
- [2. 교재 실습 대비 확장 내역 — 요약](#2-교재-실습-대비-확장-내역--요약)
- [3. 단계별 상세](#3-단계별-상세)
  - [3-1. Mockup · Composition API](#3-1-mockup--composition-api)
  - [3-2. Component — props / emits / slot](#3-2-component--props--emits--slot)
  - [3-3. Router](#3-3-router)
  - [3-4. Pinia Store](#3-4-pinia-store)
  - [3-5. Axios · 비동기 처리](#3-5-axios--비동기-처리)
  - [3-6. UI Library — Element Plus](#3-6-ui-library--element-plus)
- [4. 자체 구현 기능](#4-자체-구현-기능)
- [5. 프로젝트 구조](#5-프로젝트-구조)
- [6. 데이터 출처와 제약](#6-데이터-출처와-제약)
- [7. 개발 환경](#7-개발-환경)
- [8. 알고 있는 한계와 남은 과제](#8-알고-있는-한계와-남은-과제)

---

## 1. 실행 방법

```sh
npm install
cp .env.example .env    # VITE_OPENWEATHER_API_KEY 입력
npm run dev
```

| 스크립트 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (`--host` 포함) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | oxlint + ESLint |
| `npm run format` | Prettier |

**API 키가 없어도 앱은 정상 동작합니다.** `stadiums.js`의 목데이터로 폴백하고 안내 배너가 표시되도록
처리했습니다. 다만 이 경우 직관 지수·바람·그늘은 실제 데이터가 없으므로 "정보 없음"으로 표시됩니다.

---

## 2. 교재 실습 대비 확장 내역 — 요약

전체를 한눈에 보실 수 있도록 표로 먼저 정리했습니다. 각 항목의 상세 설명과 코드 위치는 3장에 있습니다.

| 단계 | 교재 실습 범위 | 본 프로젝트에서 추가로 적용한 것 |
|---|---|---|
| **Mockup** | `v-for`·`v-if`·`v-model`·이벤트 수식어로 도시 카드 목록 | 온도에 따라 색이 연속적으로 변하는 그라데이션 배지, KBO 구단 테마로 데이터 전면 교체 |
| **Composition** | `computed`·`watch`·`watchEffect` 각 1회 | `computed`가 **두 개의 반응형 소스**(검색어 + 즐겨찾기 스토어)에 동시에 의존하도록 설계해, 별표를 누르면 목록이 즉시 재정렬되게 구현 |
| **Component** | props·emit·slot 기본 사용 | **3단 emit 중계** 구조, **네임드 슬롯 4종 + fallback**을 갖춘 공용 레이아웃 컴포넌트, `computed` getter/setter로 **`v-model` 직접 구현** |
| **Router** | 라우트 등록, Lazy Loading, Catch-all | **쿼리스트링 양방향 동기화**(교재는 읽기만), **Navigation Guard를 접근 차단이 아닌 로딩 UX에 활용**, 동적 세그먼트 변경 시 `watch` 재조회 |
| **Pinia** | 스토어 1개 | 스토어 **4개**, 인자를 받는 **함수형 getter**, 라우터·컴포넌트가 서로 모른 채 스토어로만 연결되는 구조 |
| **Axios** | `get` 1회 호출 | `axios.create()` 인스턴스, **비동기 3패턴 구분 적용**(`Promise.all` / `allSettled` / 개별 `try-catch`), `finally` 기반 로딩 해제 |
| **UI Library** | Element Plus 컴포넌트 사용 | 라이브러리 기본 렌더링 대신 **scoped slot으로 커스터마이징**, 직접 만든 컴포넌트로 일부 대체 |
| **자체 기능** | — | 직관 지수, 바람×구장 방위 해석, 그늘 예측, 직관 플래너, 전역 로딩바 |

---

## 3. 단계별 상세

### 3-1. Mockup · Composition API

교재의 도시 날씨 목록을 KBO 구장 데이터로 교체하면서, 검색 대상을 **구장명·구단명·지역명 세 필드**로
확장했습니다. 사용자가 "잠실", "두산", "서울" 중 무엇을 입력해도 같은 카드를 찾을 수 있도록 하기 위함입니다.

```js
// HomeView.vue:165
const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()

  const matched = keyword
    ? weatherList.value.filter(
        (city) =>
          city.name.includes(keyword) ||     // 구장명
          city.teams.includes(keyword) ||    // 구단명
          city.region.includes(keyword)      // 지역명
      )
    : weatherList.value

  return [...matched].sort((a, b) => sortRank(a) - sortRank(b))
})
```

**교재와 다르게 적용한 부분**은 이 `computed`가 **두 개의 반응형 소스에 동시에 의존**하도록 설계한 점입니다.
정렬 함수 `sortRank`(153행) 안에서 `favoriteStore`를 읽고 있기 때문에, 사용자가 카드의 별표를 누르면
검색어를 전혀 건드리지 않았는데도 **목록 순서가 즉시 재정렬**됩니다.

```js
// HomeView.vue:153 — 정렬 우선순위
function sortRank(city) {
  const hasGame = todayStadiumIds.includes(city.id)
  const isFavorite = favoriteStore.isFavorite(city.id)

  if (hasGame && isFavorite) return 0   // 오늘 경기 + 즐겨찾기
  if (hasGame) return 1                 // 오늘 경기
  if (isFavorite) return 2              // 즐겨찾기
  return 3
}
```

"오늘 경기가 있는 구장을 먼저 보고 싶다"는 실제 사용 맥락을 반영한 정렬 기준입니다.
재정렬을 위한 별도 명령 코드는 한 줄도 없으며, 반응성만으로 동작합니다.

`watch`와 `watchEffect`는 교재 요구사항대로 구현하되 한 파일 안에 나란히 두어 두 API의 차이
(대상 명시 + 이전/이후 값 접근 vs 자동 추적 + 즉시 1회 실행)를 비교할 수 있게 했습니다.

---

### 3-2. Component — props / emits / slot

#### 왜 공용 컴포넌트로 분리했는가

컴포넌트를 나눌 때 **"둘 이상의 화면이 같은 것을 필요로 하는가"**를 기준으로 삼았습니다.
그 결과 16개 컴포넌트 중 5개를 공용으로 등록했고, 나머지 11개는 단일 사용(관심사 분리 목적)으로 두었습니다.

| 공용 컴포넌트 | 사용처 | 분리한 이유 |
|---|---|---|
| `BaseDashboardCard` | 5곳 | 카드 디자인(배경·라운드·그림자·여백)이 여러 화면에서 반복되었습니다. 복사하면 디자인 수정 시 5곳을 고쳐야 하므로 껍데기만 분리하고 내용은 슬롯으로 받았습니다 |
| `ComfortBadge` | 4곳 | **점수 계산 기준을 강제로 통일하기 위해서**입니다. 아래에 상세히 적었습니다 |
| `AddToPlanButton` | 3곳 | 세 화면에서 동일한 담기/빼기 동작이 필요했고, 버튼이 스토어를 직접 다루므로 로직까지 함께 묶었습니다 |
| `DateSelector` | 2곳 | 날짜 선택 UI와 `v-model` 규약을 공유하기 위함입니다 |
| `StadiumImage` | 2곳 | 사진 파일 유무에 따른 폴백 로직(`import.meta.glob`)이 동일했습니다 |

`ComfortBadge`를 공용으로 만든 이유는 단순한 재사용이 아니라 **버그 재발 방지**였습니다.
초기에는 각 화면이 직접 점수를 계산했는데, 홈 화면은 현재 날씨를, 경기 일정 화면은 18시 예보를 입력으로
쓰는 바람에 **같은 날 같은 구장의 직관 지수가 32점까지 벌어지는 문제**가 있었습니다.
계산 로직을 `utils/comfortScore.js`로 빼고 호출부를 `ComfortBadge` 한 곳으로 모아,
어느 화면에서든 같은 함수를 거치도록 강제했습니다. 여기에 더해 배지에 **"경기 시간 기준" / "지금 기준"
라벨을 함께 표시**해 사용자도 기준을 알 수 있게 했습니다.

#### 슬롯 — 네임드 슬롯 4종과 fallback

`BaseDashboardCard`는 슬롯 관련 개념을 한 컴포넌트에 모아 구현했습니다.

```html
<!-- BaseDashboardCard.vue -->
<section class="dashboard-card" :class="{ flush }">
  <header v-if="title || $slots.header || $slots.actions" class="card-head">
    <slot name="header">
      <h2 class="card-title">{{ title }}</h2>   <!-- ① fallback: 안 넘기면 title prop 사용 -->
    </slot>

    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" />                    <!-- ② 넘어온 게 있을 때만 렌더 -->
    </div>
  </header>

  <div class="card-body">
    <slot>
      <p class="placeholder">표시할 내용이 없습니다.</p>   <!-- ③ default + fallback -->
    </slot>
  </div>

  <footer v-if="$slots.footer" class="card-foot">
    <slot name="footer" />                       <!-- ④ -->
  </footer>
</section>
```

`v-if="$slots.actions"`로 **부모가 실제로 내용을 넘겼을 때만** 감싸는 요소를 그리도록 했습니다.
이 처리가 없으면 슬롯을 쓰지 않는 화면에 빈 여백이 남습니다.

부모마다 사용하는 슬롯 조합이 다릅니다.

| 사용처 | default | `#actions` | `#footer` |
|---|---|---|---|
| `SearchBox` | 검색 입력창 | — | — |
| `WeatherList` | 카드 그리드 | 결과 개수 | 페이지 인디케이터 |
| `PlanView` | 경기 목록 | 전체 비우기 버튼 | — |
| `StadiumDetailView` (4회) | 각 섹션 내용 | — | — |

부모가 5곳으로 늘어나도 `BaseDashboardCard`의 코드는 늘지 않습니다.
props로 모든 경우를 받으려 했다면 `showCount`, `showClearButton`, `showPagination` 같은 플래그와
`v-if`가 화면 수만큼 계속 추가되었을 것입니다.

#### props와 emit — 3단 중계

`WeatherCard`에서 발생한 클릭 이벤트가 `HomeView`까지 두 단계를 거쳐 올라가도록 구성했습니다.

```
WeatherCard.vue:59   @click.stop="emit('detail', city)"
        ↑
WeatherList.vue:52   @detail="emit('detail', $event)"      ← 가공 없이 그대로 중계
        ↑
HomeView.vue:250     @detail="showDetail"
        ↓
HomeView.vue:229     router.push(`/stadium/${city.id}`)
```

중간의 `WeatherList`는 자신이 처리할 이벤트가 아니므로 `$event`를 그대로 위로 넘깁니다.
페이지네이션이라는 자기 관심사만 처리하고 나머지는 통과시키는 구조입니다.

#### `v-model`을 직접 구현

`SearchBox`와 `DateSelector`는 `v-model`을 지원하도록 만들었습니다.
`computed`의 getter/setter를 사용해 **값을 저장하지 않고 부모에게 흘려보내는 통로**로 구현했습니다.

```js
// SearchBox.vue:12
const inner = computed({
  get: () => props.modelValue,                       // 읽기: 부모 값을 그대로
  set: (value) => emit('update:modelValue', value)   // 쓰기: 저장하지 않고 emit
})
```

로컬 `ref`로 복사본을 두지 않은 이유가 있습니다. 이 앱은 **주소창이 바뀌면 검색어가 따라 바뀌는 경로**가
있어서(3-3 참조), 복사본을 두면 뒤로가기 시 목록은 갱신되는데 입력창 글자는 그대로 남는 모순이 생깁니다.
값을 `HomeView` 한 곳에만 두어 이 문제를 원천적으로 차단했습니다.

#### 이벤트 수식어

카드 전체가 클릭 대상인데 그 안에 별도 버튼이 있어, 버블링을 끊지 않으면 두 동작이 동시에 일어납니다.

| 위치 | 수식어 | 필요했던 이유 |
|---|---|---|
| `WeatherCard.vue:31` | `@click.stop` | 별표 클릭 시 카드 클릭(상세 이동)이 함께 발동하지 않도록 |
| `WeatherCard.vue:59` | `@click.stop` | 상세보기 버튼도 동일 |
| `AddToPlanButton.vue:27` | `@click.stop.prevent` | 경기 목록의 행 전체가 `RouterLink`라, 버블링(`.stop`)과 링크 기본 동작(`.prevent`)을 **모두** 막아야 했습니다 |

---

### 3-3. Router

#### 라우트 구성

```js
// router/index.js
import HomeView from '../views/HomeView.vue'   // 첫 화면만 정적 import

routes: [
  { path: '/', name: 'home', component: HomeView },
  { path: '/stadium/:stadiumId', name: 'stadium-detail', component: () => import('...') },  // 동적 세그먼트
  { path: '/schedule',  name: 'schedule',  component: () => import('...') },
  { path: '/plan',      name: 'plan',      component: () => import('...') },
  { path: '/stadiums',  name: 'stadiums',  component: () => import('...') },
  { path: '/teams', redirect: '/stadiums' },                                    // redirect
  { path: '/about',     name: 'about',     component: () => import('...') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('...') }  // 반드시 마지막
]
```

홈 화면만 정적 `import`로 두었습니다. 앱 진입과 동시에 필요하므로 별도 청크로 분리하면
첫 화면 표시가 오히려 늦어지기 때문입니다. 나머지는 모두 Lazy Loading으로 등록했습니다.

#### 동적 세그먼트 — 컴포넌트 재사용 대응

```js
// StadiumDetailView.vue:161
onMounted(loadAll)
watch(() => route.params.stadiumId, loadAll)
```

`/stadium/stadium_01`에서 `/stadium/stadium_02`로 이동하면 vue-router는 컴포넌트를 재사용하므로
`onMounted`가 다시 실행되지 않습니다. `stadium` 자체는 `computed`라 자동 갱신되지만
**API 호출은 부수효과라 자동으로 따라오지 않는다**는 점을 확인하고 `watch`를 추가했습니다.

#### 쿼리스트링 양방향 동기화 — 교재 확장

교재는 쿼리스트링을 **읽는 것**까지 다루지만, 저는 검색 상태가 담긴 URL을 그대로 공유할 수 있도록
**양방향**으로 구현했습니다.

```js
// (1) 초기값 복원 — HomeView.vue:38
function readSearchFromUrl() {
  const raw = route.query.search
  return typeof raw === 'string' ? raw : ''   // ?search=a&search=b 면 배열로 오므로 방어
}
const searchQuery = ref(readSearchFromUrl())

// (2) 검색어 → 주소창 — :198
watch(searchQuery, (keyword) => {
  if (keyword === readSearchFromUrl()) return   // 루프 차단
  router.replace({
    query: keyword
      ? { ...route.query, search: keyword }
      : Object.fromEntries(Object.entries(route.query).filter(([k]) => k !== 'search'))
  })
})

// (3) 주소창 → 검색어 — :212 (뒤로가기/앞으로가기 대응)
watch(() => route.query.search, () => {
  const fromUrl = readSearchFromUrl()
  if (fromUrl !== searchQuery.value) searchQuery.value = fromUrl   // 루프 차단
})
```

구현하면서 해결한 문제 두 가지입니다.

- **`push` 대신 `replace`를 사용했습니다.** `push`를 쓰면 타이핑 한 글자마다 히스토리가 쌓여
  "두산"을 입력한 뒤 뒤로가기를 세 번 눌러야 이전 페이지로 돌아가게 됩니다.
- **무한 루프를 값 비교로 차단했습니다.** (2)와 (3)이 서로를 트리거하지만,
  양쪽 첫 줄에서 값이 같으면 즉시 `return`하므로 한 번 왕복한 뒤 멈춥니다.

#### Navigation Guard — 접근 차단이 아닌 로딩 UX

이 앱에는 로그인·권한 개념이 없어 교재에서 배운 접근 차단용 가드는 쓸 곳이 없었습니다.
대신 **Lazy Loading 때문에 발생하는 빈 화면 문제**를 가드로 해결했습니다.

```js
// router/index.js:66
router.beforeEach((to, from) => {
  // 쿼리스트링만 바뀌는 재진입은 새로 내려받을 것이 없으므로 건너뜁니다
  if (to.name !== from.name) {
    useUiStore().startRouteLoading()
  }
})

router.afterEach(() => useUiStore().endRouteLoading())
router.onError(() => useUiStore().resetLoading())
```

구현 중 겪은 문제와 해결 과정을 함께 기록합니다.

**① 진행 바가 영영 꺼지지 않는 문제**
처음에는 카운터로 `beforeEach`에서 `++`, `afterEach`에서 `--` 하도록 구현했습니다.
그러나 이동 중 사용자가 다른 메뉴를 누르면 취소된 쪽은 `beforeEach`를 건너뛰고 `afterEach`만
실행되기도 해서, 켠 횟수와 끈 횟수가 어긋나며 그 차이가 누적되었습니다.
**라우터 쪽은 카운터 대신 불리언으로 바꾸고 `afterEach`에서 조건 없이 해제**하도록 수정했습니다.
이동이 끝났다면 어떤 경로로 왔든 로딩은 끝난 것이 맞기 때문입니다.

**② `useUiStore()`를 가드 콜백 안에서 호출**
파일 최상단에서 호출했을 때 "활성 Pinia가 없다"는 에러가 발생했습니다.
`main.js`가 `app.use(createPinia())`를 실행하기 **전에** router 모듈을 import하면서
파일 전체가 먼저 실행되기 때문이었습니다. 콜백 내부로 옮겨 실제 이동 시점에 호출되도록 했습니다.

**③ 진행 바가 너무 빨라 보이지 않는 문제**
청크가 한 번 캐시되면 0ms 만에 끝나 진행 바가 렌더링조차 되지 않았습니다.
`uiStore`에 **최소 노출 400ms**와 **15초 안전장치**를 두어 해결했습니다.

---

### 3-4. Pinia Store

교재는 스토어 1개를 다루지만, 저는 **"props로 전달하기에 부적절한 상태"**를 기준으로 판별해 4개를 만들었습니다.
판단 기준은 **부모-자식 관계로 이어지지 않는 컴포넌트끼리 값을 공유해야 하는가**였습니다.

| 스토어 | state | getters | actions |
|---|---|---|---|
| `configStore` | `unit` | `unitSymbol` | `toggleUnit` |
| `favoriteStore` | `favoriteIds[]` | `favoriteCount`, `isFavorite(id)` | `toggleFavorite` |
| `plannerStore` | `plans[]` | `planCount`, `sortedPlans`, `isPlanned(date, id)` | `addPlan`, `removePlan`, `togglePlan`, `clearPlans` |
| `uiStore` | `routeLoading`, `pendingCount`, `holding` | `isBusy`, `isLoading` | `startRouteLoading`, `endRouteLoading`, `startLoading`, `stopLoading`, `resetLoading` |

전부 Setup Store 문법(`defineStore('name', () => {...})`)으로 작성했습니다.

#### 스토어를 선택한 이유 — 스토어별 근거

**`configStore` (섭씨/화씨)**
쓰는 곳은 `NavBar` 안의 `UnitToggler` 하나인데, 읽는 곳은 `WeatherCard`·`StadiumDetailView`·`PlanView`로
**컴포넌트 트리상 완전히 다른 가지**에 있습니다. props로 잇는다면 `App.vue`까지 값을 끌어올렸다가
모든 화면으로 다시 내려보내야 합니다.

기온 원본은 항상 섭씨로 보관하고 `convertTemp()`로 **표시 직전에만** 변환하도록 설계해,
단위를 토글해도 **API 재호출이 발생하지 않습니다.**

**`favoriteStore` (즐겨찾기)**
세 곳에서 필요했습니다 — 카드의 별표 표시, 상세 페이지의 버튼 문구, 그리고 **홈 화면의 정렬 순위**입니다.
특히 세 번째가 결정적이었습니다. `WeatherCard`에서 별표를 누르면 그 결과가 `HomeView`의 `computed`에
반영되어야 하는데, 이는 자식에서 부모의 계산 결과를 바꾸는 것이라 emit으로 처리하면 부모가
별표 상태를 따로 들고 있어야 합니다. 스토어에 두어 양쪽이 같은 데이터를 보게 했습니다.

**`plannerStore` (직관 예정)**
`AddToPlanButton`(3개 화면에 존재)과 `NavBar`의 개수 배지는 **서로의 존재를 전혀 모릅니다.**
부모-자식도 형제도 아닌 관계라 props/emit으로는 연결할 방법이 없었습니다.
경기 일정 화면에서 담기 버튼을 누르면 상단 네비게이션의 숫자가 즉시 올라가는 동작이 스토어로 구현되었습니다.

경기 하나는 `(날짜 + 구장)`으로 유일하게 식별되도록 설계했습니다. 한 구장에서 하루에 두 경기가 열리지 않기 때문입니다.

```js
// plannerStore.js:22 — 인자를 받아야 하므로 함수를 반환하는 getter로 구현했습니다
const isPlanned = computed(() => (date, stadiumId) =>
  plans.value.some((p) => p.date === date && p.stadiumId === stadiumId)
)
```

배열 갱신 시 `push` 대신 **참조를 교체**하도록 했습니다. `computed` 재계산을 확실히 보장하기 위함입니다.

```js
// plannerStore.js:35
plans.value = [...plans.value, { date, stadiumId, homeTeam, awayTeam, startTime }]
```

**`uiStore` (전역 로딩)**
`router/index.js`와 `GlobalProgressBar.vue`는 서로를 import하지 않습니다.
라우터가 스토어 값을 바꾸고, 진행 바가 그 값을 구독하는 구조로 **세 파일을 간접 연결**했습니다.

이 스토어는 **라우터 로딩과 API 로딩의 자료구조를 다르게** 두었습니다.

```js
const routeLoading = ref(false)    // 라우터: 불리언
const pendingCount = ref(0)        // API: 카운터
```

API 호출은 `finally`로 짝이 확실히 보장되므로 여러 요청을 카운터로 셀 수 있습니다.
반면 라우터 가드는 위에서 설명한 대로 짝이 어긋날 수 있어 불리언으로 두었습니다.
**같은 "로딩"이라도 성질이 다르면 자료구조도 달라야 한다**는 점을 이 과정에서 배웠습니다.

#### props를 선택한 경우와의 비교

반대로 스토어를 쓰지 **않은** 판단도 함께 기록합니다.

- `city` 객체 → **props**. 해당 카드에서만 필요한 값이라 전역에 둘 이유가 없습니다
- `detail` 클릭 → **emit**. 클릭 순간에만 필요한 일회성 신호입니다
- 카드 내부 마크업 → **slot**. 자식이 내용을 알 필요가 없습니다

`WeatherCard`는 props와 스토어를 함께 사용합니다. 구장 데이터는 부모에게서(props),
단위와 즐겨찾기는 스토어에서 가져옵니다. **"이 컴포넌트만의 값"과 "앱 전체가 공유하는 값"을
구분한 결과**입니다.

---

### 3-5. Axios · 비동기 처리

#### 인스턴스 구성

```js
// api/weatherApi.js
const client = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 6000
})
```

`timeout`을 둔 이유는 홈 화면이 구장 9곳을 동시에 조회하기 때문입니다.
한 곳의 응답이 지연되면 화면 전체가 멈춘 것처럼 보이므로 6초로 제한했습니다.

**컴포넌트는 Axios를 직접 다루지 않습니다.** 뷰는 `fetchCurrentWeather(lat, lon)` 같은 함수만 호출하고,
HTTP·인증키·응답 구조는 `api/` 계층 안에 격리했습니다. 응답도 그대로 넘기지 않고
앱 전용 형태로 가공해 내보내, 템플릿이 외부 API의 구조에 종속되지 않도록 했습니다.

```js
// 원본 data.main.temp / data.weather[0].description 같은 중첩 구조를 평평하게 변환
return {
  temp: Math.round(data.main.temp),
  status: data.weather[0].description,
  humidity: data.main.humidity,
  windSpeed: data.wind?.speed ?? null,    // undefined가 아닌 null로 통일
  windDeg: data.wind?.deg ?? null,
  sunset: data.sys?.sunset ?? null
}
```

`?? null`로 통일한 것은 의도한 처리입니다. `undefined`가 섞이면 `comfortScore()`의
`== null` 검사가 일관되게 동작하지 않기 때문입니다.

#### 비동기 패턴 3가지를 구분해 적용

교재는 단일 호출을 다루지만, 이 앱은 동시 호출이 많아 **"하나가 실패했을 때 무엇을 살릴 것인가"**를
기준으로 세 가지 패턴을 나누어 적용했습니다.

| 패턴 | 위치 | 선택한 이유 |
|---|---|---|
| `Promise.all` | `StadiumDetailView.vue:105` | 현재 날씨·시간별 예보·일별 요약 3개가 모두 있어야 화면이 구성됩니다. 하나라도 실패하면 전체를 목데이터로 폴백합니다 |
| `Promise.allSettled` | `HomeView.vue:84` | 현재 날씨는 필수, 예보는 부가 정보(강수확률)입니다. `Promise.all`을 쓰면 예보 실패 시 멀쩡한 현재 날씨까지 버리게 되어 `allSettled`로 바꿨습니다 |
| 개별 `try-catch` | `HomeView.vue:107` | 구장별 콜백 안에서 에러를 처리해, **잠실 한 곳이 실패해도 나머지 8곳은 정상 표시**되도록 했습니다. 실패한 구장은 `null`을 반환하고 호출부에서 걸러내며, 초기 목데이터가 그대로 유지됩니다 |
| `new Set` 중복 제거 | `PlanView.vue:64` | 같은 구장을 여러 날짜로 담았을 때 API를 한 번만 호출하도록 처리했습니다 |

#### 로딩 상태의 이중 구조

호출 하나가 두 종류의 로딩 표시를 제어하도록 구성했습니다.

```js
// ScheduleView.vue:70
isLoading.value = true      // ① 지역: el-skeleton — "어느 영역이" 준비 중인지
uiStore.startLoading()      // ② 전역: 진행 바 — "아직 진행 중"임을
try {
  const result = await fetchGamesByDate(dateStr)
  ...
} finally {
  isLoading.value = false
  uiStore.stopLoading()     // 성공·실패와 무관하게 반드시 실행
}
```

해제 코드를 `finally`에 둔 것이 중요합니다. `catch` 안에만 두면 예상하지 못한 예외가 발생했을 때
진행 바가 영구히 남게 됩니다.

#### API가 없는 데이터도 같은 인터페이스로

KBO는 공식 API가 없어 로컬 데이터를 사용하지만, `kboScheduleApi.js`가 **Promise를 반환하도록**
작성했습니다. 나중에 실제 API가 생기면 이 파일 내부만 `client.get()`으로 교체하면 되고,
호출부 코드는 수정할 필요가 없습니다.

---

### 3-6. UI Library — Element Plus

`main.js`에서 전역 등록(`app.use(ElementPlus)`) 후 6종을 사용했습니다.

| 컴포넌트 | 사용 횟수 | 용도 |
|---|---|---|
| `el-skeleton` | 6 | 로딩 중 콘텐츠가 들어올 자리 확보 |
| `el-empty` | 6 | 검색 결과 없음 / 해당 날짜 경기 없음 |
| `el-table` + `el-table-column` | 1 + 5 | 구장 위치 표 |
| `el-button` | 3 | 상세보기, 전체 비우기 |
| `el-alert` | 2 | API 키 안내, 악천후 경고 |

**라이브러리 기본 렌더링을 그대로 쓰지 않고 scoped slot으로 커스터마이징한 부분**을 함께 기록합니다.

```html
<!-- StadiumsView.vue -->
<el-table-column prop="teams" label="구단" min-width="170" />   <!-- 기본 렌더링 -->

<el-table-column label="홈구장" min-width="160">
  <!-- el-table이 넘겨주는 row를 받아 직접 마크업을 구성했습니다 -->
  <template #default="{ row }">
    <span class="stadium-name">{{ row.name }}</span>
    <span v-if="row.isDome" class="dome-tag">돔</span>
  </template>
</el-table-column>
```

한 표 안에 기본 방식과 커스터마이징 방식을 함께 두어, 표에서 가장 중요한 정보인
구장명만 굵게 강조하고 돔구장에 태그를 붙였습니다.

한편 `el-input`과 `el-pagination`은 초기에 사용했으나, 디자인 통일과 슬롯 실습을 위해
직접 만든 `SearchBox`·`PagerDots`로 대체했습니다.

---

## 4. 자체 구현 기능

교재 커리큘럼에는 없으나, 주제에 맞는 서비스가 되도록 추가로 구현한 기능들입니다.

### 4-1. 직관 지수 (`utils/comfortScore.js`)

기온만으로 "더움/적당함/선선함"을 표시했더니, 여름 KBO 경기는 대부분 28℃를 넘어
**사실상 '더움' 하나만 계속 표시**되는 문제가 있었습니다.
기온·강수확률·바람·습도 네 요소를 함께 보고 100점에서 감점하는 방식으로 재설계했습니다.

| 요소 | 감점 기준 |
|---|---|
| 기온 | 이상 구간 18~24℃. 초과 시 1℃당 5.5점(최대 60), 미만 시 1℃당 4.5점(최대 55) |
| 강수 | 확률 × 52점. 70% 이상은 우천취소 위험 구간으로 8점 추가 |
| 바람 | 9m/s↑ 15점, 6m/s↑ 7점. **더울 때(26℃↑) 산들바람은 −4점 가점**, 추울 때(15℃↓)는 +5점 |
| 습도 | 26℃ 이상 & 70% 초과 구간만 1%당 0.3점(최대 9점) |

등급은 `80↑ 최고 / 65↑ 좋음 / 45↑ 보통 / 25↑ 아쉬움 / 그 이하 비추천`으로 나눴습니다.
**돔구장은 날씨와 무관하게 100점**으로 처리하고, 기온 데이터가 없으면 점수를 만들지 않고 `null`을 반환합니다.

계산 함수를 순수 함수로 분리해 컴포넌트와 독립적으로 검증할 수 있게 했습니다.

### 4-2. 경기 시간대 예보 추출 (`weatherApi.js`)

무료 예보는 3시간 간격이라 18:30 경기에 정확히 맞는 값이 없습니다.
해당 날짜 블록 중 **18시에 가장 가까운 것**을 선택하도록 구현했습니다.

```js
const gap = Math.abs(hour - GAME_HOUR)
if (eveningGap[date] === undefined || gap <= eveningGap[date]) {
  eveningGap[date] = gap
  byDate[date].evening = { temp, humidity, windSpeed, precipitationChance }
}
```

`<`가 아닌 `<=`를 쓴 이유는, 15시와 21시가 똑같이 3시간 차이로 비길 때
**나중에 순회하는 21시가 선택되도록** 하기 위해서입니다. 경기가 21시대까지 이어지므로
늦은 쪽이 실제 관람 환경에 더 가깝다고 판단했습니다.

### 4-3. 바람 × 구장 방위 (`utils/fieldDirection.js`)

구장별로 `cfBearing`(홈플레이트 → 중견수 방위각)을 정의하고, 풍향과 대조해
바람이 외야 쪽인지 홈플레이트 쪽인지 판정해 타구 영향을 안내합니다.

기상 관측의 풍향은 **바람이 불어오는 쪽**이므로 180°를 더해 "불어가는 쪽"으로 변환한 뒤
구장 기준 상대각으로 바꾸는 처리를 넣었습니다.

`cfBearing`은 추정값이 아닙니다. 처음에는 "야구장은 북향"이라는 통념대로 값을 넣었는데
결과가 전부 어긋나, 구글맵 위성뷰에서 홈플레이트와 중견수 좌표를 직접 읽어
`scripts/bearing.mjs`로 대권 방위각을 계산해 실측값으로 교체했습니다.
실제로는 대부분 165~195°(남향)였고, 대구·광주만 54°/56°였습니다.

### 4-4. 그늘 예측 (`utils/sunPosition.js`)

NOAA 약식 알고리즘으로 태양의 고도와 방위각을 **외부 API 없이 직접 계산**했습니다.
스탠드 높이 25m를 가정해 14~21시 시간대별로 어느 관중석에 그늘이 지는지 표시합니다.
`fieldDirection.js`의 구역 판정 함수를 바람 기능과 공유합니다.

### 4-5. 직관 플래너

가고 싶은 경기를 담아 한 화면에서 날씨를 비교하고, 담긴 경기 중 **조건이 가장 나쁜 경기**를
경고로 안내합니다. 예보 범위(5일) 밖이면 점수를 만들지 않고 "예보 범위 밖"으로 표시합니다.

---

## 5. 프로젝트 구조

```
src/
├─ main.js                       # createApp + Pinia / Router / Element Plus 등록
├─ App.vue                       # GlobalProgressBar + NavBar + ApiKeyNotice + RouterView
├─ router/index.js               # 라우트 정의 + Navigation Guard
├─ api/
│  ├─ weatherApi.js              # OpenWeatherMap 호출 + 경기 시간대 예보 추출
│  └─ kboScheduleApi.js          # 일정 조회 (Promise 인터페이스 유지)
├─ data/
│  ├─ stadiums.js                # 구장 9곳 마스터 데이터
│  └─ kboSchedule2026.local.js   # 수기 입력 일정 (gitignore)
├─ stores/                       # Pinia 4개
├─ utils/                        # 순수 계산 함수 5개
├─ components/                   # 16개 (공용 5 + 단일 사용 11)
├─ views/                        # 페이지 7개
└─ assets/
   ├─ base.css                   # 리셋 + 타이포 기본
   ├─ main.css                   # 디자인 토큰 + 공통 클래스
   └─ stadiums/                  # 구장 사진 9장
```

### 화면 구성

| 경로 | 화면 | 내용 |
|---|---|---|
| `/` | 홈 | 구장 카드 목록, 검색, 페이지네이션 |
| `/stadium/:stadiumId` | 구장 상세 | 날짜별 예보, 직관 지수, 바람, 그늘 |
| `/schedule` | 경기 일정 | 날짜별 경기와 직관 지수 |
| `/plan` | 직관 예정 | 담은 경기 날씨 비교 |
| `/stadiums` | 야구장 위치 | 구장 주소 표 |
| `/about` | 소개 | 데이터 출처 |
| `*` | 404 | Catch-all |

### 디자인

`src/assets/main.css`의 `:root`에 토큰을 모아 관리했습니다.
색상은 WCAG 명도 대비를 계산해 검증했고(본문 16.7:1, 보조 5.35:1),
아이보리 배경 위에서 회색 계열이 탁해 보여 그림자와 구분선을 갈색 기반 웜톤으로 조정했습니다.
화면마다 가장 중요한 정보 하나를 정해 700 굵기로 강조했으며(카드=구장명, 일정=대진),
숫자에는 `font-variant-numeric: tabular-nums`를 적용해 자릿수가 흔들리지 않게 했습니다.

### 참고 문서

구현 상세를 별도 문서로 정리했습니다.

- [`docs/vue-components-정리.md`](docs/vue-components-정리.md) — 교재 128~178p 개념과 코드의 1:1 대응
- [`docs/axios-동작-정리.md`](docs/axios-동작-정리.md) — Axios 계층 상세
- [`docs/관계별-개념정리.md`](docs/관계별-개념정리.md) — 파일 간 연결 관계별 정리
- [`docs/데이터-연결-상세.md`](docs/데이터-연결-상세.md) — 값이 흐르는 경로 추적

---

## 6. 데이터 출처와 제약

### 날씨 — OpenWeatherMap

`.env`의 `VITE_OPENWEATHER_API_KEY`로 관리하며 `.env`는 커밋하지 않았습니다(`.env.example`만 포함).

- 무료 플랜 예보는 **5일치**이므로, 그 이후 경기는 직관 지수를 만들지 않습니다
- 홈 화면은 구장 9곳 × 2회 = **18회 호출**이 발생하므로 분당 60회 제한에 유의해야 합니다

### 경기 일정 — 직접 정리

KBO는 공식 무료 API를 제공하지 않고 홈페이지는 CORS 정책으로 프론트엔드에서 직접 호출할 수 없습니다.
공식 캘린더를 확인해 **2026-08-01 ~ 09-06** 일정을 직접 옮겨 적어 로컬 데이터로 사용했습니다.
저장소에 원본 데이터를 포함하지 않기 위해 이 파일은 gitignore 처리했으며,
파일이 없어도 앱이 정상 동작하도록 `import.meta.glob`으로 로드했습니다.

```js
// 일반 import는 파일이 없으면 빌드가 실패하지만, glob은 빈 객체를 반환합니다
const modules = import.meta.glob('../data/kboSchedule2026.local.js', { eager: true })
const SCHEDULE = Object.values(modules)[0]?.default ?? null
```

### 없는 데이터는 만들지 않았습니다

초기에는 라인업과 선발투수를 목데이터로 채웠으나, 신뢰할 수 있는 출처가 없어 전부 제거했습니다.
**데이터가 없으면 "정보 없음"으로 표시한다**를 원칙으로 정하고 전 구간에 적용했습니다.
API 실패 시 폴백에서도 기온만 목데이터를 쓰고 습도·풍속은 `null`로 두었으며,
직관 지수 역시 기온이 없으면 점수를 생성하지 않습니다.

---

## 7. 개발 환경

### ESLint

Flat Config로 구성했습니다.

```
js.configs.recommended
  + eslint-plugin-vue (flat/essential)
  + oxlint (.oxlintrc.json 기반)
  + eslint-config-prettier   ← 포맷 규칙 충돌 제거를 위해 마지막에 배치
```

`scripts/` 폴더는 브라우저가 아닌 Node로 실행하는 도구이므로 전용 블록을 추가해
Node 전역을 허용했습니다.

```js
{
  name: 'app/node-scripts',
  files: ['scripts/**/*.{js,mjs}'],
  languageOptions: { globals: { ...globals.node } }
}
```

`vue/multi-word-component-names` 규칙에 걸린 `Pagination.vue`는 규칙을 비활성화하는 대신
**컴포넌트 이름을 `PagerDots.vue`로 변경**했습니다. 숫자 페이지 버튼이 아니라 점 인디케이터이므로
실제 역할에도 더 맞는 이름이라고 판단했습니다.

### Prettier

`.prettierrc.json`에 `semi: false`, `singleQuote: true`, `printWidth: 100`을 설정하고,
`.editorconfig`도 `indent_size: 2`, `max_line_length: 100`으로 맞춰 두 도구가 충돌하지 않도록 했습니다.

### 환경 변수

| 항목 | 처리 |
|---|---|
| 실제 파일 | `.env` — `VITE_OPENWEATHER_API_KEY` |
| 저장소 포함 | `.env.example`만 (값은 비어 있음) |
| `.gitignore` | `.env`, `.env.*` 차단 + `!.env.example` 예외 |
| 읽는 위치 | `weatherApi.js` — `import.meta.env.VITE_OPENWEATHER_API_KEY` |
| 미설정 시 | `hasApiKey()`가 `false` → 목데이터 폴백 + 전역 안내 배너 |

---

## 8. 알고 있는 한계와 남은 과제

구현하면서 인지했으나 이번 과제 범위에서 처리하지 못한 사항을 함께 기록합니다.

| 항목 | 내용 |
|---|---|
| **API 키 노출** | `VITE_` 접두사가 붙은 환경변수는 빌드 결과물에 포함되므로 배포 시 브라우저에서 확인이 가능합니다. 프론트엔드만으로는 해결할 수 없고 프록시 서버가 필요합니다 |
| **경기 시작 시각 고정** | 현재 모든 경기를 18:30으로 처리하고 있어, 주말·공휴일 낮경기(14시/17시)는 실제 관람 시간과 다른 시각의 예보로 직관 지수가 계산됩니다. 일정 데이터에 시각 필드를 추가하는 것이 다음 개선 사항입니다 |
| **상태 미영속** | 즐겨찾기와 직관 예정은 새로고침 시 초기화됩니다. localStorage 연동으로 해결할 수 있습니다 |
| **응답 캐싱 부재** | 화면을 이동할 때마다 동일한 구장의 날씨를 다시 조회합니다. `weatherStore`에 TTL을 두어 개선할 수 있습니다 |
| **scoped slot 미구현** | `el-table`이 제공하는 scoped slot을 사용하기만 했고, 직접 정의한 사례는 없습니다. `DateSelector`의 날짜 칩을 슬롯으로 개방하는 방향을 검토했습니다 |
| **배포 미실시** | Refinement 단계까지 완료했으며 Deployment는 진행하지 못했습니다 |
