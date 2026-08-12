// 태양의 고도(altitude)와 방위각(azimuth)을 계산하는 유틸.
// NOAA 약식 알고리즘 기반이며 오차는 1° 이내 수준으로, 그늘 예측 용도로는 충분합니다.
// 별도 API 호출 없이 위경도와 시각만으로 계산합니다.

const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

/**
 * @param {Date} date 계산할 시각
 * @param {number} lat 위도
 * @param {number} lon 경도
 * @returns {{ altitude: number, azimuth: number }}
 *   altitude: 지평선 기준 고도(°, 음수면 일몰 후)
 *   azimuth: 북쪽 0°에서 시계방향으로 잰 방위각(동 90°, 남 180°, 서 270°)
 */
export function getSunPosition(date, lat, lon) {
  const julianDay = date.getTime() / 86400000 + 2440587.5
  const n = julianDay - 2451545.0

  // 태양의 평균 황경 / 평균 근점이각
  const meanLongitude = (((280.46 + 0.9856474 * n) % 360) + 360) % 360
  const meanAnomaly = (((357.528 + 0.9856003 * n) % 360) + 360) % 360

  // 황경 보정 및 황도 경사각
  const eclipticLongitude =
    meanLongitude + 1.915 * Math.sin(toRad(meanAnomaly)) + 0.02 * Math.sin(toRad(2 * meanAnomaly))
  const obliquity = 23.439 - 0.0000004 * n

  // 적경 / 적위
  const rightAscension = toDeg(
    Math.atan2(
      Math.cos(toRad(obliquity)) * Math.sin(toRad(eclipticLongitude)),
      Math.cos(toRad(eclipticLongitude))
    )
  )
  const declination = toDeg(
    Math.asin(Math.sin(toRad(obliquity)) * Math.sin(toRad(eclipticLongitude)))
  )

  // 그리니치 항성시 -> 지방 항성시 -> 시간각
  const gmst = (((18.697374558 + 24.06570982441908 * n) % 24) + 24) % 24
  const localSiderealTime = (gmst * 15 + lon) % 360
  let hourAngle = localSiderealTime - rightAscension
  hourAngle = ((hourAngle + 540) % 360) - 180

  const latRad = toRad(lat)
  const decRad = toRad(declination)
  const haRad = toRad(hourAngle)

  const altitude = toDeg(
    Math.asin(
      Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)
    )
  )

  let azimuth = toDeg(
    Math.atan2(
      -Math.sin(haRad),
      Math.tan(decRad) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(haRad)
    )
  )
  azimuth = (azimuth + 360) % 360

  return { altitude, azimuth }
}

// 관중석 상단 높이를 약 25m로 가정했을 때의 그림자 길이(m).
// 고도가 낮을수록 그림자가 길어지며, 대략 100m를 넘으면 그라운드 대부분이 그늘에 들어갑니다.
const STAND_HEIGHT_M = 25

export function shadowLength(altitudeDeg) {
  if (altitudeDeg <= 0.5) return Infinity
  return STAND_HEIGHT_M / Math.tan(toRad(altitudeDeg))
}

// 그림자가 그라운드를 얼마나 덮었는지 단계로 표현 (내야 반경 약 100m 기준)
export function shadeStage(altitudeDeg) {
  if (altitudeDeg <= 0) return { level: 'night', label: '일몰 후 · 조명 경기' }

  const length = shadowLength(altitudeDeg)
  if (length >= 110) return { level: 'full', label: '경기장 대부분 그늘' }
  if (length >= 60) return { level: 'most', label: '내야까지 그늘' }
  if (length >= 30) return { level: 'partial', label: '관중석 앞줄까지 그늘' }
  return { level: 'sunny', label: '대부분 햇빛' }
}
