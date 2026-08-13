<script setup>
import { computed } from 'vue'
import { weatherEmoji } from '../utils/weatherIcon'

const props = defineProps({
  modelValue: { type: String, default: '' },
  dates: { type: Array, required: true },
  // { '2026-08-11': { icon, status, maxTemp, minTemp }, ... } 형태의 날짜별 날씨 요약 (선택)
  dailyWeather: { type: Object, default: () => ({}) },
  // 한 번에 보여줄 날짜 개수
  visibleCount: { type: Number, default: 5 }
})

const emit = defineEmits(['update:modelValue'])

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 선택된 날짜가 항상 보이도록 앞뒤로 잘라서 5개만 노출
const visibleDates = computed(() => {
  const { dates, modelValue, visibleCount } = props
  if (dates.length <= visibleCount) return dates

  const selectedIndex = Math.max(0, dates.indexOf(modelValue))
  const half = Math.floor(visibleCount / 2)
  let start = selectedIndex - half

  if (start < 0) start = 0
  if (start + visibleCount > dates.length) start = dates.length - visibleCount

  return dates.slice(start, start + visibleCount)
})

function weekdayOf(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]
}

function dayOf(dateStr) {
  const [, month, day] = dateStr.split('-').map(Number)
  return `${month}/${day}`
}

function emojiOf(dateStr) {
  const summary = props.dailyWeather[dateStr]
  // 예보 범위(5일) 밖 날짜는 날씨 정보가 없으므로 중립 아이콘
  if (!summary) return '·'
  return weatherEmoji(summary)
}

function tempOf(dateStr) {
  const summary = props.dailyWeather[dateStr]
  if (!summary) return null
  return `${summary.maxTemp}°`
}
</script>

<template>
  <div class="date-selector">
    <button
      v-for="date in visibleDates"
      :key="date"
      type="button"
      class="date-chip"
      :class="{ active: date === modelValue }"
      @click="emit('update:modelValue', date)"
    >
      <span class="weekday">{{ weekdayOf(date) }}</span>
      <span class="day">{{ dayOf(date) }}</span>
      <span class="icon">{{ emojiOf(date) }}</span>
      <span v-if="tempOf(date)" class="temp">{{ tempOf(date) }}</span>
    </button>
  </div>
</template>

<style scoped>
.date-selector {
  display: flex;
  gap: 8px;
  min-width: 0;
}
.date-chip {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 12px 4px 10px;
  border: none;
  border-radius: 16px;
  background: var(--surface-muted);
  color: var(--label);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
  font-family: inherit;
}
@media (hover: hover) {
  .date-chip:hover {
    background: rgba(120, 106, 80, 0.13);
  }
}
.date-chip:active {
  transform: scale(0.96);
}
.date-chip.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.28);
}
.weekday {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.55;
}
.date-chip.active .weekday {
  opacity: 0.9;
}
/* 날짜 숫자가 이 칩에서 가장 중요한 정보 */
.day {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
}
.icon {
  font-size: 20px;
  line-height: 1.2;
}
.temp {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.date-chip.active .temp {
  opacity: 0.9;
}

@media (max-width: 640px) {
  .date-selector {
    gap: 6px;
  }
  .date-chip {
    padding: 10px 2px 8px;
    border-radius: 14px;
  }
  .weekday {
    font-size: 11px;
  }
  .day {
    font-size: 13px;
  }
  .icon {
    font-size: 17px;
  }
  .temp {
    font-size: 11px;
  }
}
</style>
