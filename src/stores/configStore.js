import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 날씨 단위(섭씨/화씨) 설정을 앱 전체에서 공유하는 Store
export const useConfigStore = defineStore('config', () => {
  // state: 단위를 저장하는 변수 (초기값: celsius)
  const unit = ref('celsius')

  // getters: 현재 단위 상태에 맞는 기호 (℃ / ℉)
  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))

  // actions: 'celsius'와 'fahrenheit'를 토글(스위칭)하는 함수
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  return { unit, unitSymbol, toggleUnit }
})
