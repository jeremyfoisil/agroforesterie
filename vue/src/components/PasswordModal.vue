<template>
  <div v-if="modelValue" class="pw-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="pw-modal">
      <div class="pw-modal-icon">🔒</div>
      <div class="pw-modal-title">Accès protégé</div>
      <div class="pw-modal-sub">Entrez le mot de passe pour accéder aux paramètres de tarification.</div>
      <input ref="inputEl" class="pw-input" :class="{ 'pw-error': error }"
             type="password" v-model="input" placeholder="••••••"
             @keyup.enter="submit" @input="error = false">
      <div class="pw-err-msg">{{ error ? 'Mot de passe incorrect.' : '' }}</div>
      <div class="pw-actions">
        <button class="btn-cancel" @click="$emit('update:modelValue', false)">Annuler</button>
        <button class="btn-save" @click="submit">Déverrouiller</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  expected: { type: String, required: true }
})
const emit = defineEmits(['update:modelValue', 'unlock'])

const input = ref('')
const error = ref(false)
const inputEl = ref(null)

watch(() => props.modelValue, open => {
  if (open) {
    input.value = ''
    error.value = false
    nextTick(() => inputEl.value?.focus())
  }
})

function submit() {
  if (input.value === props.expected) {
    emit('update:modelValue', false)
    emit('unlock')
  } else {
    error.value = true
    input.value = ''
    nextTick(() => inputEl.value?.focus())
  }
}
</script>
