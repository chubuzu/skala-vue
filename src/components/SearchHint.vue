<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: { type: Number, required: true }
})

// 본인만의 Computed: 검색 시도 횟수가 5회 이상이면 "활발한 검색"으로 판단
const isFrequent = computed(() => props.count >= 5)
</script>

<template>
  <p v-if="isFrequent" class="search-hint">
    🔍 검색을 활발히 이용 중이시네요! (검색 시도 {{ count }}회)
  </p>
</template>

<style scoped>
.search-hint {
  font-size: 12px;
  color: #2563eb;
  margin: -12px 0 20px;
}
</style>
