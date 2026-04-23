<template>
  <div v-if="state.open" class="cpop"
       :style="{ top: state.top + 'px', left: state.left + 'px' }"
       @click.stop>
    <div class="cpop-title">Couleur du projet</div>
    <div class="cpop-swatches">
      <div v-for="c in palette" :key="c" class="cswatch"
           :class="{ active: project && c === project.color }"
           :style="{ background: c }" :title="c"
           @click="$emit('pick', state.projId, c)"></div>
    </div>
    <div class="cpop-hex">
      <input type="color" :value="project ? project.color : '#2d6a4f'"
             @input="$emit('pick', state.projId, $event.target.value)">
      <input type="text" :value="project ? project.color : ''"
             maxlength="7" placeholder="#rrggbb"
             @input="onHex($event.target.value)">
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  state: { type: Object, required: true },
  project: { type: Object, default: null },
  palette: { type: Array, required: true }
})
const emit = defineEmits(['pick'])

function onHex(val) {
  if (!val.startsWith('#')) val = '#' + val
  if (/^#[0-9a-fA-F]{6}$/.test(val)) emit('pick', props.state.projId, val)
}
</script>
