import { createRouter, createWebHistory } from 'vue-router'
// 첫 화면(HomeView)은 정적 import: 앱 진입과 동시에 필요하므로 미리 로드
import HomeView from '../views/HomeView.vue'
import { useUiStore } from '../stores/uiStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 나머지는 Lazy Loading으로 등록 (route level code-splitting)
  // -> 방문할 때만 별도 청크(chunk)로 다운로드됨
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/stadium/:stadiumId',
      name: 'stadium-detail',
      component: () => import('../views/StadiumDetailView.vue')
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleView.vue')
    },
    {
      path: '/plan',
      name: 'plan',
      component: () => import('../views/PlanView.vue')
    },
    {
      path: '/stadiums',
      name: 'stadiums',
      component: () => import('../views/StadiumsView.vue')
    },
    // 이전 주소(/teams)로 들어와도 새 주소로 보내준다 (교재 163p redirect 속성)
    { path: '/teams', redirect: '/stadiums' },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    // Catch-all Route: 정의되지 않은 경로 접근 시 NotFoundView로 안내 (반드시 마지막)
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// ─────────────────────────────────────────────────────────────
// Navigation Guard (교재 175~176p)
//
// 이 앱은 로그인/권한 개념이 없어 '접근 차단'용 가드는 필요 없다.
// 대신 지연 로딩(Lazy Loading) 때문에 생기는 빈 화면 문제를 가드로 해결한다.
// /schedule, /plan 같은 페이지는 방문 시점에 청크를 내려받는데,
// 그동안 RouterView 영역이 비어 보여서 사용자는 멈춘 줄 안다.
//
// 주의: useUiStore()를 이 파일 최상단에서 부르면 안 된다.
//   main.js가 router를 import하는 시점은 app.use(createPinia()) 이전이라
//   아직 활성 Pinia가 없어 에러가 난다. 그래서 가드 '안에서' 호출한다.
// ─────────────────────────────────────────────────────────────

router.beforeEach((to, from) => {
  // 같은 페이지 재진입(쿼리스트링만 변경 등)은 새로 로딩할 게 없으므로 건너뛴다.
  // HomeView의 검색어 ?search= 동기화가 router.replace를 자주 호출하기 때문에 꼭 필요하다.
  if (to.name !== from.name) {
    useUiStore().startRouteLoading()
  }
  // vue-router 5부터 next()는 deprecated. 아무것도 반환하지 않으면 통과를 의미한다.
})

// ⚠️ 여기서는 to/from을 비교하지 않고 '무조건' 끈다.
//    beforeEach와 afterEach는 1:1로 짝지어지지 않기 때문이다.
//    이동 중에 다른 이동이 끼어들면 취소된 쪽은 beforeEach를 건너뛰고 afterEach만 실행된다.
//    조건을 걸면 그 어긋남이 누적되어 진행 바가 영영 안 꺼지는 버그가 생긴다.
router.afterEach(() => {
  useUiStore().endRouteLoading()
})

// 청크 다운로드 실패 등으로 이동이 끊기면 afterEach가 실행되지 않으므로 여기서 정리
router.onError(() => {
  useUiStore().resetLoading()
})

export default router
