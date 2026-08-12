// ⚾ KBO 경기 일정 API
//
// KBO는 공식 무료 공개 API를 제공하지 않고, 홈페이지(koreabaseball.com)는 브라우저 CORS 정책 때문에
// 프론트엔드에서 직접 호출할 수 없습니다. 그래서 KBO 공식 홈페이지 캘린더를 직접 보고 옮겨 적은
// 8~9월 실제 일정(src/data/kboSchedule2026.local.js, git에는 미포함)을 사용합니다.
// 나중에 진짜 API가 생기면 이 파일 내부 구현만 axios 호출로 교체하면 됩니다. (호출부 코드는 안 바뀜)
//
// 라인업/선발투수는 신뢰할 수 있는 데이터 출처가 없어 제공하지 않습니다.

// import.meta.glob을 쓰는 이유: kboSchedule2026.local.js는 .gitignore 처리된 파일이라
// 클론 직후에는 없을 수도 있음. glob은 매칭되는 파일이 없어도 빌드 에러 없이 빈 객체를 반환한다.
const localScheduleModules = import.meta.glob('../data/kboSchedule2026.local.js', { eager: true })
const localScheduleModule = Object.values(localScheduleModules)[0] ?? null
const SCHEDULE = localScheduleModule?.default ?? null

// 보유한 일정 데이터의 범위 (달력에서 선택 가능한 날짜를 제한하는 데도 사용)
export const SCHEDULE_RANGE = localScheduleModule?.KNOWN_RANGE ?? null

export function isWithinScheduleRange(dateStr) {
  if (!SCHEDULE_RANGE) return false
  return dateStr >= SCHEDULE_RANGE.start && dateStr <= SCHEDULE_RANGE.end
}

// YYYY-MM-DD 형태의 오늘 날짜 (로컬 타임존 기준)
export function getTodayString() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

// 경기가 있는 전체 날짜 목록 (오름차순)
export function getScheduleDates() {
  if (!SCHEDULE) return []
  return Object.keys(SCHEDULE).sort()
}

// 특정 날짜에 경기가 열리는 구장 id 목록 (동기 조회)
export function getStadiumIdsWithGameOn(dateStr) {
  if (!SCHEDULE || !SCHEDULE[dateStr]) return []
  return SCHEDULE[dateStr].map((game) => game.stadiumId)
}

// 특정 날짜의 경기를 { 구장id: { home, away } } 형태로 반환 (동기 조회)
export function getGameMapOn(dateStr) {
  if (!SCHEDULE || !SCHEDULE[dateStr]) return {}
  return Object.fromEntries(
    SCHEDULE[dateStr].map((game) => [game.stadiumId, { home: game.home, away: game.away }])
  )
}

// 특정 구장에서 홈경기가 열리는 날짜 목록 (오름차순)
export function getStadiumGameDates(stadiumId) {
  if (!SCHEDULE) return []
  return Object.keys(SCHEDULE)
    .filter((date) => SCHEDULE[date].some((game) => game.stadiumId === stadiumId))
    .sort()
}

// 특정 날짜에 열리는 전체 경기 목록을 반환합니다.
export function fetchGamesByDate(dateStr) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!isWithinScheduleRange(dateStr)) {
        resolve({ outOfRange: true, games: [] })
        return
      }

      const games = (SCHEDULE?.[dateStr] ?? []).map((game) => ({
        date: dateStr,
        homeTeam: game.home,
        awayTeam: game.away,
        stadiumId: game.stadiumId,
        startTime: '18:30'
      }))

      resolve({ outOfRange: false, games })
    }, 150)
  })
}

// 특정 구장 + 특정 날짜의 경기 하나를 반환합니다.
// 경기가 없으면 null, 보유 범위 밖이면 { outOfRange: true }를 반환합니다.
export function fetchGameByStadiumAndDate(stadium, dateStr) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!isWithinScheduleRange(dateStr)) {
        resolve({ outOfRange: true })
        return
      }

      const matchup = (SCHEDULE?.[dateStr] ?? []).find((game) => game.stadiumId === stadium.id)

      if (!matchup) {
        resolve(null)
        return
      }

      resolve({
        date: dateStr,
        stadium: stadium.name,
        homeTeam: matchup.home,
        awayTeam: matchup.away,
        startTime: '18:30'
      })
    }, 150)
  })
}
