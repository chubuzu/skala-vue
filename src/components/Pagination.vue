<script setup>
defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true }
})

const emit = defineEmits(['change'])
</script>

<template>
  <div class="pagination">
    <button
      v-for="page in totalPages"
      :key="page"
      type="button"
      class="dot"
      :class="{ active: page === currentPage }"
      :aria-label="`${page}페이지`"
      @click="emit('change', page)"
    />
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}
.dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 50%;
  background: rgba(120, 120, 128, 0.25);
  cursor: pointer;
  padding: 0;
  transition:
    background 0.2s ease,
    width 0.2s ease;
}
.dot:hover {
  background: rgba(120, 120, 128, 0.45);
}
.dot.active {
  width: 22px;
  border-radius: 999px;
  background: var(--label);
}
</style>
