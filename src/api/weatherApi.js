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
    precipitationChance: Math.round((item.pop ?? 0) * 100)
  }))
}

// 5일 예보를 '날짜별 요약'으로 묶어서 반환 (날짜 칩에 날씨 아이콘을 붙이는 용도)
// { '2026-08-11': { icon, status, maxTemp, minTemp, precipitationChance }, ... }
export async function fetchDailySummary(lat, lon) {
  if (!hasApiKey()) {
    throw new Error('OpenWeatherMap API 키가 설정되지 않았습니다. (.env 확인)')
  }

  const { data } = await client.get('/forecast', {
    params: { lat, lon, appid: API_KEY, units: 'metric', lang: 'kr' }
  })

  const byDate = {}

  data.list.forEach((item) => {
    const [date, time] = item.dt_txt.split(' ')
    const temp = Math.round(item.main.temp)

    if (!byDate[date]) {
      byDate[date] = {
        icon: item.weather[0].icon,
        status: item.weather[0].description,
        maxTemp: temp,
        minTemp: temp,
        precipitationChance: Math.round((item.pop ?? 0) * 100)
      }
    } else {
      const day = byDate[date]
      day.maxTemp = Math.max(day.maxTemp, temp)
      day.minTemp = Math.min(day.minTemp, temp)
      day.precipitationChance = Math.max(day.precipitationChance, Math.round((item.pop ?? 0) * 100))
    }

    // 그날을 대표하는 아이콘은 낮 12~15시 값을 우선 사용
    if (time.startsWith('12') || time.startsWith('15')) {
      byDate[date].icon = item.weather[0].icon
      byDate[date].status = item.weather[0].description
    }
  })

  return byDate
}
