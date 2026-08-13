<script setup>
// 검색박스 · 리스트박스 · 상세 패널의 공통 디자인(배경/라운드/그림자/여백)을 한곳에 모은 컴포넌트.
// 내용물은 <slot>으로 부모가 주입하므로, 이 컴포넌트는 '레이아웃'만 책임진다.
defineProps({
  title: { type: String, default: '' },
  // 본문 좌우 여백을 없애고 싶을 때 (표처럼 가장자리까지 채우는 콘텐츠용)
  flush: { type: Boolean, default: false }
})
</script>

<template>
  <section class="dashboard-card" :class="{ flush }">
    <!-- Named Slot: 제목 영역. 부모가 title prop 대신 마크업을 직접 넣을 수도 있다 -->
    <header v-if="title || $slots.header || $slots.actions" class="card-head">
      <slot name="header">
        <h2 class="card-title">{{ title }}</h2>
      </slot>

      <!-- Named Slot: 우측 액션 영역 (버튼, 토글 등) -->
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions" />
      </div>
    </header>

    <!-- Default Slot: 카드 본문. 부모가 아무것도 안 넣으면 아래 문구가 기본값이 된다 -->
    <div class="card-body">
      <slot>
        <p class="placeholder">표시할 내용이 없습니다.</p>
      </slot>
    </div>

    <!-- Named Slot: 하단 영역 (페이지네이션 등). 넘어온 내용이 있을 때만 렌더링 -->
    <footer v-if="$slots.footer" class="card-foot">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.dashboard-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-card);
  max-width: 100%;
  overflow: hidden;
}
.dashboard-card.flush {
  padding: 22px 0 8px;
}
.dashboard-card.flush .card-head,
.dashboard-card.flush .card-foot {
  padding: 0 24px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  min-width: 0;
}
/* 카드 제목: 본문보다 작지만 굵고 자간을 벌려 '섹션 라벨' 느낌 */
.card-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--label-tertiary);
  margin: 0;
}
.card-actions {
  flex-shrink: 0;
}
.card-body {
  min-width: 0;
}
.placeholder {
  font-size: 14px;
  color: var(--label-secondary);
  margin: 0;
}
.card-foot {
  margin-top: 18px;
}

@media (max-width: 640px) {
  .dashboard-card {
    padding: 18px 16px;
  }
  .dashboard-card.flush {
    padding: 18px 0 6px;
  }
  .dashboard-card.flush .card-head,
  .dashboard-card.flush .card-foot {
    padding: 0 16px;
  }
}
</style>
