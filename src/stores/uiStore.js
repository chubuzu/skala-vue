import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 진행 바가 '깜빡'하고 사라지지 않도록 보장하는 최소 노출 시간(ms).
// 라우터 청크는 캐시되면 0ms 만에 끝나서, 이 장치가 없으면 사람 눈에 안 보인다.
const MIN_VISIBLE_MS = 400

// 어떤 이유로든 로딩이 안 꺼지는 상황을 막는 안전장치(ms).
// 진행 바가 영원히 떠 있는 것보다는 강제로 끄는 편이 낫다.
const SAFETY_TIMEOUT_MS = 15000

export const useUiStore = defineStore('ui', () => {
  // ── state ──────────────────────────────
  //
  // 라우터 이동과 API 호출은 성격이 달라서 따로 관리한다.
  //
  // 1) 라우터: 불리언
  //    beforeEach와 afterEach는 1:1로 짝지어지지 않는다. 이동 중에 다른 이동이 끼어들면
  //    취소된 쪽은 beforeEach를 건너뛰고 afterEach만 실행되기도 한다.
  //    카운터로 세면 이 어긋남이 그대로 누적되어 바가 영영 안 꺼진다.
  //    그래서 라우터 쪽은 '켜짐/꺼짐' 하나로만 두고, afterEach에서 무조건 끈다.
  const routeLoading = ref(false)

  // 2) API 호출: 카운터
  //    여러 요청이 동시에 진행될 수 있고, 각 호출은 finally에서 확실히 짝을 맞춰 끈다.
  const pendingCount = ref(0)

  // 작업은 끝났지만 최소 노출 시간을 채우려고 붙잡아 두는 중인지
  const holding = ref(false)

  // 화면에 그릴 값이 아니므로 ref로 두지 않는다
  let shownAt = 0
  let hideTimer = null
  let safetyTimer = null

  // ── getters ────────────────────────────
  const isBusy = computed(() => routeLoading.value || pendingCount.value > 0)
  const isLoading = computed(() => isBusy.value || holding.value)

  // ── 내부 헬퍼 ───────────────────────────
  function markShown() {
    // 이미 보이는 중이면 노출 시작 시각을 새로 잡지 않는다
    if (!isBusy.value && !holding.value) {
      shownAt = Date.now()
    }
    // 사라지려던 참이었다면 취소하고 계속 보여준다
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
      holding.value = false
    }
    // 안전장치 타이머 재설정
    if (safetyTimer) clearTimeout(safetyTimer)
    safetyTimer = setTimeout(() => {
      console.warn('[uiStore] 로딩이 15초 넘게 끝나지 않아 강제로 해제합니다.')
      resetLoading()
    }, SAFETY_TIMEOUT_MS)
  }

  function scheduleHide() {
    // 아직 진행 중인 게 있으면 그대로 둔다
    if (isBusy.value) return

    if (safetyTimer) {
      clearTimeout(safetyTimer)
      safetyTimer = null
    }

    const remain = MIN_VISIBLE_MS - (Date.now() - shownAt)
    if (remain <= 0) {
      holding.value = false
      return
    }

    // 너무 빨리 끝났으면 남은 시간만큼 더 보여준다
    holding.value = true
    hideTimer = setTimeout(() => {
      holding.value = false
      hideTimer = null
    }, remain)
  }

  // ── actions: 라우터용 ───────────────────
  function startRouteLoading() {
    markShown()
    routeLoading.value = true
  }

  // afterEach / onError에서 조건 없이 호출한다 (짝 맞추기에 의존하지 않음)
  function endRouteLoading() {
    routeLoading.value = false
    scheduleHide()
  }

  // ── actions: API 호출용 ─────────────────
  function startLoading() {
    markShown()
    pendingCount.value++
  }

  function stopLoading() {
    pendingCount.value = Math.max(0, pendingCount.value - 1)
    scheduleHide()
  }

  // ── actions: 강제 초기화 ────────────────
  function resetLoading() {
    routeLoading.value = false
    pendingCount.value = 0
    holding.value = false
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    if (safetyTimer) {
      clearTimeout(safetyTimer)
      safetyTimer = null
    }
  }

  return {
    routeLoading,
    pendingCount,
    holding,
    isBusy,
    isLoading,
    startRouteLoading,
    endRouteLoading,
    startLoading,
    stopLoading,
    resetLoading
  }
})
