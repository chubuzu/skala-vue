// ⚾ KBO 10개 구단 홈구장 데이터 (잠실은 두산 베어스 · LG 트윈스가 공동 사용하므로 구장 기준 9개)
//
// - lat/lon      : OpenWeatherMap 날씨 조회에 사용
// - mockTemp/Status : API 키가 없거나 통신 실패 시 사용하는 대체(fallback) 값
// - cfBearing    : 홈플레이트에서 중견수를 바라보는 방위각(북 0°, 시계방향).
//                  바람 방향 해석과 그늘 예측의 기준. 한국 구장은 대부분 남향이라 165~195° 범위입니다.
//                  '실측'은 구글맵 좌표로 계산한 값이고, '추정'은 아직 측정하지 않은 평균값입니다.
//                  측정 방법: node scripts/bearing.mjs <홈플레이트 위경도> <중견수 위경도>
// - isDome       : 돔구장 여부 (바람/그늘 계산에서 제외)
export const stadiums = [
  {
    id: 'stadium_01',
    name: '잠실야구장',
    teams: '두산 베어스 · LG 트윈스',
    region: '서울',
    lat: 37.5121,
    lon: 127.0719,
    mockTemp: 29,
    mockStatus: '맑음',
    teamColor: '#131230',
    address: '서울 송파구 올림픽로 25',
    cfBearing: 193, // 실측
    isDome: false
  },
  {
    id: 'stadium_02',
    name: '고척스카이돔',
    teams: '키움 히어로즈',
    region: '서울',
    lat: 37.4982,
    lon: 126.8672,
    mockTemp: 26,
    mockStatus: '돔구장',
    teamColor: '#570514',
    address: '서울 구로구 경인로 430',
    cfBearing: 175, // 추정·돔구장이라 영향 없음
    isDome: true
  },
  {
    id: 'stadium_03',
    name: '수원 케이티위즈파크',
    teams: 'kt wiz',
    region: '수원',
    lat: 37.2997,
    lon: 127.0096,
    mockTemp: 28,
    mockStatus: '맑음',
    teamColor: '#000000',
    address: '경기 수원시 장안구 경수대로 893',
    cfBearing: 166, // 실측
    isDome: false
  },
  {
    id: 'stadium_04',
    name: '인천SSG랜더스필드',
    teams: 'SSG 랜더스',
    region: '인천',
    lat: 37.4364,
    lon: 126.6931,
    mockTemp: 27,
    mockStatus: '흐림',
    teamColor: '#CE0E2D',
    address: '인천 미추홀구 매소홀로 618',
    cfBearing: 175, // 실측
    isDome: false
  },
  {
    id: 'stadium_05',
    name: '대전 한화생명볼파크',
    teams: '한화 이글스',
    region: '대전',
    lat: 36.317,
    lon: 127.4288,
    mockTemp: 30,
    mockStatus: '맑음',
    teamColor: '#FF6600',
    address: '대전 중구 대종로 373',
    cfBearing: 168, // 실측
    isDome: false
  },
  {
    id: 'stadium_06',
    name: '창원NC파크',
    teams: 'NC 다이노스',
    region: '창원',
    lat: 35.2225,
    lon: 128.5822,
    mockTemp: 31,
    mockStatus: '맑음',
    teamColor: '#315288',
    address: '경남 창원시 마산회원구 삼호로 63',
    cfBearing: 131, // 실측
    isDome: false
  },
  {
    id: 'stadium_07',
    name: '대구삼성라이온즈파크',
    teams: '삼성 라이온즈',
    region: '대구',
    lat: 35.8412,
    lon: 128.6817,
    mockTemp: 32,
    mockStatus: '맑음',
    teamColor: '#074CA1',
    address: '대구 수성구 야구전설로 1',
    cfBearing: 54, // 실측
    isDome: false
  },
  {
    id: 'stadium_08',
    name: '사직야구장',
    teams: '롯데 자이언츠',
    region: '부산',
    lat: 35.194,
    lon: 129.0615,
    mockTemp: 29,
    mockStatus: '흐림',
    teamColor: '#041E42',
    address: '부산 동래구 사직로 45',
    cfBearing: 168, // 실측
    isDome: false
  },
  {
    id: 'stadium_09',
    name: '광주-기아 챔피언스필드',
    teams: 'KIA 타이거즈',
    region: '광주',
    lat: 35.1682,
    lon: 126.8891,
    mockTemp: 28,
    mockStatus: '구름',
    teamColor: '#EA0029',
    address: '광주 북구 서림로 10',
    cfBearing: 56, // 실측
    isDome: false
  }
]

export function findStadiumById(stadiumId) {
  return stadiums.find((stadium) => stadium.id === stadiumId) || null
}
