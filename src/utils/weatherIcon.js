// OpenWeatherMap 아이콘 코드(01d, 10n ...) 또는 한국어 날씨 설명을 이모지로 변환한다.
const ICON_CODE_MAP = {
  '01': '☀️', // clear
  '02': '🌤️', // few clouds
  '03': '⛅', // scattered clouds
  '04': '☁️', // broken clouds
  '09': '🌧️', // shower rain
  10: '🌦️', // rain
  11: '⛈️', // thunderstorm
  13: '❄️', // snow
  50: '🌫️' // mist
}

export function iconCodeToEmoji(iconCode) {
  if (!iconCode) return null
  return ICON_CODE_MAP[iconCode.slice(0, 2)] ?? null
}

export function descriptionToEmoji(description = '') {
  if (description.includes('천둥')) return '⛈️'
  if (description.includes('눈') || description.includes('진눈깨비')) return '❄️'
  if (description.includes('비') || description.includes('소나기')) return '🌧️'
  if (description.includes('안개') || description.includes('연무') || description.includes('박무')) return '🌫️'
  if (description.includes('흐림') || description.includes('뒤덮')) return '☁️'
  if (description.includes('구름')) return '⛅'
  if (description.includes('맑')) return '☀️'
  if (description.includes('돔')) return '🏟️'
  return '🌤️'
}

// 아이콘 코드가 있으면 그것을, 없으면 설명 텍스트로 추론
export function weatherEmoji({ icon, status } = {}) {
  return iconCodeToEmoji(icon) ?? descriptionToEmoji(status ?? '')
}
