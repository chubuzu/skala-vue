<script setup>
import { computed } from 'vue'
import { comfortScore, LEVEL_COLORS } from '../utils/comfortScore'

const props = defineProps({
  // { temp, precipitationChance, windSpeed, humidity } 형태의 날씨 객체
  weather: { type: Object, default: () => ({}) },
  isDome: { type: Boolean, default: false },
  // 'sm' = 카드용 알약 하나, 'lg' = 상세 페이지용 점수 + 감점 사유
  size: { type: String, default: 'sm' },
  // 점수를 깎은 이유를 함께 노출할지 (lg에서만 의미 있음)
  showReasons: { type: Boolean, default: false },
  // 어느 시점 날씨로 낸 점수인지. 화면마다 기준이 달라 오해가 생기므로 함께 표기한다.
  //   'now'  = 지금 이 순간
  //   'game' = 경기 시간대(18시) 예보
  basis: { type: String, default: '' }
})

const result = computed(() => comfortScore(props.weather, { isDome: props.isDome }))

const colors = computed(() => LEVEL_COLORS[result.value.level] ?? LEVEL_COLORS.unknown)

const badgeStyle = computed(() => ({
  backgroundColor: colors.value.bg,
  color: colors.value.fg
}))

// 80점 이상인데 감점 사유를 나열하면 어색하므로, 아쉬운 점이 있을 때만 보여준다
const visibleReasons = computed(() =>
  props.showReasons && result.value.score != null && result.value.score < 80
    ? result.value.reasons
    : []
)

const BASIS_LABEL = { now: '지금', game: '경기 시간' }

// 돔구장이나 정보 없음일 때는 기준을 붙여봐야 의미가 없다
const basisLabel = computed(() =>
  result.value.score != null && !result.value.isDome ? (BASIS_LABEL[props.basis] ?? '') : ''
)
</script>

<template>
  <div class="comfort" :class="size">
    <span class="pill" :style="badgeStyle">
      <template v-if="result.isDome">🏟️ {{ result.label }}</template>
      <template v-else-if="result.score == null">{{ result.label }}</template>
      <template v-else>
        <strong class="score">{{ result.score }}</strong>
        <span class="label">{{ result.label }}</span>
      </template>
    </span>

    <!-- 같은 배지가 화면마다 다른 시점을 뜻하지 않도록 기준을 함께 표기 -->
    <span v-if="basisLabel" class="basis">{{ basisLabel }} 기준</span>

    <p v-if="visibleReasons.length" class="reasons">{{ visibleReasons.join(' · ') }}</p>
  </div>
</template>

<style scoped>
.comfort {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.comfort.lg {
  align-items: flex-start;
}
.pill {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
}

/* 카드용 */
.sm .pill {
  font-size: 12px;
  padding: 5px 12px;
}
.sm .score {
  font-size: 13px;
}

/* 상세 페이지용 */
.lg .pill {
  font-size: 14px;
  padding: 8px 16px;
}
.lg .score {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.label {
  font-weight: 600;
}
.basis {
  font-size: 11px;
  font-weight: 500;
  color: var(--label-tertiary);
  white-space: nowrap;
}
.reasons {
  /* flex-wrap 상태에서 항상 새 줄로 떨어지도록 */
  flex-basis: 100%;
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--label-secondary);
  line-height: 1.5;
}
</style>
