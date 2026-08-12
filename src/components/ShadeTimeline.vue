<script setup>
import { computed } from 'vue'
import { getSunPosition, shadeStage } from '../utils/sunPosition'
import { toFieldRelativeAngle, angleToZone } from '../utils/fieldDirection'

const props = defineProps({
  stadium: { type: Object, required: true },
  // 'YYYY-MM-DD' 형식. 이 날짜의 오후 시간대를 계산한다
  date: { type: String, required: true },
  sunset: { type: Number, default: null } // UNIX 초
})

// 경기 시간대를 중심으로 14시 ~ 21시를 한 시간 간격으로 계산
const HOURS = [14, 15, 16, 17, 18, 19, 20, 21]

const timeline = computed(() => {
  const [year, month, day] = props.date.split('-').map(Number)

  return HOURS.map((hour) => {
    const localDate = new Date(year, month - 1, day, hour, 0, 0)
    const { altitude, azimuth } = getSunPosition(localDate, props.stadium.lat, props.stadium.lon)

    // 태양이 떠 있는 쪽 관중석이 그림자를 드리운다
    const relative = toFieldRelativeAngle(azimuth, props.stadium.cfBearing)

    return {
      hour,
      altitude,
      zone: angleToZone(relative),
      stage: shadeStage(altitude)
    }
  })
})

const sunsetLabel = computed(() => {
  if (!props.sunset) return null
  const date = new Date(props.sunset * 1000)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
})
</script>

<template>
  <div class="shade-timeline">
    <p class="summary">
      <template v-if="sunsetLabel">🌇 일몰 {{ sunsetLabel }} · </template>
      태양이 있는 쪽 관중석부터 그늘이 생깁니다
    </p>

    <div class="hours">
      <div v-for="row in timeline" :key="row.hour" class="hour-row" :class="row.stage.level">
        <span class="hour">{{ row.hour }}시</span>
        <span class="alt">고도 {{ Math.round(row.altitude) }}°</span>
        <span class="zone">
          <template v-if="row.altitude > 0">{{ row.zone.short }} 그늘</template>
          <template v-else>—</template>
        </span>
        <span class="stage">{{ row.stage.label }}</span>
      </div>
    </div>

    <p class="disclaimer">
      ※ 구장 방위와 관중석 높이(25m)를 단순화해 계산한 추정치입니다. 실제 그늘은 지붕 구조에 따라 달라집니다.
    </p>
  </div>
</template>

<style scoped>
.summary {
  font-size: 14px;
  margin: 0 0 14px;
  color: var(--label);
}
.hours {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hour-row {
  display: grid;
  grid-template-columns: 48px 66px minmax(0, 1fr) minmax(0, auto);
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  background: rgba(255, 214, 10, 0.14);
  min-width: 0;
}
.hour-row > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hour-row.partial {
  background: rgba(255, 159, 10, 0.14);
}
.hour-row.most {
  background: rgba(120, 120, 128, 0.14);
}
.hour-row.full {
  background: rgba(88, 86, 214, 0.12);
}
.hour-row.night {
  background: rgba(28, 28, 30, 0.08);
  color: var(--label-secondary);
}
.hour {
  font-weight: 600;
}
.alt,
.zone {
  color: var(--label-secondary);
}
.stage {
  font-weight: 500;
  text-align: right;
}
.disclaimer {
  font-size: 11px;
  color: var(--label-secondary);
  margin: 14px 0 0;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .hour-row {
    grid-template-columns: 38px 54px minmax(0, 1fr);
    font-size: 12px;
    padding: 8px 10px;
    gap: 6px;
  }
  .stage {
    grid-column: 1 / -1;
    text-align: left;
    color: var(--label-secondary);
  }
}
</style>
