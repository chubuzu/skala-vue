# Vue Components & Router (교재 128~178p) — 내 프로젝트 적용 정리

> 야구장 날씨 프로젝트(skala-wthrprjct)에서 오늘 배운 개념이 실제로 어떤 파일의 어떤 코드로 쓰였는지 정리한 문서.

---

## 1. Component 지역 등록 (131p)

부모가 자식을 `import`하고 `<template>`에서 태그처럼 쓰는 방식. 프로젝트 전체가 이 방식이고, 전역 등록(132p)은 쓰지 않았다.

**`src/views/HomeView.vue`**

```js
import SearchBox from '../components/SearchBox.vue'
import WeatherList from '../components/WeatherList.vue'
import StatusBar from '../components/StatusBar.vue'
```

```html
<SearchBox v-model="searchQuery" />
<WeatherList :weather-list="filteredWeatherList" ... />
<StatusBar :message="statusMessage" />
```

파일명은 PascalCase, 태그도 PascalCase로 통일했다.

### 컴포넌트 트리 (130p: 부모-자식 / 형제 / 조상-후손)

```
App.vue
├── NavBar.vue ─── UnitToggler.vue
└── RouterView
    ├── HomeView.vue                   ← 반응형 상태 보유(부모 역할)
    │   ├── SearchBox.vue
    │   ├── WeatherList.vue            ← 중간 계층
    │   │   ├── WeatherCard.vue        ← HomeView 기준 '후손'
    │   │   │   ├── StadiumImage.vue
    │   │   │   └── TempBadge.vue
    │   │   └── Pagination.vue
    │   └── StatusBar.vue
    └── StadiumDetailView.vue
        ├── StadiumImage.vue / DateSelector.vue
        ├── WindIndicator.vue
        └── ShadeTimeline.vue
```

`SearchBox`와 `WeatherList`는 **형제 관계**라서 직접 대화하지 못한다. 검색어가 카드 목록에 반영되는 경로는 반드시 부모(HomeView)를 거친다.

```
SearchBox --(emit)--> HomeView --(props)--> WeatherList
```

---

## 2. Props (139~146p)

### 객체 형식 + 타입 + required (139p)

**`src/components/WeatherCard.vue`**

```js
const props = defineProps({
  city: { type: Object, required: true },
  // 오늘 이 구장에서 열리는 경기 { home, away } (없으면 null)
  todayGame: { type: Object, default: null }
})
```

### default 값 지정 (139p)

**`src/components/TempBadge.vue`**

```js
const props = defineProps({
  rawTemp: { type: Number, required: true },
  displayTemp: { type: Number, required: true },
  unitSymbol: { type: String, default: '℃' }   // 부모가 안 주면 섭씨로
})
```

### 배열·객체 default는 화살표 함수로 (146p)

교재에서 강조한 "배열/객체의 기본값은 반드시 `() => []`, `() => ({})` 형태" 규칙을 지킨 부분.

**`src/components/WeatherList.vue`**

```js
const props = defineProps({
  weatherList: { type: Array, required: true },
  todayGameMap: { type: Object, default: () => ({}) }   // ← 함수 형태
})
```

**`src/components/DateSelector.vue`**

```js
dailyWeather: { type: Object, default: () => ({}) },
visibleCount: { type: Number, default: 5 }
```

### `<script setup>` 안에서는 `props.` 을 붙여서 접근 (140p)

**`src/components/WeatherCard.vue`**

```js
const displayTemp = computed(() => convertTemp(props.city.temp, configStore.unit))
const isFavorite = computed(() => favoriteStore.isFavorite(props.city.id))
```

`<template>`에서는 `{{ city.name }}`처럼 그냥 쓰지만, script에서는 `props.city`로 접근해야 하는 차이.

### 데이터는 camelCase, 속성은 kebab-case (143p)

**`src/views/HomeView.vue`** (부모 — kebab-case로 전달)

```html
<WeatherList
  :weather-list="filteredWeatherList"
  :today-game-map="todayGameMap"
/>
```

**`src/components/WeatherList.vue`** (자식 — camelCase로 선언)

```js
defineProps({
  weatherList: { ... },
  todayGameMap: { ... }
})
```

### Props는 읽기 전용 (141p)

`WeatherList.vue`에서 페이지네이션할 때 `props.weatherList`를 직접 자르지 않고 `computed`로 **새 배열**을 만들어 반환한다. 원본을 건드리지 않는 방식.

```js
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return props.weatherList.slice(start, start + PAGE_SIZE)   // slice는 원본 불변
})
```

`HomeView`의 정렬도 같은 이유로 복사본을 만들어 정렬한다.

```js
return [...matched].sort((a, b) => { ... })   // 원본 배열 보호
```

---

## 3. Emits (147~150p)

### 기본형 — 자식이 이벤트 + 페이로드를 쏘아 올림

**`src/components/WeatherCard.vue`** (자식)

```js
const emit = defineEmits(['select', 'detail'])
```

```html
<div class="card" @click="emit('select', city)">
  ...
  <!-- .stop 수식어로 카드 클릭(버블링) 없이 상세 페이지로 이동 -->
  <button class="detail-btn" @click.stop="emit('detail', city)">상세보기 ›</button>
</div>
```

### 중간 계층이 이벤트를 그대로 위로 중계 (형제 간 통신 원리, 130p)

`WeatherCard`는 `HomeView`의 직접 자식이 아니다. 그래서 `WeatherList`가 받아서 다시 위로 올려준다.

**`src/components/WeatherList.vue`** (중간 계층)

```js
const emit = defineEmits(['select', 'detail'])
```

```html
<WeatherCard
  :city="city"
  :today-game="todayGameMap[city.id] ?? null"
  @select="emit('select', $event)"
  @detail="emit('detail', $event)"
/>
```

**`src/views/HomeView.vue`** (최종 수신)

```html
<WeatherList @select="selectCity" @detail="showDetail" />
```

```js
const selectCity = (city) => { selectedCityInfo.value = city }
const showDetail = (city) => { router.push(`/stadium/${city.id}`) }
```

전체 흐름:

```
WeatherCard --emit('detail', city)--> WeatherList --emit('detail', $event)--> HomeView --router.push--> 상세 페이지
```

### `v-model` = props + emit의 조합

교재 138p의 "데이터는 아래로, 이벤트는 위로"를 가장 압축적으로 보여주는 패턴.

**`src/components/SearchBox.vue`** (자식)

```js
const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const inner = computed({
  get: () => props.modelValue,                    // 부모 → 자식 (props)
  set: (value) => emit('update:modelValue', value) // 자식 → 부모 (emit)
})
```

**`src/views/HomeView.vue`** (부모)

```html
<SearchBox v-model="searchQuery" />
```

`v-model`은 사실 `:model-value="searchQuery" @update:model-value="searchQuery = $event"`의 축약형. `DateSelector.vue`도 같은 구조로 만들었다.

---

## 4. Slot (155~158p)

### 직접 만든 슬롯 컴포넌트 — `BaseDashboardCard.vue`

과제 요구사항 2번. 검색박스 · 리스트박스 · 상세 패널의 **공통 디자인(배경·라운드·그림자·여백·제목 스타일)만** 담고, 내용물은 부모가 `<slot>`으로 주입한다.

**`src/components/BaseDashboardCard.vue`**

```html
<section class="dashboard-card" :class="{ flush }">
  <!-- Named Slot: 제목 영역 (156p 기본값 개념 — 부모가 안 넣으면 title prop으로 대체) -->
  <header v-if="title || $slots.header || $slots.actions" class="card-head">
    <slot name="header">
      <h2 class="card-title">{{ title }}</h2>
    </slot>

    <!-- Named Slot: 우측 액션 영역 -->
    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" />
    </div>
  </header>

  <!-- Default Slot: 부모가 아무것도 안 넣으면 아래 문구가 기본값 -->
  <div class="card-body">
    <slot>
      <p class="placeholder">표시할 내용이 없습니다.</p>
    </slot>
  </div>

  <!-- Named Slot: 넘어온 내용이 있을 때만 렌더링 -->
  <footer v-if="$slots.footer" class="card-foot">
    <slot name="footer" />
  </footer>
</section>
```

`$slots`로 "부모가 그 슬롯에 뭔가를 넣었는지" 검사해서, 비어 있으면 헤더/푸터 영역 자체를 렌더링하지 않는다.

#### 사용하는 쪽 1 — Default Slot만 사용

**`src/components/SearchBox.vue`**

```html
<BaseDashboardCard title="구단 · 구장 검색">
  <div class="search-field">
    <input v-model="inner" type="text" placeholder="구단명, 구장명, 지역명으로 검색">
  </div>
</BaseDashboardCard>
```

#### 사용하는 쪽 2 — Named Slot 3개를 모두 사용

**`src/components/WeatherList.vue`**

```html
<BaseDashboardCard title="구단별 홈구장 날씨">
  <!-- 헤더 우측 -->
  <template #actions>
    <span class="count">{{ weatherList.length }}개 구장</span>
  </template>

  <!-- 본문 (Default Slot) -->
  <div class="card-grid">
    <WeatherCard v-for="city in pagedList" :key="city.id" ... />
  </div>

  <!-- 하단 -->
  <template v-if="totalPages > 1" #footer>
    <Pagination :current-page="currentPage" :total-pages="totalPages" @change="currentPage = $event" />
  </template>
</BaseDashboardCard>
```

#### 교재 160p 6번 참고사항이 실제로 확인되는 지점

> "Slot으로 전달되는 자식 컴포넌트는 시각적으로는 BaseDashboardCard 내부에 위치하지만, 스크립트적으로는 부모 컴포넌트의 스코프에서 컴파일된다."

위 코드에서 `WeatherCard`는 화면상 `BaseDashboardCard` 안에 그려지지만, `v-for="city in pagedList"`의 `pagedList`도, `@select` 이벤트 핸들러도 전부 **`WeatherList`의 스코프**에서 평가된다. `BaseDashboardCard`는 `pagedList`가 뭔지 전혀 모른 채 자리만 빌려준다.

**`src/views/StadiumDetailView.vue`** — 같은 컴포넌트를 4번 재사용해서 패널 4개를 만들었다.

```html
<BaseDashboardCard title="현재 날씨"> ... </BaseDashboardCard>
<BaseDashboardCard v-if="!stadium.isDome" title="바람 · 타구 영향"> ... </BaseDashboardCard>
<BaseDashboardCard v-if="!stadium.isDome" title="시간대별 그늘 예상"> ... </BaseDashboardCard>
<BaseDashboardCard title="홈경기 일정"> ... </BaseDashboardCard>
```

이전에는 각 `<section class="panel">`이 배경·그림자 CSS를 중복으로 갖고 있었는데, 이제 그 스타일은 `BaseDashboardCard.vue` 한 곳에만 있다.

### Scoped Slot — 자식이 부모에게 데이터를 넘겨주는 슬롯 (158p)

Element Plus의 `el-table`을 쓰면서 Scoped Slot을 소비하는 쪽으로 사용했다. `row`가 자식(el-table)이 부모에게 건네주는 "변수 주머니".

**`src/views/TeamsView.vue`**

```html
<el-table-column label="" width="120">
  <template #default="{ row }">        <!-- v-slot="{ row }" 의 축약형 -->
    <RouterLink :to="`/stadium/${row.id}`">
      <el-button size="small">상세보기</el-button>
    </RouterLink>
  </template>
</el-table-column>
```

### Named Slot — `#default`로 이름 지정 (157p)

**`src/views/HomeView.vue`** — `el-skeleton`의 `default` 슬롯에 로딩 완료 후 보여줄 마크업을 주입.

```html
<el-skeleton :loading="isLoadingWeather" animated :rows="4">
  <template #default>
    <WeatherList ... />
  </template>
</el-skeleton>
```

### 세 가지 슬롯 유형 정리 (155p)

| 유형 | 이 프로젝트에서의 위치 | 역할 |
|---|---|---|
| Default Slot | `BaseDashboardCard`의 `<slot>` | 카드 본문 주입, 미주입 시 기본 문구 표시 |
| Named Slot | `BaseDashboardCard`의 `header` / `actions` / `footer` | 여러 구역에 각각 다른 마크업 주입 |
| Scoped Slot | `el-table`의 `#default="{ row }"` | 자식이 가진 행 데이터를 부모가 받아 사용 |

---

## 5. Lifecycle Hooks (134~136p)

### `onMounted` — API 호출의 적기 (135p)

교재에서 "DOM 마운트 후, 백엔드 API 호출에 가장 완벽한 타이밍"이라고 한 그대로 사용.

**`src/views/HomeView.vue`**

```js
// ⚾ 초기값은 목데이터로 채우고, API 키가 있으면 onMounted에서 실제 값으로 덮어쓴다.
onMounted(loadRealWeather)
```

**`src/views/StadiumDetailView.vue`**

```js
onMounted(loadAll)                                  // 날씨 + 경기 정보 최초 로드
watch(() => route.params.stadiumId, loadAll)        // 구장이 바뀌면 다시 로드
```

**`src/views/ScheduleView.vue`**

```js
onMounted(() => loadGames(selectedDate.value))
```

### 생성(Creation) 단계 = `<script setup>` 본문 (136p)

`ref` 선언, `computed`·`watch` 등록이 모두 여기서 일어난다. 예를 들어 `StadiumDetailView.vue`의 `stadium` computed는 setup 시점에 만들어지고, `onMounted`는 그 후에 실행된다.

> `onUnmounted`는 아직 사용처가 없다. 교재 예시처럼 `setInterval`로 날씨를 주기적으로 갱신하는 기능을 넣는다면, 그때 타이머 정리(`clearInterval`)를 위해 반드시 필요해진다.

---

## 6. `<style scoped>` (과제 요구사항 5)

모든 컴포넌트가 자기 스타일을 `scoped`로 갖는다. 덕분에 `.card`, `.matchup`, `.temp` 같은 흔한 클래스명이 여러 파일에서 겹쳐도 충돌하지 않는다.

`Pagination.vue`처럼 라이브러리 내부 DOM에 스타일을 넣어야 할 때만 `:deep()`을 썼다.

```css
:deep(.el-pagination) {
  justify-content: center;
}
```

---

## 7. Provide / Inject (151~153p) — 대신 Pinia 사용

Props Drilling 문제를 교재는 `provide`/`inject`로 푸는 방법을 보여주지만, 이 프로젝트는 교재 187p 표에서 "앱 전체 상태는 Pinia" 쪽 기준을 따랐다.

단위 설정(℃/℉)은 `NavBar > UnitToggler`에서 바꾸는데, 실제로 쓰는 곳은 멀리 떨어진 `WeatherCard`, `TempBadge`, `StadiumDetailView`다. Props로 넘기려면 3~4단계를 거쳐야 해서 Store로 처리했다.

**`src/stores/configStore.js`**

```js
export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius')
  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))
  function toggleUnit() { unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius' }
  return { unit, unitSymbol, toggleUnit }
})
```

어느 컴포넌트에서든 `useConfigStore()` 한 줄로 접근한다.

```js
const configStore = useConfigStore()
const displayTemp = computed(() => convertTemp(props.city.temp, configStore.unit))
```

`favoriteStore`(즐겨찾기)도 같은 이유로 Store로 만들었다.

---

## 8. 과제 요구사항 대비 체크리스트

| # | 요구사항 | 상태 | 대응 파일 |
|---|---|---|---|
| 1 | WeatherParent.vue — 반응형 데이터 보유 | ✅ | `views/HomeView.vue` (searchQuery, selectedCityInfo, weatherList) |
| 2 | BaseDashboardCard.vue — `<slot>` 공통 레이아웃 | ✅ | `components/BaseDashboardCard.vue` (Default + Named 슬롯 4개) |
| 3 | SearchBar.vue — props 표시 + update-query emit | ✅ | `components/SearchBox.vue` (`update:modelValue`로 구현) |
| 4 | WeatherCard.vue — props 표시 + select/detail emit | ✅ | `components/WeatherCard.vue` |
| 5 | 각 컴포넌트 `<style scoped>` 분리 | ✅ | 전체 컴포넌트 |
| 6 | Slot 자식은 부모 스코프에서 컴파일됨 (개념) | ✅ | `WeatherList.vue`의 `WeatherCard v-for` — 데이터·핸들러 모두 WeatherList 스코프 |
| 7 | 추가 컴포넌트 만들기 | ✅ | `TempBadge`, `StadiumImage`, `Pagination`, `DateSelector`, `UnitToggler`, `NavBar`, `WindIndicator`, `ShadeTimeline` (8개 추가) |

7개 요구사항 모두 충족.

---

## 9. 컴포넌트 목록 (총 13개)

| 컴포넌트 | 역할 | 쓰인 개념 |
|---|---|---|
| `BaseDashboardCard` | 카드 공통 레이아웃 | **Slot(Default·Named)**, props |
| `SearchBox` | 검색 입력 | props + emit(`v-model`), slot 소비 |
| `WeatherList` | 카드 목록 + 페이지네이션 | props, emit 중계, computed, watch |
| `WeatherCard` | 구장 카드 1개 | props, emit, `.stop` 수식어, Store |
| `TempBadge` | 온도 그라데이션 배지 | props(default), computed |
| `StadiumImage` | 구장 사진/일러스트 | props, `useId`, `import.meta.glob` |
| `Pagination` | 점 인디케이터 | props, emit |
| `DateSelector` | 날짜 칩 선택 | props + emit(`v-model`), computed |
| `StatusBar` | 하단 상태 메시지 | props |
| `NavBar` | 상단 네비게이션 | RouterLink |
| `UnitToggler` | ℃/℉ 전환 | Pinia Store |
| `WindIndicator` | 바람 방향 모식도 | props, computed, SVG 바인딩 |
| `ShadeTimeline` | 시간대별 그늘 | props, computed |

---

## 10. Vue Router 기본 개념 (161~167p)

### SPA와 package.json 의존성 (162p)

교재: "Vue는 최초 접속 시 하나의 HTML만 다운로드하는 SPA 구조. Vue Router가 브라우저 URL 변화를 JS로 가로채서, 서버에 새 페이지를 요청하지 않고 컴포넌트만 실시간 교체."

`package.json`에 `vue-router`, `pinia`가 의존성으로 들어있고, 실제로 우리 프로젝트도 새로고침 없이 `/`, `/stadium/:id`, `/schedule`, `/teams`, `/about` 사이를 이동한다.

### Router 생성 — Step 1 (163p)

**`src/router/index.js`**

```js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'   // ① 정적 import

const routes = [
  { path: '/', name: 'home', component: HomeView },                              // ①
  { path: '/stadium/:stadiumId', name: 'stadium-detail', component: () => import('../views/StadiumDetailView.vue') }, // ②
  { path: '/schedule', name: 'schedule', component: () => import('../views/ScheduleView.vue') },
  { path: '/teams', name: 'teams', component: () => import('../views/TeamsView.vue') },
  { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
```

교재 163p가 설명한 `component` 지정 방식 두 가지를 그대로 나눠 썼다: 진입과 동시에 반드시 필요한 `HomeView`만 ①정적 import, 방문할 때만 필요한 나머지 페이지는 ②동적 import(Lazy Loading)로 처리해 초기 번들 크기를 줄였다.

### Router 등록 — Step 2 (164p)

**`src/main.js`**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)   // 교재 164p: app.use()로 라우터 설정을 앱에 등록
app.mount('#app')
```

### RouterView / RouterLink — Step 3, `<a>` 태그 금지 (165p)

교재: "`<a href>`는 브라우저 강제 새로고침을 일으켜 메모리의 반응형 데이터(ref, computed)를 전부 초기화한다." 그래서 프로젝트 전체에 `<a href="...">` 대신 `<RouterLink>`만 사용했다.

**`src/App.vue`**

```html
<template>
  <div id="app">
    <NavBar />
    <RouterView />
  </div>
</template>
```

**`src/components/NavBar.vue`**

```html
<RouterLink to="/" class="nav-link">홈</RouterLink>
<RouterLink to="/schedule" class="nav-link">경기 일정</RouterLink>
<RouterLink to="/teams" class="nav-link">구단 목록</RouterLink>
<RouterLink to="/about" class="nav-link">소개</RouterLink>
```

`.router-link-exact-active` 클래스로 현재 페이지 탭을 하이라이트하는 것도 `RouterLink`가 기본 제공하는 기능이다.

### views 폴더 vs components 폴더 (167p)

교재 표: views는 "RouterView에 직접 매핑되는 페이지 단위", components는 "여러 곳에서 재사용되는 UI 조각".

| | 이 프로젝트의 예 |
|---|---|
| `views/` (페이지) | `HomeView`, `StadiumDetailView`, `ScheduleView`, `TeamsView`, `AboutView`, `NotFoundView` — routes 배열에 전부 등록됨 |
| `components/` (재사용 UI) | `WeatherCard`, `BaseDashboardCard`, `TempBadge` 등 — routes에 직접 등록되지 않고 view 안에서 조립됨 |

---

## 11. useRoute() — 현재 경로 읽기 (168~171p)

### Dynamic Route Matching (169~170p)

교재: "URL 일부가 동적으로 바뀌는 패스는 콜론(:)으로 변수화한다." 프로젝트에선 구장 ID를 이 방식으로 받는다.

**`src/router/index.js`**

```js
{ path: '/stadium/:stadiumId', name: 'stadium-detail', component: () => import('../views/StadiumDetailView.vue') }
```

**`src/views/StadiumDetailView.vue`**

```js
import { useRoute } from 'vue-router'

const route = useRoute()
const stadium = computed(() => findStadiumById(route.params.stadiumId))  // 168p: route.params

// 동적 세그먼트가 바뀌면(다른 구장으로 이동) 다시 로드
watch(() => route.params.stadiumId, loadAll)
```

교재가 강조한 "route 객체는 반응형(reactive)이라 template/script에서 즉시 활용 가능"이 정확히 이 `watch`에서 확인된다 — `route.params.stadiumId`를 `watch`로 감시할 수 있는 이유가 바로 그 반응성 때문이다.

### Query String Routing (171p)

교재: "URL 뒤에 `?key=value` 형태로 붙는 Query String을 Vue Router와 동기화하는 라우팅 기법. 컴포넌트에서는 `route.query.search`로 값을 확인한다."

홈 화면의 검색어를 주소창 `?search=` 와 **양방향으로** 묶었다. 덕분에 `/?search=잠실` 링크를 그대로 공유하거나 새로고침해도 검색 상태가 유지된다.

**`src/views/HomeView.vue`**

```js
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 주소창의 ?search= 값을 읽는다 (배열로 올 수도 있으므로 문자열일 때만 사용)
function readSearchFromUrl() {
  const raw = route.query.search
  return typeof raw === 'string' ? raw : ''
}

// ① 진입 시점 복원 — ref의 초기값 자체를 URL에서 가져온다
const searchQuery = ref(readSearchFromUrl())
```

교재 171p 예시는 `onMounted` 안에서 복원하지만, 여기서는 `ref`의 초기값으로 바로 넣었다. `onMounted`는 첫 렌더링 **후**에 실행되므로 "빈 목록 → 필터된 목록"으로 한 번 깜빡이는데, 초기값으로 주면 처음부터 필터된 상태로 그려진다.

```js
// ② 검색어 → 주소창
watch(searchQuery, (keyword) => {
  if (keyword === readSearchFromUrl()) return

  router.replace({
    query: keyword
      ? { ...route.query, search: keyword }
      : Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== 'search'))
  })
})

// ③ 주소창 → 검색어 (뒤로가기/앞으로가기 대응)
watch(
  () => route.query.search,
  () => {
    const fromUrl = readSearchFromUrl()
    if (fromUrl !== searchQuery.value) {
      searchQuery.value = fromUrl
    }
  }
)
```

#### 구현하면서 신경 쓴 3가지

**1. `push`가 아니라 `replace` (173p 표 참고)**

`router.push`를 쓰면 타이핑 한 글자마다 히스토리 항목이 쌓여서, "잠실"을 검색한 뒤 뒤로가기를 누르면 `잠실 → 잠시 → 잠 → 빈칸` 순으로 4번을 눌러야 이전 페이지로 나간다. 검색어처럼 연속적으로 바뀌는 상태는 히스토리에 남기지 않는 `replace`가 맞다.

**2. 무한 루프 방지**

②는 검색어가 바뀌면 URL을 바꾸고, ③은 URL이 바뀌면 검색어를 바꾼다. 서로를 호출하는 구조라 방치하면 무한 루프가 된다. 양쪽 모두 **"값이 이미 같으면 즉시 `return`"** 하는 가드를 넣어서, 한 바퀴 돌면 두 값이 일치해 자연히 멈추도록 했다.

**3. 검색어를 지우면 `?search=`도 제거**

`{ ...route.query, search: '' }`로 두면 주소가 `/?search=` 처럼 지저분하게 남는다. `Object.entries(...).filter(...)`로 `search` 키 자체를 빼되, 나중에 다른 쿼리(`?page=2` 등)가 추가되더라도 그것들은 보존되도록 했다.

#### `route.params` vs `route.query` — 이 프로젝트에서의 사용 구분

| | 사용처 | 이유 |
|---|---|---|
| `route.params` | `/stadium/:stadiumId` (`StadiumDetailView`) | 구장 ID는 **어떤 페이지인지를 결정하는 필수 값**. 없으면 페이지가 성립하지 않음 |
| `route.query` | `/?search=잠실` (`HomeView`) | 검색어는 **같은 페이지의 부가 상태**. 없어도 홈 화면은 정상 동작 |

---

## 12. useRouter() — Programmatic Navigation (172~174p)

교재: "`<RouterLink>` 클릭 외에, 스크립트 코드(이벤트 핸들러, 비동기 로직 등)로 페이지를 이동할 때 `router.push()`를 쓴다."

**`src/views/HomeView.vue`**

```js
import { useRouter } from 'vue-router'

const router = useRouter()

const showDetail = (city) => {
  router.push(`/stadium/${city.id}`)   // 173p: router.push(path)
}
```

카드의 "상세보기" 버튼(`WeatherCard` → `emit('detail', ...)`)을 클릭하면 이 `showDetail`이 실행되어 URL이 바뀌고 `RouterView`가 `StadiumDetailView`로 교체된다. 교재 178p 과제 요구사항이 명시한 "상세보기 버튼 클릭 시 `window.alert()`를 제거하고 Programmatic Navigation으로 처리"를 그대로 만족한다.

`router.replace()`, `router.go(n)`, `router.back()`은 현재 프로젝트에 사용처가 없다 — 예를 들어 "비로그인 시 강제 리다이렉트"류의 흐름이 없기 때문. 뒤로가기 버튼을 만들게 되면 `router.back()`이 필요해지는 지점이다.

---

## 13. Navigation Guard (175~176p) — 이 프로젝트는 아직 미구현

교재: "특정 라우트로 진입하기 직전 접근 권한 검사나 리다이렉션 같은 로직을 실행하는 훅. `router.beforeEach`가 대표적인 Global Guard."

우리 프로젝트는 로그인/권한 개념이 없는 공개 정보성 앱이라 `router.beforeEach`를 실제로 쓸 상황이 없었다. 다만 만약 "즐겨찾기 페이지는 즐겨찾기가 하나도 없으면 홈으로 돌려보낸다" 같은 규칙을 넣는다면, 교재 176p 예시 그대로 아래처럼 확장할 수 있다.

```js
// (미구현 예시) router/index.js
router.beforeEach((to, from, next) => {
  if (to.meta.requiresFavorite && favoriteStore.list.length === 0) {
    next('/')
  } else {
    next()
  }
})
```

---

## 14. Catch-all Route — 정의되지 않은 경로 처리 (177p)

교재: "정의되지 않은 경로로 접속하면 Vue Router는 에러 없이 그냥 아무것도 렌더링하지 않는다. 이를 막기 위해 `path: '/:pathMatch(.*)*'` 패턴을 라우트 목록 가장 마지막에 배치한다."

**`src/router/index.js`** (routes 배열의 마지막 항목)

```js
{
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('../views/NotFoundView.vue')
}
```

교재가 강조한 "가장 마지막에 배치"도 그대로 지켰다 — Vue Router는 배열 순서대로 매칭을 시도하므로, 이 라우트가 앞쪽에 있으면 다른 모든 경로를 가로채 버린다.

---

## 15. Hands on – Weather Router (178p) 과제 요구사항 대비

| # | 요구사항 | 상태 | 대응 파일 |
|---|---|---|---|
| 1 | Vue Router 설정: 지연 로딩 + Catch-all Route | ✅ | `router/index.js` |
| 2 | App.vue: Navigation Bar(RouterLink) + RouterView 배치 | ✅ | `App.vue`, `NavBar.vue` |
| 3 | Home 뷰: WeatherParent 대체, 상세보기 클릭 시 `window.alert()` 대신 Programmatic Navigation | ✅ | `HomeView.vue`의 `showDetail` → `router.push` |
| 4 | Detail 뷰: 동적 경로(:id)로 지역 선택, 상세 기상 정보 표시 | ✅ (Mock 대신 실제 OpenWeatherMap API 연동까지 확장) | `StadiumDetailView.vue`, `route.params.stadiumId` |
| 5 | About 뷰: 소개 내용 + 메인으로 돌아가기 링크 | ✅ | `AboutView.vue`의 `<RouterLink to="/">` |
| 6 | 추가 view 작성 및 라우팅 | ✅ | `ScheduleView.vue`, `TeamsView.vue` 추가 |

교재 개념 중 Navigation Guard(175~176p)만 "미구현"이다 — 로그인/권한 개념이 없는 공개 정보성 앱이라 실사용처가 없어 억지로 넣지 않았다.

반대로 교재보다 한 단계 더 나간 부분:

- Query String Routing을 **양방향** 동기화로 구현 (교재는 `onMounted`에서 읽어오는 단방향 복원만 다룸)
- Mock Data 대신 실제 OpenWeatherMap API 연동 (Axios)
- 동적 세그먼트(`route.params.stadiumId`) 변경 시 `watch`로 자동 재조회
- 히스토리 오염을 막기 위한 `push`/`replace` 구분 적용
