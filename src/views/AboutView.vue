<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="about">
    <header class="page-head">
      <h1>야구장 날씨에 대하여</h1>
      <p class="subtitle">
        KBO 리그 10개 구단의 홈구장(9개) 날씨와 경기 일정을 한눈에 확인하는 서비스입니다.
      </p>
    </header>

    <div class="card">
      <dl>
        <dt>날씨 데이터</dt>
        <dd>OpenWeatherMap Current Weather / 5-day Forecast API</dd>

        <dt>경기 일정</dt>
        <dd>KBO 공식 캘린더의 2026년 8~9월 일정 (공식 무료 API 부재로 직접 정리)</dd>

        <dt>기술 스택</dt>
        <dd>Vue 3 Composition API · Vue Router · Pinia · Axios · Element Plus</dd>
      </dl>
    </div>

    <RouterLink to="/" class="home-link">홈으로 돌아가기 ›</RouterLink>
  </div>
</template>

<style scoped>
.card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 8px 26px 20px;
  box-shadow: var(--shadow-card);
  margin-bottom: 20px;
}
dl {
  margin: 0;
}
dt {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--label-secondary);
  margin-top: 20px;
}
dd {
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 1.6;
}
.home-link {
  font-size: 14px;
}
</style>
