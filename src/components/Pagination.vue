<template>
  <div class="pagination">
    <button :disabled="currentPage === 1" @click="emit('change', currentPage - 1)">
      이전
    </button>
    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
    <button :disabled="currentPage === totalPages" @click="emit('change', currentPage + 1)">
      다음
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

const emit = defineEmits(['change'])
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 18px;
}
.pagination button {
  font-size: 13px;
  padding: 6px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.pagination button:hover:not(:disabled) {
  background: #f1f5f9;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-info {
  font-size: 13px;
  color: #556;
}
</style>
