<script setup>
import { computed } from 'vue'
import { analyzeWind, windStrengthLabel } from '../utils/fieldDirection'

const props = defineProps({
  windDeg: { type: Number, required: true },
  speed: { type: Number, required: true },
  cfBearing: { type: Number, required: true }
})

const analysis = computed(() => analyzeWind(props.windDeg, props.cfBearing))
const strength = computed(() => windStrengthLabel(props.speed))

// 모식도에서 '위쪽'이 외야(상대각 0°)이고 화살표 기본 방향도 위쪽이므로 상대각을 그대로 회전값으로 사용
const arrowRotation = computed(() => analysis.value.relative)
</script>

<template>
  <div class="wind-indicator">
    <!-- 구장을 위에서 내려다본 모식도 (센터가 항상 위쪽) -->
    <svg viewBox="0 0 120 120" class="field-diagram" role="img" aria-label="구장 기준 바람 방향">
      <circle cx="60" cy="60" r="52" fill="#eaf3ec" />
      <!-- 외야 잔디 -->
      <path d="M60 60 L14 32 A54 54 0 0 1 106 32 Z" fill="#cfe6d4" />
      <!-- 내야 다이아몬드 (홈플레이트가 아래쪽) -->
      <path d="M60 44 L78 64 L60 84 L42 64 Z" fill="#e3c39c" />
      <path d="M60 44 L78 64 L60 84 L42 64 Z" fill="none" stroke="#fff" stroke-width="1.5" />
      <circle cx="60" cy="64" r="3" fill="#d0a878" />

      <!-- 방향 라벨 -->
      <text x="60" y="16" class="lbl" text-anchor="middle">외야</text>
      <text x="60" y="112" class="lbl" text-anchor="middle">홈</text>
      <text x="110" y="66" class="lbl" text-anchor="end">1루</text>
      <text x="10" y="66" class="lbl" text-anchor="start">3루</text>

      <!-- 바람 화살표: 구장 기준 상대각만큼 회전 (0° = 외야 방향으로 붊) -->
      <g :transform="`rotate(${arrowRotation} 60 60)`">
        <line x1="60" y1="84" x2="60" y2="34" stroke="#0071e3" stroke-width="3" stroke-linecap="round" />
        <path d="M60 28 L54 40 L66 40 Z" fill="#0071e3" />
      </g>
    </svg>

    <div class="wind-info">
      <p class="effect">{{ analysis.effect }}</p>
      <p class="detail">
        {{ analysis.fromCompass }}풍 {{ speed.toFixed(1) }}m/s · {{ strength }}
      </p>
      <p class="sub">{{ analysis.zone.label }} 방향으로 붑니다</p>
    </div>
  </div>
</template>

<style scoped>
.wind-indicator {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}
.field-diagram {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}
.wind-info {
  min-width: 0;
}
.wind-info p {
  word-break: keep-all;
}
.lbl {
  font-size: 8px;
  fill: #8a8a8e;
  font-weight: 600;
}
.wind-info p {
  margin: 0;
}
.effect {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin-bottom: 6px !important;
}
.detail {
  font-size: 14px;
  color: var(--label);
  margin-bottom: 2px !important;
}
.sub {
  font-size: 13px;
  color: var(--label-secondary);
}

@media (max-width: 640px) {
  .wind-indicator {
    gap: 14px;
  }
  .field-diagram {
    width: 96px;
    height: 96px;
  }
  .effect {
    font-size: 15px;
  }
  .detail {
    font-size: 13px;
  }
}
</style>
