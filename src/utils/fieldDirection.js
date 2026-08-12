// 나침반 방위각(북 0°, 시계방향)을 "구장 기준 방향"으로 바꿔주는 유틸.
//
// 기준: stadium.cfBearing = 홈플레이트에서 중견수(센터)를 바라보는 방위각.
// 홈플레이트에 서서 센터를 볼 때,
//   상대각 0°   = 중견수(외야) 쪽
//   상대각 90°  = 우익수(1루) 쪽
//   상대각 180° = 홈플레이트 뒤(백네트) 쪽
//   상대각 270° = 좌익수(3루) 쪽

export const FIELD_ZONES = {
  CENTER: { key: 'center', label: '중견수(외야)', short: '외야' },
  RIGHT: { key: 'right', label: '우익수·1루', short: '1루 측' },
  HOME: { key: 'home', label: '홈플레이트 뒤', short: '홈 뒤' },
  LEFT: { key: 'left', label: '좌익수·3루', short: '3루 측' }
}

// 방위각을 구장 기준 상대각(0~360)으로 변환
export function toFieldRelativeAngle(bearing, cfBearing) {
  return ((bearing - cfBearing) % 360 + 360) % 360
}

// 구장 기준 상대각을 4개 구역으로 분류
export function angleToZone(relativeAngle) {
  if (relativeAngle >= 315 || relativeAngle < 45) return FIELD_ZONES.CENTER
  if (relativeAngle < 135) return FIELD_ZONES.RIGHT
  if (relativeAngle < 225) return FIELD_ZONES.HOME
  return FIELD_ZONES.LEFT
}

// 나침반 방위각 -> 한글 8방위
const COMPASS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']

export function bearingToCompass(bearing) {
  const index = Math.round((((bearing % 360) + 360) % 360) / 45) % 8
  return COMPASS[index]
}

/**
 * 바람이 구장에서 어느 방향으로 부는지 해석한다.
 * @param {number} windDeg OpenWeatherMap의 wind.deg (바람이 '불어오는' 방위각)
 * @param {number} cfBearing 홈플레이트 -> 중견수 방위각
 */
export function analyzeWind(windDeg, cfBearing) {
  // 기상 관측의 풍향은 '불어오는 쪽'이므로 180°를 더해 '불어가는 쪽'으로 바꾼다
  const blowingTo = (windDeg + 180) % 360
  const relative = toFieldRelativeAngle(blowingTo, cfBearing)
  const zone = angleToZone(relative)

  let effect
  if (zone.key === 'center') effect = '외야 방향 (뜬공 비거리 ↑)'
  else if (zone.key === 'home') effect = '홈플레이트 방향 (맞바람, 비거리 ↓)'
  else effect = '옆바람 (크로스윈드)'

  return {
    blowingTo, // 바람이 향하는 방위각
    relative, // 구장 기준 상대각
    zone, // 향하는 구역
    effect, // 타구에 미치는 영향 설명
    fromCompass: bearingToCompass(windDeg) // 바람이 불어오는 8방위
  }
}

// 풍속(m/s)을 체감 표현으로
export function windStrengthLabel(speed) {
  if (speed < 1.6) return '거의 무풍'
  if (speed < 3.4) return '약한 바람'
  if (speed < 5.5) return '산들바람'
  if (speed < 8) return '다소 강함'
  return '강풍'
}
