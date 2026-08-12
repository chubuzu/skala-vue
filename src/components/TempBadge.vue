<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 그라데이션 색상/단계 판정은 항상 섭씨 원본 기준으로 계산한다 (단위 전환과 무관하게 일관성 유지)
  rawTemp: { type: Number, required: true },
  displayTemp: { type: Number, required: true },
  unitSymbol: { type: String, default: '℃' }
})

// 이 범위를 기준으로 파랑(춥다) ~ 빨강(덥다) 그라데이션 위치를 계산한다
const MIN_TEMP = 0
const MAX_TEMP = 35

const ratio = computed(() => {
  const clamped = Math.min(MAX_TEMP, Math.max(MIN_TEMP, props.rawTemp))
  return (clamped - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)
})

// hue 240(파랑) -> 0(빨강) 로 온도가 오를수록 색이 이동
const hue = computed(() => 240 - ratio.value * 240)

const badgeStyle = computed(() => ({
  backgroundColor: `hsl(${hue.value}, 85%, 96%)`,
  color: `hsl(${hue.value}, 70%, 38%)`
}))

const label = computed(() => {
  if (props.rawTemp >= 28) return '더움'
  if (props.rawTemp >= 20) return '적당함'
  return '선선함'
})
</script>

<template>
  <span class="temp-badge" :style="badgeStyle">{{ label }}</span>
</template>

<style scoped>
.temp-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 999px;
}
</style>
