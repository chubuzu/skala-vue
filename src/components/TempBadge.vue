<template>
  <span class="temp-badge" :style="badgeStyle">{{ icon }} {{ label }} ({{ temp }}°C)</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  temp: { type: Number, required: true }
})

// 이 범위를 기준으로 파랑(춥다) ~ 빨강(덥다) 그라데이션 위치를 계산한다
const MIN_TEMP = 0
const MAX_TEMP = 35

const ratio = computed(() => {
  const clamped = Math.min(MAX_TEMP, Math.max(MIN_TEMP, props.temp))
  return (clamped - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)
})

// hue 240(파랑) -> 0(빨강) 로 온도가 오를수록 색이 이동
const hue = computed(() => 240 - ratio.value * 240)

const badgeStyle = computed(() => ({
  backgroundColor: `hsl(${hue.value}, 80%, 48%)`
}))

const label = computed(() => {
  if (props.temp >= 28) return '더움'
  if (props.temp >= 20) return '적당함'
  return '선선함'
})

const icon = computed(() => {
  if (props.temp >= 28) return '🔥'
  if (props.temp >= 20) return '🌤️'
  return '❄️'
})
</script>

<style scoped>
.temp-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  color: #fff;
}
</style>
