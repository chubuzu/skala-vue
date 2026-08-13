// 직관 지수 — "이 구장에서 야구 보기 좋은가?"를 0~100점으로 환산한다.
//
// 기존 TempBadge는 기온만 보고 더움/적당함/선선함 3단계로 나눴는데,
// 여름 KBO 경기는 대부분 28℃를 넘어 사실상 '더움' 하나만 계속 표시되는 문제가 있었다.
// 그래서 기온·강수확률·바람·습도를 함께 보고 감점 방식으로 점수를 매긴다.
//
// 점수 체계: 100점에서 시작해 불쾌 요소마다 감점한다.
// 기준값은 '여름 저녁 경기'를 기본 상황으로 두고 잡았다.

// 야구 관람에 가장 쾌적한 기온 구간
const IDEAL_TEMP_MIN = 18
const IDEAL_TEMP_MAX = 24

// ─────────────────────────────────────────────
// 1. 기온 감점
// ─────────────────────────────────────────────
export function tempPenalty(temp) {
  if (temp == null) return 0

  // 더울 때: 24℃ 초과 1℃마다 5.5점 (최대 60점)
  //   28℃ → 22점 / 32℃ → 44점 / 35℃ 이상 → 60점
  if (temp > IDEAL_TEMP_MAX) {
    return Math.min(60, (temp - IDEAL_TEMP_MAX) * 5.5)
  }

  // 추울 때: 18℃ 미만 1℃마다 4.5점 (최대 55점)
  //   13℃ → 22.5점 / 10℃ → 36점 / 6℃ 이하 → 55점
  if (temp < IDEAL_TEMP_MIN) {
    return Math.min(55, (IDEAL_TEMP_MIN - temp) * 4.5)
  }

  return 0
}

// ─────────────────────────────────────────────
// 2. 강수 감점 — 야외 경기에서 가장 치명적 (우천 취소 위험)
// ─────────────────────────────────────────────
export function rainPenalty(precipitationChance) {
  if (precipitationChance == null) return 0

  const base = (precipitationChance / 100) * 52
  // 70% 이상은 '취소 가능성'이 실질적으로 생기는 구간이라 추가 감점
  const cancelRisk = precipitationChance >= 70 ? 8 : 0

  return base + cancelRisk
}

// ─────────────────────────────────────────────
// 3. 바람 감점 — 같은 바람도 더울 땐 반갑고 추울 땐 괴롭다
// ─────────────────────────────────────────────
export function windPenalty(windSpeed, temp) {
  if (windSpeed == null) return 0

  if (windSpeed >= 9) return 15 // 강풍: 타구 궤적·체감 모두 방해
  if (windSpeed >= 6) return 7 // 다소 강함

  if (windSpeed >= 2) {
    if (temp != null && temp >= 26) return -4 // 더울 때 산들바람은 가점
    if (temp != null && temp <= 15) return 5 // 추울 때는 체감온도를 더 떨어뜨림
  }

  return 0
}

// ─────────────────────────────────────────────
// 4. 습도 감점 — 더울 때만 반영 (여름 불쾌지수)
// ─────────────────────────────────────────────
export function humidityPenalty(humidity, temp) {
  if (humidity == null || temp == null) return 0
  if (temp < 26 || humidity < 70) return 0

  // 26℃ 이상 + 습도 70% 초과 구간에서 1%마다 0.3점 (최대 9점)
  return Math.min(9, (humidity - 70) * 0.3)
}

/**
 * 직관 지수를 계산한다.
 * @param {object} weather - { temp, precipitationChance, windSpeed, humidity }
 * @param {object} [options]
 * @param {boolean} [options.isDome] - 돔구장이면 날씨 영향을 받지 않는다
 * @returns {{ score: number|null, level: string, label: string, reasons: string[], isDome: boolean }}
 */
export function comfortScore(weather = {}, options = {}) {
  const { temp = null, precipitationChance = null, windSpeed = null, humidity = null } = weather
  const isDome = Boolean(options.isDome)

  // 돔구장은 날씨와 무관하게 항상 쾌적하다
  if (isDome) {
    return {
      score: 100,
      level: 'dome',
      label: '돔구장',
      reasons: ['실내 돔구장이라 날씨 영향 없음'],
      isDome: true
    }
  }

  // 기온조차 없으면 점수를 만들지 않는다 (없는 정보를 그럴듯하게 지어내지 않기 위함)
  if (temp == null) {
    return { score: null, level: 'unknown', label: '정보 없음', reasons: [], isDome: false }
  }

  const penalties = [
    {
      value: tempPenalty(temp),
      reason: temp > IDEAL_TEMP_MAX ? `기온 ${temp}℃로 더움` : `기온 ${temp}℃로 쌀쌀함`
    },
    { value: rainPenalty(precipitationChance), reason: `강수확률 ${precipitationChance}%` },
    { value: windPenalty(windSpeed, temp), reason: `바람 ${windSpeed}m/s` },
    { value: humidityPenalty(humidity, temp), reason: `습도 ${humidity}%로 높음` }
  ]

  const total = penalties.reduce((sum, p) => sum + p.value, 0)
  const score = Math.max(0, Math.min(100, Math.round(100 - total)))

  // 실제로 5점 이상 깎은 항목만 사유로 노출 (가점이나 미미한 감점은 제외)
  const reasons = penalties.filter((p) => p.value >= 5).map((p) => p.reason)

  return { score, ...scoreLevel(score), reasons, isDome: false }
}

// 점수 → 등급/문구
export function scoreLevel(score) {
  if (score == null) return { level: 'unknown', label: '정보 없음' }
  if (score >= 80) return { level: 'great', label: '최고' }
  if (score >= 65) return { level: 'good', label: '좋음' }
  if (score >= 45) return { level: 'fair', label: '보통' }
  if (score >= 25) return { level: 'poor', label: '아쉬움' }
  return { level: 'bad', label: '비추천' }
}

// 등급별 색상 (배지 배경/글자색)
export const LEVEL_COLORS = {
  great: { bg: '#e7f7ed', fg: '#1a7f43' },
  good: { bg: '#eaf4fd', fg: '#1667b8' },
  fair: { bg: '#fdf4e3', fg: '#a8761a' },
  poor: { bg: '#fdefe8', fg: '#c1531c' },
  bad: { bg: '#fdecec', fg: '#c22f2f' },
  dome: { bg: '#f0eefc', fg: '#5b4bc4' },
  unknown: { bg: '#f2f2f7', fg: '#8e8e93' }
}
