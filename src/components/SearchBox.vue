<template>
  <div class="search-box">
    <label>🔍 도시 검색</label>
    <input
      type="text"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      placeholder="검색할 도시 이름 입력"
    >
    <p>검색 중인 도시: {{ modelValue }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.search-box {
  background: #f2f6fb;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 20px;
}
.search-box label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}
.search-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cdd8e5;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}
.search-box p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #667;
}
</style>