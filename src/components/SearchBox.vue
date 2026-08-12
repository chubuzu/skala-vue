<script setup>
import { computed } from 'vue'
import BaseDashboardCard from './BaseDashboardCard.vue'

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

// v-model 구현: props(부모→자식)로 읽고, emit(자식→부모)으로 쓴다
const inner = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <!-- 공통 레이아웃(BaseDashboardCard)에 검색 UI만 slot으로 주입한다 -->
  <BaseDashboardCard title="구단 · 구장 검색">
    <div class="search-field">
      <span class="search-icon">🔍</span>
      <input v-model="inner" type="text" placeholder="구단명, 구장명, 지역명으로 검색">
      <button v-if="modelValue" class="clear-btn" @click="inner = ''">✕</button>
    </div>
    <p class="hint">검색어: {{ modelValue || '전체' }}</p>
  </BaseDashboardCard>
</template>

<style scoped>
.search-field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-muted);
  border-radius: 12px;
  padding: 10px 14px;
}
.search-icon {
  font-size: 14px;
  opacity: 0.5;
}
.search-field input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  font-family: inherit;
  color: var(--label);
}
.search-field input::placeholder {
  color: var(--label-secondary);
  opacity: 0.7;
}
.clear-btn {
  border: none;
  background: rgba(120, 120, 128, 0.3);
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}
.hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--label-secondary);
}
</style>
