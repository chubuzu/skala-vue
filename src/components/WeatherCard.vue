<template>
  <div class="card" @click="emit('select', city)">
    <div class="card-header">
      <strong>{{ city.name }} ({{ city.status }})</strong>
      <button @click.stop="emit('detail', city)">상세보기</button>
    </div>
    <p>현재 기온: {{ city.temp }}°C</p>

    <TempBadge :temp="city.temp" />
  </div>
</template>

<script setup>
import TempBadge from './TempBadge.vue'

defineProps({
  city: { type: Object, required: true }
})

const emit = defineEmits(['select', 'detail'])
</script>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}
.card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.card-header strong { font-size: 16px; }
.card-header button {
  font-size: 13px;
  padding: 5px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.card-header button:hover { background: #f1f5f9; }
.card p {
  margin: 0 0 10px;
  font-size: 13px;
  color: #556;
}
</style>