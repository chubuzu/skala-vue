<template>
  <div class="status-bar">{{ message }}</div>
</template>

<script setup>
defineProps({
  message: { type: String, required: true }
})
</script>

<style scoped>
.status-bar {
  text-align: center;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 14px;
  padding: 14px;
  border-radius: 10px;
}
</style>