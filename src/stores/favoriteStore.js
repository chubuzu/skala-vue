import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 본인만의 추가 Store: 즐겨찾기(favorite) 구장 관리
export const useFavoriteStore = defineStore('favorite', () => {
  // state: 즐겨찾기한 구장 id 목록
  const favoriteIds = ref([])

  // getters: 즐겨찾기 개수
  const favoriteCount = computed(() => favoriteIds.value.length)

  // getters: 특정 구장이 즐겨찾기 상태인지 확인하는 함수형 getter
  const isFavorite = computed(() => (stadiumId) => favoriteIds.value.includes(stadiumId))

  // actions: 즐겨찾기 토글
  function toggleFavorite(stadiumId) {
    if (favoriteIds.value.includes(stadiumId)) {
      favoriteIds.value = favoriteIds.value.filter((id) => id !== stadiumId)
    } else {
      favoriteIds.value = [...favoriteIds.value, stadiumId]
    }
  }

  return { favoriteIds, favoriteCount, isFavorite, toggleFavorite }
})
