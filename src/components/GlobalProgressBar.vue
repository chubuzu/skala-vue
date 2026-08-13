<script setup>
// 화면 최상단에 뜨는 얇은 로딩 진행 바.
// 라우터 Navigation Guard(router/index.js)가 uiStore를 켜고 끄면 여기서 반응한다.
import { useUiStore } from '../stores/uiStore'

const uiStore = useUiStore()
</script>

<template>
  <!-- Transition으로 나타남/사라짐을 부드럽게 처리 -->
  <Transition name="fade">
    <div v-if="uiStore.isLoading" class="progress-track" role="progressbar" aria-label="페이지 불러오는 중">
      <div class="progress-bar" />
    </div>
  </Transition>
</template>

<style scoped>
.progress-track {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  z-index: 2000;
  overflow: hidden;
}

/* 실제 소요 시간을 알 수 없으므로, 왼쪽에서 오른쪽으로 흐르는 무한 애니메이션으로 표현 */
.progress-bar {
  width: 40%;
  height: 100%;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
  animation: slide 1s ease-in-out infinite;
}

@keyframes slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 움직임에 민감한 사용자를 위해 애니메이션을 줄인다 */
@media (prefers-reduced-motion: reduce) {
  .progress-bar {
    animation: none;
    width: 100%;
    opacity: 0.5;
  }
}
</style>
