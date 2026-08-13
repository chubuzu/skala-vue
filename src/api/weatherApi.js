// Axios 실습: OpenWeatherMap API 연동
// API 키는 .env 파일의 VITE_OPENWEATHER_API_KEY 로 관리합니다 (Git에 올라가지 않도록 .gitignore 처리됨).
import axios from 'axios'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY

const client = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 6000
})

export function hasApiKey() {
  return Boolean(API_KEY)
}

// 요구사항 1: OpenWeatherMap Current Weather API로 실제 날씨 가져오기
export async function fetchCurrentWeather(lat, lon) {
  if (!hasApiKey()) {
    throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다. (.env 확인)')
  }

  const { data } = await client.get('/weather', {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: 'metric',
      lang: 'kr'
    }
  })

  return {
    temp: Math.round(data.main.temp),
    status: data.weather[0].description,
    humidity: data.main.humidity,
    icon: data.weather[0].icon,
    // 바람: speed(m/s), deg는 '바람이 불어오는' 방위각
    windSpeed: data.wind?.speed ?? null,
    windDeg: data.wind?.deg ?? null,
    // 일출/일몰 (UNIX 초)
    sunrise: data.sys?.sunrise ?? null,
    sunset: data.sys?.sunset ?? null
  }
}

// 요구사항 2: OpenWeatherMap에서 제공하는 다른 API(5일/3시간 예보) 추가 활용
export async function fetchForecast(lat, lon) {
  if (!hasApiKey()) {
    throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다. (.env 확인)')
  }

  const { data } = await client.get('/forecast', {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: 'metric',
      lang: 'kr'
    }
  })

  // 3시간 간격 데이터 중 앞으로 24시간(8개)만 추려서 반환
  return data.list.slice(0, 8).map((item) => ({
    time: item.dt_txt,
    temp: Math.round(item.main.temp),
    status: item.weather[0].description,
    icon: item.weather[0].icon,
    // pop(Probability of Precipitation)은 0~1 사이 값이라 %로 변환
    precipitationChance: Math.round((item.pop ?? 0) * 100),
    // 직관 지수 계산에 필요 (경기 시간대 블록을 골라 쓸 때 사용)
    humidity: item.main.humidity ?? null,
    windSpeed: item.wind?.speed ?? null
  }))
}

// KBO 경기는 대부분 18시대에 시작한다.
// 낮 최고기온으로 직관 지수를 매기면 실제 관람 환경보다 훨씬 나쁘게 나오므로,
// 예보 목록에서 '해당 날짜의 경기 시간대에 가장 가까운 블록'을 골라 쓴다.
export const GAME_HOUR = 18

/**
 * fetchForecast()가 돌려준 목록에서 지정한 날짜의 경기 시간대 예보를 고른다.
 * @param {Array} forecastList - fetchForecast() 결과
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {{temp, humidity, windSpeed, precipitationChance}|null} 해당 날짜 예보가 없으면 null
 */
export function pickGameTimeForecast(forecastList, dateStr) {
  if (!Array.isArray(forecastList) || !dateStr) return null

  let best = null
  let bestGap = Infinity

  forecastList.forEach((item) => {
    const [date, time] = String(item.time ?? '').split(' ')
    if (date !== dateStr) return

    const gap = Math.abs(Number(time.slice(0, 2)) - GAME_HOUR)
    // 18시가 없어 15시·21시가 같은 차이로 비기면 뒤쪽(경기 후반에 가까운 쪽)을 택한다
    if (gap <= bestGap) {
      bestGap = gap
      best = {
        temp: item.temp,
        humidity: item.humidity ?? null,
        windSpeed: item.windSpeed ?? null,
        precipitationChance: item.precipitationChance
      }
    }
  })

  return best
}

// 5일 예보를 '날짜별 요약'으로 묶어서 반환 (날짜 칩, 직관 지수 계산용)
// {
//   '2026-08-11': {
//     icon, status, maxTemp, minTemp, precipitationChance,   // 하루 전체 기준
//     evening: { temp, humidity, windSpeed, precipitationChance } | null  // 경기 시간대(18시) 기준
//   }, ...
// }
//
// KBO 경기는 대부분 저녁에 열리므로, 낮 최고기온으로 직관 지수를 매기면 실제보다 나쁘게 나온다.
// 그래서 18시에 가장 가까운 3시간 블록을 따로 뽑아 evening에 담는다.
export async function fetchDailySummary(lat, lon) {
  if (!hasApiKey()) {
    throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다. (.env 확인)')
  }

  const { data } = await client.get('/forecast', {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'kr' }
  })

  const byDate = {}
  // 날짜별로 '18시에 가장 가까운 블록'을 찾기 위한 시간 차이 기록
  const eveningGap = {}
  const GAME_HOUR = 18

  data.list.forEach((item) => {
    const [date, time] = item.dt_txt.split(' ')
    const hour = Number(time.slice(0, 2))
    const temp = Math.round(item.main.temp)
    const pop = Math.round((item.pop ?? 0) * 100)

    if (!byDate[date]) {
      byDate[date] = {
        icon: item.weather[0].icon,
        status: item.weather[0].description,
        maxTemp: temp,
        minTemp: temp,
        precipitationChance: pop,
        evening: null
      }
    } else {
      const day = byDate[date]
      day.maxTemp = Math.max(day.maxTemp, temp)
      day.minTemp = Math.min(day.minTemp, temp)
      day.precipitationChance = Math.max(day.precipitationChance, pop)
    }

    // 그날을 대표하는 아이콘은 낮 12~15시 값을 우선 사용
    if (time.startsWith('12') || time.startsWith('15')) {
      byDate[date].icon = item.weather[0].icon
      byDate[date].status = item.weather[0].description
    }

    // 경기 시간대(18시)에 가장 가까운 블록 갱신
    // 18시 블록이 없어 15시·21시가 똑같이 3시간 차이로 비길 때는 뒤쪽(21시)을 택한다.
    // 경기는 18:30에 시작해 21시대까지 이어지므로 늦은 쪽이 실제 관람 환경에 가깝다.
    const gap = Math.abs(hour - GAME_HOUR)
    if (eveningGap[date] === undefined || gap <= eveningGap[date]) {
      eveningGap[date] = gap
      byDate[date].evening = {
        temp,
        humidity: item.main.humidity ?? null,
        windSpeed: item.wind?.speed ?? null,
        precipitationChance: pop
      }
    }
  })

  return byDate
}
