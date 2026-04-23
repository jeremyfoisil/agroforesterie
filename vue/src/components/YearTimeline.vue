<template>
  <div class="panel" style="margin-bottom:14px;padding:10px 14px">
    <div style="display:flex;align-items:stretch;gap:6px">
      <button class="timeline-nav-btn" :disabled="offset === 0"
              title="Aller à 2020" @click="$emit('jump-left')">«</button>
      <button class="timeline-nav-btn" :disabled="offset === 0"
              title="Reculer" @click="$emit('scroll-left')">‹</button>
      <div class="year-timeline" style="flex:1;min-width:0">
        <div v-for="y in visibleYears" :key="y"
             class="year-tile" :class="{ 'yt-selected': y === modelValue }"
             @click="$emit('update:modelValue', y)">
          <div class="yt-year">{{ y }}</div>
          <div class="yt-pills">
            <span v-if="initCountFor(y) > 0" class="yt-pill yt-init">{{ initCountFor(y) }} init.</span>
            <span v-if="suiviCountFor(y) > 0" class="yt-pill yt-suivi">{{ suiviCountFor(y) }} suivi</span>
          </div>
        </div>
      </div>
      <button class="timeline-nav-btn" :disabled="offset >= maxOffset"
              title="Avancer" @click="$emit('scroll-right')">›</button>
      <button class="timeline-nav-btn" :disabled="offset >= maxOffset"
              title="Aller à 2050" @click="$emit('jump-right')">»</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, required: true },
  visibleYears: { type: Array, required: true },
  offset: { type: Number, required: true },
  maxOffset: { type: Number, required: true },
  initCountFor: { type: Function, required: true },
  suiviCountFor: { type: Function, required: true }
})
defineEmits(['update:modelValue', 'scroll-left', 'scroll-right', 'jump-left', 'jump-right'])
</script>
