// 구장의 cfBearing(홈플레이트 -> 중견수 방위각)을 계산하는 도우미 스크립트.
//
// 사용법:
//   1. 구글맵(위성뷰)에서 홈플레이트를 우클릭 -> 맨 위에 뜨는 좌표를 클릭하면 복사됩니다.
//   2. 같은 방법으로 중견수 담장 중앙의 좌표도 복사합니다.
//   3. 아래처럼 실행하면 방위각이 출력됩니다.
//
//      node scripts/bearing.mjs 37.51213,127.07186 37.51380,127.07260
//                               └ 홈플레이트         └ 중견수 담장
//
//   4. 출력된 숫자를 src/data/stadiums.js의 해당 구장 cfBearing 값에 넣으세요.

const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

function bearing(lat1, lon1, lat2, lon2) {
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lon2 - lon1)

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

const COMPASS = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
                 '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서']

function compass(deg) {
  return COMPASS[Math.round(deg / 22.5) % 16]
}

const [home, center] = process.argv.slice(2)

if (!home || !center) {
  console.error('사용법: node scripts/bearing.mjs <홈플레이트 위도,경도> <중견수 위도,경도>')
  console.error('예시:   node scripts/bearing.mjs 37.51213,127.07186 37.51380,127.07260')
  process.exit(1)
}

const [lat1, lon1] = home.split(',').map(Number)
const [lat2, lon2] = center.split(',').map(Number)

const result = bearing(lat1, lon1, lat2, lon2)

console.log(`\n  cfBearing: ${Math.round(result)}   // ${compass(result)} 방향\n`)
