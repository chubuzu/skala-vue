<script setup>
import { useConfigStore } from '../stores/configStore'

const configStore = useConfigStore()

function setUnit(unit) {
  if (configStore.unit !== unit) configStore.toggleUnit()
}
</script>

<template>
  <div class="unit-toggler">
    <button
      type="button"
      :class="{ active: configStore.unit === 'celsius' }"
      @click="setUnit('celsius')"
    >
      ℃
    </button>
    <button
      type="button"
      :class="{ active: configStore.unit === 'fahrenheit' }"
      @click="setUnit('fahrenheit')"
    >
      ℉
    </button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--surface-muted);
  border-radius: 999px;
}
.unit-toggler button {
  border: none;
  background: transparent;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--label-secondary);
  cursor: pointer;
  font-family: inherit;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.unit-toggler button.active {
  background: var(--surface);
  color: var(--label);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
