<script setup>
defineProps({
  message: { type: String, required: true }
})
</script>

<template>
  <div class="status-bar">{{ message }}</div>
</template>

<style scoped>
.status-bar {
  text-align: center;
  background: var(--surface-muted);
  color: var(--label-secondary);
  font-size: 13px;
  padding: 14px;
  border-radius: var(--radius-sm);
}
</style>
