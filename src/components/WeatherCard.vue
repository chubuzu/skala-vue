<script setup>
import { computed } from 'vue'
import TempBadge from './TempBadge.vue'
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
        <TempBadge :raw-temp="city.temp" :display-temp="displayTemp" :unit-symbol="configStore.unitSymbol" />
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
    transform 0.25s ease,
    box-shadow 0.25s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06), 0 16px 32px rgba(0, 0, 0, 0.1);
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
  background: rgba(255, 255, 255, 0.85);
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
.card-body h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 3px;
  letter-spacing: -0.3px;
}
.team {
  font-size: 13px;
  color: var(--label-secondary);
  margin: 0 0 10px;
}
.matchup {
  font-size: 13px;
  font-weight: 600;
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
.temp {
  font-size: 30px;
  font-weight: 300;
  letter-spacing: -1px;
}
.status {
  font-size: 13px;
  color: var(--label-secondary);
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
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
}
.detail-btn:hover {
  opacity: 0.7;
}
</style>
