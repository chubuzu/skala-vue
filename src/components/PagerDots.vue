<script setup>
// 점(dot) 형태의 페이지 인디케이터.
//
// 파일명이 Pagination.vue였을 때 ESLint의 vue/multi-word-component-names 규칙에 걸렸다.
// 단어 하나짜리 이름은 향후 HTML 표준 요소나 라이브러리 컴포넌트와 충돌할 수 있어서 막는 규칙이다.
// 단순히 규칙을 끄는 대신 이름을 바꿨다. 이 컴포넌트는 숫자 페이지 버튼이 아니라
// 점 인디케이터이므로 PagerDots가 실제 역할에도 더 맞는 이름이다.
defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

const emit = defineEmits(['change'])
</script>

<template>
  <div class="pager-dots">
    <button
      v-for="page in totalPages"
      :key="page"
      type="button"
      class="dot"
      :class="{ active: page === currentPage }"
      :aria-label="`${page}페이지`"
      :aria-current="page === currentPage ? 'true' : undefined"
      @click="emit('change', page)"
    />
  </div>
</template>

<style scoped>
.pager-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}
.dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 50%;
  background: rgba(120, 106, 80, 0.28);
  cursor: pointer;
  padding: 0;
  transition:
    background 0.2s ease,
    width 0.2s ease;
}
.dot:hover {
  background: rgba(120, 106, 80, 0.5);
}
.dot.active {
  width: 22px;
  border-radius: 999px;
  background: var(--label);
}
</style>
