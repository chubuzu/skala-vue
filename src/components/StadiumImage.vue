<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  stadium: { type: Object, required: true },
  hero: { type: Boolean, default: false }
})

// SVG gradient id가 컴포넌트 인스턴스마다 겹치지 않도록 고유 id 사용
const uid = useId()

// src/assets/stadiums/{구장id}.jpg|png|webp 파일을 넣어두면 자동으로 실제 사진이 표시된다.
// (지금은 파일이 없어 일러스트가 그려지며, 나중에 사진만 떨어뜨리면 코드 수정 없이 교체됨)
const photoModules = import.meta.glob('../assets/stadiums/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default'
})

const photoUrl = computed(() => {
  const match = Object.entries(photoModules).find(([path]) =>
    path.includes(`/${props.stadium.id}.`)
  )
  return match ? match[1] : null
})
</script>

<template>
  <div class="stadium-image" :class="{ hero }">
    <!-- 실제 사진 파일이 있으면 사진을, 없으면 노을 지는 야구장 일러스트를 보여준다 -->
    <img v-if="photoUrl" :src="photoUrl" :alt="stadium.name" />

    <svg
      v-else
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      :aria-label="`${stadium.name} 일러스트`"
    >
      <defs>
        <!-- 노을 하늘 -->
        <linearGradient :id="`${uid}-sky`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2b3a67" />
          <stop offset="45%" stop-color="#8b5a8c" />
          <stop offset="75%" stop-color="#e8825f" />
          <stop offset="100%" stop-color="#f6b26b" />
        </linearGradient>

        <!-- 구단 컬러가 은은하게 깔리는 오버레이 -->
        <linearGradient :id="`${uid}-tint`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" :stop-color="stadium.teamColor" stop-opacity="0.42" />
          <stop offset="100%" :stop-color="stadium.teamColor" stop-opacity="0.08" />
        </linearGradient>

        <!-- 조명탑 불빛 -->
        <radialGradient :id="`${uid}-glow`">
          <stop offset="0%" stop-color="#fff6d5" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#fff6d5" stop-opacity="0" />
        </radialGradient>

        <linearGradient :id="`${uid}-turf`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2f7a43" />
          <stop offset="100%" stop-color="#1f5c31" />
        </linearGradient>
      </defs>

      <!-- 하늘 -->
      <rect width="400" height="220" :fill="`url(#${uid}-sky)`" />
      <circle cx="318" cy="126" r="26" fill="#ffd9a0" opacity="0.85" />
      <rect width="400" height="220" :fill="`url(#${uid}-tint)`" />

      <!-- 원경 스탠드(관중석) 실루엣 -->
      <path d="M0 132 Q200 78 400 132 L400 158 L0 158 Z" fill="#1b2340" opacity="0.92" />
      <g fill="#ffe9a8" opacity="0.35">
        <rect x="24" y="120" width="352" height="3" rx="1.5" />
      </g>

      <!-- 조명탑 -->
      <g>
        <circle cx="64" cy="44" r="34" :fill="`url(#${uid}-glow)`" />
        <circle cx="336" cy="44" r="34" :fill="`url(#${uid}-glow)`" />
        <g fill="#141c33">
          <rect x="61" y="46" width="6" height="88" />
          <rect x="42" y="30" width="44" height="18" rx="3" />
          <rect x="333" y="46" width="6" height="88" />
          <rect x="314" y="30" width="44" height="18" rx="3" />
        </g>
        <g fill="#fff3cf" opacity="0.9">
          <circle cx="52" cy="39" r="3" />
          <circle cx="64" cy="39" r="3" />
          <circle cx="76" cy="39" r="3" />
          <circle cx="324" cy="39" r="3" />
          <circle cx="336" cy="39" r="3" />
          <circle cx="348" cy="39" r="3" />
        </g>
      </g>

      <!-- 외야 펜스 -->
      <path d="M0 156 Q200 130 400 156 L400 166 L0 166 Z" fill="#123a24" />

      <!-- 잔디 -->
      <rect y="160" width="400" height="60" :fill="`url(#${uid}-turf)`" />
      <g opacity="0.14" fill="#ffffff">
        <rect y="160" width="50" height="60" />
        <rect x="100" y="160" width="50" height="60" />
        <rect x="200" y="160" width="50" height="60" />
        <rect x="300" y="160" width="50" height="60" />
      </g>

      <!-- 내야 흙 + 다이아몬드 -->
      <path d="M200 158 L300 205 L200 245 L100 205 Z" fill="#b8763f" />
      <path
        d="M200 166 L292 206 L200 238 L108 206 Z"
        fill="none"
        stroke="#ffffff"
        stroke-width="2"
        opacity="0.85"
      />
      <circle cx="200" cy="203" r="9" fill="#cf8b4d" />
      <g fill="#ffffff" opacity="0.95">
        <rect x="197" y="163" width="6" height="6" rx="1" transform="rotate(45 200 166)" />
        <rect x="289" y="203" width="6" height="6" rx="1" transform="rotate(45 292 206)" />
        <rect x="105" y="203" width="6" height="6" rx="1" transform="rotate(45 108 206)" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.stadium-image {
  width: 100%;
  height: 132px;
  overflow: hidden;
  background: #1b2340;
}
.stadium-image.hero {
  height: 260px;
  border-radius: var(--radius-lg);
}
.stadium-image img,
.stadium-image svg {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
