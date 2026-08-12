// 단위 변환 유틸: configStore의 unit 설정에 따라 섭씨 원본 값을 변환한다.
export function convertTemp(tempCelsius, unit) {
  if (unit === 'fahrenheit') {
    return Math.round((tempCelsius * 9) / 5 + 32)
  }
  return Math.round(tempCelsius)
}
