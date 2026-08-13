<script setup>
import { RouterLink } from 'vue-router'
import { stadiums } from '../data/stadiums'
</script>

<template>
  <div class="stadiums-view">
    <header class="page-head">
      <h1>야구장 위치</h1>
      <p class="subtitle">KBO 10개 구단의 홈구장 9곳과 주소를 한눈에 확인하세요.</p>
    </header>

    <div class="table-card">
      <el-table :data="stadiums" style="width: 100%">
        <el-table-column prop="teams" label="구단" min-width="170" />
        <el-table-column label="홈구장" min-width="160">
          <!-- Scoped Slot: el-table이 넘겨주는 row로 구장명을 강조 표시 -->
          <template #default="{ row }">
            <span class="stadium-name">{{ row.name }}</span>
            <span v-if="row.isDome" class="dome-tag">돔</span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="주소" min-width="220" />
        <el-table-column prop="region" label="지역" width="90" />
        <el-table-column label="" width="120" align="right">
          <template #default="{ row }">
            <RouterLink :to="`/stadium/${row.id}`">
              <el-button size="small">상세보기</el-button>
            </RouterLink>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 8px 16px;
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

/* 표에서 가장 중요한 정보(구장명)만 굵게 */
.stadium-name {
  font-weight: 600;
  color: var(--label);
}
.dome-tag {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--label-secondary);
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .table-card {
    padding: 8px 10px;
  }
}
</style>
