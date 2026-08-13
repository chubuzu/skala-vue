<script setup>
import { computed } from 'vue'
import ComfortBadge from './ComfortBadge.vue'
import StadiumImage from './StadiumImage.vue'
import { useConfigStore } from '../stores/configStore'
import { useFavoriteStore } from '../stores/favoriteStore'
import { convertTemp } from '../utils/temperature'
import { weatherEmoji } from '../utils/weatherIcon'

const props = defineProps({
  city: { type: Object, required: true },
  // 오늘 이 구장에서 열리는 경기 { home, away } (없으면 null)
  todayGame: { type: Object, default: null }
})

const emit = defineEmits(['select', 'detail'])

const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()

const displayTemp = computed(() => convertTemp(props.city.temp, configStore.unit))
const isFavorite = computed(() => favoriteStore.isFavorite(props.city.id))
const emoji = computed(() => weatherEmoji({ icon: props.city.icon, status: props.city.status }))
</script>

<template>
  <div class="card" @click="emit('select', city)">
    <div class="card-image-wrap">
      <StadiumImage :stadium="city" />
      <span v-if="todayGame" class="today-badge">오늘 경기</span>
      <button class="star-btn" :class="{ on: isFavorite }" @click.stop="favoriteStore.toggleFavorite(city.id)">
        {{ isFavorite ? '★' : '☆' }}
      </button>
    </div>

    <div class="card-body">
      <h3>{{ city.name }}</h3>
      <p class="team">{{ city.teams }}</p>

      <p v-if="todayGame" class="matchup">
        {{ todayGame.away }} <span class="vs">vs</span> {{ todayGame.home }}
      </p>
      <p v-else class="matchup no-game">오늘 경기 없음</p>

      <div class="card-footer">
        <span class="temp">{{ displayTemp }}{{ configStore.unitSymbol }}</span>
        <span class="status">{{ emoji }} {{ city.status }}</span>
      </div>

      <div class="card-bottom">
        <!-- 직관 지수: 기온·강수·바람·습도를 합산한 0~100점.
             오늘 경기가 있으면 경기 시간대 예보로, 없으면 현재 날씨로 계산된 값이 들어온다. -->
        <ComfortBadge
          :weather="city.scoreWeather ?? city"
          :is-dome="Boolean(city.isDome)"
          :basis="city.scoreBasis"
        />
        <!-- 이벤트 수식어 .stop 으로 카드 클릭(버블링) 없이 상세 페이지로 이동 -->
        <button class="detail-btn" @click.stop="emit('detail', city)">상세보기 ›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition:
    transform 0.25s cubic-bezier(0.25, 0.1, 0.25, 1),
    box-shadow 0.25s ease;
}
/* 터치 기기에서는 hover가 '고착'되므로 마우스가 있을 때만 적용 */
@media (hover: hover) {
  .card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
  }
}
.card:active {
  transform: scale(0.988);
}
.card-image-wrap {
  position: relative;
}
.today-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 59, 48, 0.92);
  padding: 4px 10px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
}
.star-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 253, 249, 0.88);
  backdrop-filter: blur(8px);
  color: #ff9f0a;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.star-btn:active {
  transform: scale(0.9);
}
.card-body {
  padding: 16px 18px 18px;
}
/* 카드에서 가장 중요한 정보 = 구장 이름. 가장 굵고 크게. */
.card-body h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 3px;
  letter-spacing: -0.45px;
}
/* 구단명은 보조 정보라 톤다운 */
.team {
  font-size: 13px;
  font-weight: 500;
  color: var(--label-secondary);
  margin: 0 0 10px;
}
.matchup {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 14px;
  padding: 7px 10px;
  background: var(--surface-muted);
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.matchup .vs {
  color: var(--label-secondary);
  font-weight: 400;
  margin: 0 2px;
}
.matchup.no-game {
  font-weight: 400;
  color: var(--label-secondary);
  background: transparent;
  padding: 7px 0;
}
.card-footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
/* 온도는 숫자 크기로 존재감을 주고 굵기는 낮춰 애플풍의 가벼운 인상 유지 */
.temp {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -1.4px;
  /* 숫자 폭을 고정해 카드마다 정렬이 흔들리지 않게 */
  font-variant-numeric: tabular-nums;
}
.status {
  font-size: 13px;
  font-weight: 500;
  color: var(--label-secondary);
  text-align: right;
}
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.detail-btn {
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
  white-space: nowrap;
}
@media (hover: hover) {
  .detail-btn:hover {
    opacity: 0.7;
  }
}
</style>
