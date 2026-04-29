<template>
  <div v-if="state.open" class="edit-modal-overlay" @click.self="$emit('close')">
    <div class="edit-modal">
      <div class="edit-modal-title">
        Modifier le projet
        <button class="edit-modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="edit-field">
        <label>Nom du projet</label>
        <input type="text" v-model="state.form.name" placeholder="Nom du projet">
      </div>

      <div class="edit-field">
        <label>Couleur</label>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">
          <div v-for="c in palette" :key="c"
               :style="{
                 width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer',
                 border: '2px solid transparent',
                 outline: state.form.color === c ? '2px solid var(--dark)' : 'none',
                 outlineOffset: '2px'
               }"
               @click="state.form.color = c"></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="color" v-model="state.form.color"
                 style="width:34px;height:32px;border:none;padding:2px;cursor:pointer;border-radius:6px;background:none">
          <input type="text" v-model="state.form.color" maxlength="7" placeholder="#rrggbb"
                 style="width:100px;font-family:monospace;font-size:12px;padding:5px 8px;border:1.5px solid var(--gray-200);border-radius:var(--r-sm)">
          <div :style="{
                 width: '28px', height: '28px', borderRadius: '50%',
                 background: state.form.color, border: '2px solid var(--gray-200)', flexShrink: 0
               }"></div>
        </div>
      </div>

      <div class="edit-field">
        <label>Nombre de haies</label>
        <div class="read-only-val">{{ state.form.haiesCount }} haie{{ state.form.haiesCount > 1 ? 's' : '' }}</div>
      </div>

      <div class="edit-field">
        <label>Linéaire de haies</label>
        <div class="read-only-val">{{ fmtLen(state.form.totalLengthM) }}</div>
      </div>

      <div class="edit-field">
        <label>Année d'initialisation</label>
        <input type="number" v-model.number="state.form.annee" min="2000" max="2050">
      </div>

      <div class="edit-actions">
        <button class="btn-cancel" @click="$emit('close')">Annuler</button>
        <button class="btn-save" @click="$emit('save')">Enregistrer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { fmtLen } from '../utils/format.js'

defineProps({
  state: { type: Object, required: true },
  palette: { type: Array, required: true }
})
defineEmits(['close', 'save'])
</script>
