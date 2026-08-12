<script setup>
import { RouterLink } from 'vue-router'
import { stadiums } from '../data/stadiums'
</script>

<template>
  <div class="teams-view">
    <header class="page-head">
      <h1>구단 목록</h1>
      <p class="subtitle">KBO 10개 구단과 홈구장 정보를 한눈에 확인하세요.</p>
    </header>

    <div class="table-card">
      <el-table :data="stadiums" style="width: 100%">
        <el-table-column prop="teams" label="구단" min-width="170" />
        <el-table-column prop="name" label="홈구장" min-width="160" />
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
.page-head {
  margin-bottom: 24px;
}
.page-head h1 {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.8px;
  margin: 0 0 6px;
}
.subtitle {
  font-size: 15px;
  color: var(--label-secondary);
  margin: 0;
}
.table-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 8px 16px;
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

@media (max-width: 640px) {
  .page-head h1 {
    font-size: 26px;
  }
  .subtitle {
    font-size: 14px;
  }
  .table-card {
    padding: 8px 10px;
  }
}
</style>
