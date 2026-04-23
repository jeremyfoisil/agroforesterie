<template>

<!-- ── Header ────────────────────────────────────────────────── -->
<header style="display:flex;justify-content:space-between;align-items:flex-start">
  <div>
    <div style="display:flex;align-items:center;gap:24px;margin-bottom:10px">
      <img src="https://kermap.com/wp-content/uploads/2026/04/kermap-logo-long-blanc.png" alt="Kermap" style="height:30px;object-fit:contain">
      <img src="https://fr.wikipedia.org/wiki/Special:FilePath/EARTHWORM_LOGO-01_(1).png" alt="Earthworm" style="height:27px;object-fit:contain">
    </div>
    <h1>Simulateur de tarification</h1>
    <p>Suivi des projets d'agroforesterie par télédétection</p>
  </div>
  <button class="gear-btn" @click="openSettings" title="Paramètres de tarification">⚙</button>
</header>

<div class="container">

  <!-- ── Settings overlay + panel ──────────────────────────── -->
  <div v-show="settingsOpen" id="settings-overlay" @click="settingsOpen = false"></div>
  <div v-show="settingsOpen" id="settings-panel">
    <div class="sp-head">
      <span class="sp-title">Paramètres de tarification</span>
      <button class="sp-close" @click="settingsOpen = false">×</button>
    </div>
    <div class="sp-body">
      <div class="sec-div">Abonnement plateforme</div>
      <div class="fgroup">
        <div class="flabel"><span>Abonnement annuel (€ HT)</span></div>
        <div class="irow"><input type="number" min="500" max="20000" step="100" v-model.number="sub" style="width:90px"><span>€/an</span></div>
      </div>

      <div class="sec-div" style="margin-top:18px">Modèle prix — Projets Shapefiles</div>
      <div class="fgroup">
        <div class="flabel"><span>Prix de base (€)</span></div>
        <div class="irow"><input type="number" min="0" max="2000" step="10" v-model.number="shpBase" style="width:80px"><span>€ plancher par projet</span></div>
      </div>
      <div class="fgroup">
        <div class="flabel"><span>Amplitude (€)</span></div>
        <div class="irow"><input type="number" min="0" max="10000" step="50" v-model.number="shpScale" style="width:80px"><span>€ max au-delà du plancher</span></div>
      </div>
      <div class="fgroup">
        <div class="flabel"><span>Poids haies / linéaire</span></div>
        <div class="irow">
          <input type="number" min="0" max="100" step="5" v-model.number="shpWH" style="width:60px">
          <span>% haies · <strong>{{ 100 - shpWH }}</strong> % ml</span>
        </div>
      </div>
      <div class="fgroup">
        <div class="flabel"><span>Borne max — haies</span></div>
        <div class="irow"><input type="number" min="10" max="5000" step="10" v-model.number="shpMaxH" style="width:80px"><span>haies (référence 100 %)</span></div>
      </div>
      <div class="fgroup">
        <div class="flabel"><span>Borne max — longueur</span></div>
        <div class="irow"><input type="number" min="1000" max="10000000" step="1000" v-model.number="shpMaxML" style="width:90px"><span>m (référence 100 %)</span></div>
      </div>
      <div class="fgroup">
        <div class="flabel"><span>Progressivité</span></div>
        <select v-model="shpProg" style="width:100%;font-size:12px;padding:4px 8px;border:1.5px solid var(--gray-200);border-radius:var(--r-sm)">
          <option value="log">Logarithmique — rapide puis s'aplatit</option>
          <option value="sqrt">Racine carrée</option>
          <option value="lin">Linéaire</option>
        </select>
      </div>
      <div style="font-size:11px;color:var(--gray-600);background:var(--gray-100);border-radius:var(--r-sm);padding:8px 10px;margin-top:4px">
        Référence : 5 haies / 800 m ≈ 190 € · 30 / 8 km ≈ 560 € · 80 / 25 km ≈ 1 050 €
      </div>

      <div class="sec-div" style="margin-top:18px">Modèle prix — Suivi triennal</div>
      <div class="fgroup">
        <div class="flabel"><span>Taux initialisation (€/haie)</span></div>
        <div class="irow"><input type="number" min="1" max="500" step="1" v-model.number="initRate" style="width:75px"><span>€/haie (suivi = moitié)</span></div>
      </div>
      <div class="fgroup">
        <div class="flabel"><span>Prix plancher par projet (€)</span></div>
        <div class="irow"><input type="number" min="20" max="500" step="10" v-model.number="priceFloor" style="width:75px"><span>€ minimum/projet</span></div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       MAIN TAB — Gestion des projets
  ══════════════════════════════════════════════════════════════ -->
  <div>
    <!-- Year timeline -->
    <YearTimeline v-model="shpYear"
                  :visible-years="visibleYears"
                  :offset="timelineOffset"
                  :max-offset="TIMELINE_MAX_OFFSET"
                  :init-count-for="yearInitCountFor"
                  :suivi-count-for="yearSuiviCountFor"
                  @scroll-left="timelineScrollLeft"
                  @scroll-right="timelineScrollRight"
                  @jump-left="timelineJumpLeft"
                  @jump-right="timelineJumpRight" />

    <!-- Mode toggle -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
      <div class="mode-toggle">
        <button class="mode-btn mode-btn-ann" :class="{active: suiviMode==='annuel'}" @click="setSuiviMode('annuel')">Suivi annuel (Pléiades)</button>
        <button class="mode-btn" :class="{active: suiviMode==='triennal'}" @click="setSuiviMode('triennal')">Suivi triennal</button>
      </div>
      <span v-show="suiviMode==='annuel'" class="opt-banner annual" style="margin:0;padding:5px 14px">Estimation des commandes Pléiades Neo activée</span>
    </div>

    <div style="display:grid;grid-template-columns:420px 1fr;gap:18px;align-items:start">

      <!-- ── LEFT column ─────────────────────────────────────── -->
      <div>
        <!-- Projects panel -->
        <div class="panel">
          <div class="panel-title">Projets chargés <span class="proj-counter" v-if="shpProjects.length">({{ shpProjects.length }})</span></div>

          <!-- Drop zone -->
          <div class="shp-dropzone" :class="{'drag-over': isDragOver}"
               @dragover.prevent="isDragOver = true"
               @dragleave.self="isDragOver = false"
               @drop.prevent="onDrop($event)">
            <div style="font-size:26px;margin-bottom:6px">📂</div>
            <div style="font-weight:600;margin-bottom:2px">Glissez vos fichiers .zip ici</div>
            <div style="font-size:11px;margin-bottom:8px">ou</div>
            <label class="add-btn" style="cursor:pointer;display:inline-block">
              Parcourir les fichiers
              <input type="file" ref="fileInputEl" accept=".zip" multiple style="display:none" @change="onFileChange($event)">
            </label>
            <div style="font-size:11px;color:var(--gray-600);margin-top:8px">Archive .zip contenant .shp .dbf .prj — un fichier par projet</div>
          </div>

          <!-- Project list -->
          <div style="margin-top:12px">
            <div v-if="!shpProjects.length" class="proj-empty">Aucun projet chargé. Déposez des fichiers shapefile (.zip).</div>
            <div v-for="p in shpProjects" :key="p.id"
                 class="shp-proj-card" :class="{selected: p.id === selectedShpId}"
                 @click="focusShpProject(p.id)">
              <button class="edit-btn" data-tip="Modifier" @click.stop="openEditModal(p.id)"><span>✏</span></button>
              <div class="shp-color-dot" :style="{background: p.color}" title="Changer la couleur"
                   @click.stop="openColorPicker(p.id, $event)"></div>
              <div class="shp-proj-info">
                <div class="shp-proj-name" :title="p.name">{{ p.name }}</div>
                <div class="shp-proj-meta">{{ p.haiesCount }} haie{{ p.haiesCount > 1 ? 's' : '' }} · {{ fmtLen(p.totalLengthM) }} · Init. {{ p.annee }}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;min-width:96px">
                <span class="proj-status-btn" :class="projStatusClass(p)" style="cursor:default">{{ projStatusLabel(p) }}</span>
                <div style="font-size:12px;font-weight:700;white-space:nowrap" :style="{color: projYearCostColor(p)}">
                  {{ projYearCostText(p) }}
                </div>
              </div>
              <button class="del-btn" data-tip="Supprimer" @click.stop="removeShpProject(p.id)">×</button>
            </div>
          </div>

          <!-- Footer stats -->
          <div v-if="shpProjects.length" class="shp-stats-footer">
            <span>{{ shpProjects.length }} projet{{ shpProjects.length > 1 ? 's' : '' }}</span>
            <span style="color:var(--gray-200)">|</span>
            <span>{{ shpTotalHaies }} haie{{ shpTotalHaies > 1 ? 's' : '' }}</span>
            <span style="color:var(--gray-200)">|</span>
            <span>{{ fmtLen(shpTotalLen) }} de haies</span>
          </div>

        </div>

        <!-- Pléiades AOI overview (annuel mode only) -->
        <div class="panel" v-show="suiviMode==='annuel'" style="margin-top:18px">
          <div class="panel-title">AOIs Pléiades <span class="proj-counter" v-if="shpProjects.length">({{ shpProjects.length }})</span></div>
          <div v-if="!annYearProjects.length" class="proj-empty">Aucun projet actif pour {{ shpYear }}. Chargez des projets ou changez l'année.</div>
          <div v-else>
            <div v-for="p in annYearProjects" :key="p.id" class="shp-proj-card" style="cursor:default">
              <div class="shp-color-dot" :style="{background: p.color}" style="pointer-events:none"></div>
              <div class="shp-proj-info">
                <div class="shp-proj-name" :title="p.name">{{ p.name }}</div>
                <div class="shp-proj-meta">
                  {{ p.haiesCount }} haie{{ p.haiesCount > 1 ? 's' : '' }}
                  · {{ annProjInfo(p).nClusters }} AOI{{ annProjInfo(p).nClusters > 1 ? 's' : '' }}
                  <span v-if="annProjInfo(p).area > 0"> · {{ annProjInfo(p).area.toLocaleString('fr-FR', {maximumFractionDigits:2}) }} km²</span>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:700;color:var(--green)">{{ fmt(annProjMonCost(p)) }}</div>
                <div v-if="annProjInfo(p).area > 0" style="font-size:11px;color:var(--blue)">{{ fmt(annProjInfo(p).area * annEffRate * annPadding) }} Pléiades</div>
              </div>
            </div>
          </div>
          <div v-if="annYearProjects.length" class="shp-stats-footer">
            <span>{{ annYearProjects.length }} projet{{ annYearProjects.length > 1 ? 's' : '' }}</span>
            <span style="color:var(--gray-200)">|</span>
            <span>{{ annTotalAOIsYear }} AOI · {{ annConsolidationYear.totalArea.toLocaleString('fr-FR', {maximumFractionDigits:2}) }} km²</span>
          </div>
        </div>

        <!-- Pléiades params (annuel mode only) -->
        <div class="panel" v-show="suiviMode==='annuel'" style="margin-top:18px">
          <div class="sec-div" style="margin-top:0">Paramètres d'acquisition Pléiades</div>
          <div class="fgroup">
            <div class="flabel"><span>Mode d'acquisition</span></div>
            <select v-model="annDifficulty" style="width:100%;font-size:12px;padding:4px 8px;border:1.5px solid var(--gray-200);border-radius:var(--r-sm)">
              <option value="easy">EASY — 30 à 45 €/km²</option>
              <option value="challenging">CHALLENGING — 55 à 90 €/km²</option>
            </select>
          </div>
          <div class="fgroup">
            <div class="flabel"><span>Tarif unitaire (€/km²)</span></div>
            <div class="irow"><input type="number" min="10" max="200" step="1" v-model.number="annRate" style="width:75px"><span>€/km² (fourchette selon mode)</span></div>
          </div>
          <div class="fgroup">
            <div style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="ann-cloud" v-model="annCloud" style="width:16px;height:16px;accent-color:var(--green)">
              <label for="ann-cloud" style="font-size:13px;font-weight:500;color:var(--gray-600);cursor:pointer">Garantie nuages ≤ 5 % (+9 €/km²)</label>
            </div>
          </div>
          <div class="fgroup">
            <div class="flabel"><span>Padding de scène</span><span class="fval">{{ annPadding.toFixed(2) }}</span></div>
            <input type="range" min="1.00" max="1.30" step="0.01" v-model.number="annPadding">
            <div class="irow"><input type="number" min="1.00" max="1.30" step="0.01" v-model.number="annPadding" style="width:70px"><span>× surface (padding scène)</span></div>
          </div>
          <div class="fgroup">
            <div class="flabel"><span>Buffer autour des haies</span><span class="fval">{{ annBufferM }} m</span></div>
            <input type="range" min="25" max="200" step="25" v-model.number="annBufferM">
            <div class="irow"><input type="number" min="25" max="200" step="25" v-model.number="annBufferM" style="width:70px"><span>m autour de chaque haie</span></div>
          </div>
          <div class="fgroup">
            <div class="flabel"><span>Seuil regroupement haies</span><span class="fval">{{ annClusterM }} m</span></div>
            <input type="range" min="100" max="10000" step="100" v-model.number="annClusterM">
            <div class="irow"><input type="number" min="100" max="10000" step="100" v-model.number="annClusterM" style="width:75px"><span>m (haies → même AOI)</span></div>
          </div>
          <div class="fgroup">
            <div class="flabel"><span>Seuil mutualisation projets</span><span class="fval">{{ annConsolKm }} km</span></div>
            <input type="range" min="1" max="25" step="1" v-model.number="annConsolKm">
            <div class="irow"><input type="number" min="1" max="25" step="1" v-model.number="annConsolKm" style="width:70px"><span>km (AOIs → acquisition commune)</span></div>
          </div>
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--gray-200)">
            <button @click="applyThreshold100"
                    style="width:100%;padding:9px 12px;background:var(--blue);color:#fff;border:none;border-radius:var(--r-sm);font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:background .15s"
                    @mouseover="$event.target.style.background='#0d47a1'" @mouseout="$event.target.style.background='var(--blue)'">
              <span style="font-size:16px">⊞</span> {{ threshold100Label }}
            </button>
            <div style="font-size:11px;color:var(--gray-600);margin-top:6px;text-align:center;line-height:1.4">
              Commande Pléiades Neo : minimum 100 km² — ajuste buffer, regroupement et mutualisation
            </div>
          </div>
        </div>
      </div>

      <!-- ── RIGHT column ────────────────────────────────────── -->
      <div>
        <!-- Maps (one per mode, same DOM slot) -->
        <div class="panel" style="padding:0;overflow:hidden;margin-bottom:18px">
          <div id="shp-map" v-show="suiviMode==='triennal'" style="height:420px;border-radius:var(--r)"></div>
          <div id="ann-map" v-show="suiviMode==='annuel'" style="height:420px;border-radius:var(--r)"></div>
        </div>

        <!-- Sub-tabs panel -->
        <div class="panel">
          <div class="sub-tabs-bar">
            <button class="sub-tab-btn" :class="{active: evalSubTab==='eval'}" @click="setEvalSubTab('eval')">
              Évaluation de l'année {{ shpYear }}
            </button>
            <button class="sub-tab-btn" :class="{active: evalSubTab==='projections'}" @click="setEvalSubTab('projections')">
              Projections
            </button>
          </div>

          <!-- ── Évaluation sub-tab ── -->
          <div v-show="evalSubTab==='eval'">
            <div v-if="!shpProjects.length" style="font-size:12px;color:var(--gray-600);padding:8px 0">Chargez des projets pour voir l'évaluation tarifaire.</div>
            <div v-else>

              <!-- Triennal pricing -->
              <div v-show="suiviMode==='triennal'">
                <div class="mc hl" style="border-radius:var(--r-sm);padding:13px 15px;margin-bottom:16px">
                  <div class="mc-label">Total annuel HT</div>
                  <div class="mc-val">{{ fmt(shpTotalHTYear) }}</div>
                  <div class="mc-sub">{{ yearVisibleProjects.length }} projet{{ yearVisibleProjects.length > 1 ? 's' : '' }} · {{ shpYear }}</div>
                  <div style="font-size:11px;color:rgba(255,255,255,.75);margin-top:3px">{{ shpYear }} — {{ yearNewOnes.length }} init. · {{ yearSuiviOnes.length }} suivi</div>
                </div>
                <div class="brow">
                  <span class="blabel">Abonnement plateforme</span>
                  <span class="bamount" :style="{color: yearNewOnes.length === 0 && yearSuiviOnes.length === 0 ? 'var(--gray-200)' : ''}">
                    {{ yearNewOnes.length === 0 && yearSuiviOnes.length === 0 ? '— (aucune activité)' : fmt(sub) }}
                  </span>
                </div>
                <div class="brow">
                  <span class="blabel">Nouveaux projets<small v-if="yearNewOnes.length"> — {{ yearNewOnes.length }} projet{{ yearNewOnes.length > 1 ? 's' : '' }}</small></span>
                  <span class="bamount">{{ fmt(shpInitCostYear) }}</span>
                </div>
                <div class="brow">
                  <span class="blabel">En suivi (−50 %)<small v-if="yearSuiviOnes.length"> — {{ yearSuiviOnes.length }} projet{{ yearSuiviOnes.length > 1 ? 's' : '' }}</small></span>
                  <span class="bamount">{{ fmt(shpSuiviCostYear) }}</span>
                </div>
                <div class="brow total">
                  <span class="blabel">Total HT</span>
                  <span class="bamount">{{ fmt(shpTotalHTYear) }}</span>
                </div>
                <div class="brow sub-line">
                  <span class="blabel">TVA 20 %</span>
                  <span class="bamount">{{ fmt(shpTotalHTYear * 0.2) }}</span>
                </div>
                <div class="brow sub-line" style="padding-bottom:10px">
                  <span class="blabel" style="font-size:13px;font-weight:600;color:var(--gray-800)">Total TTC</span>
                  <span class="bamount" style="font-size:15px">{{ fmt(shpTotalHTYear * 1.2) }}</span>
                </div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin:14px 0 6px">Structure du coût global</div>
                <div class="chart-wrap" style="height:160px"><canvas id="shp-donut-chart"></canvas></div>
                <div v-if="yearNewOnes.length > 0">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin:16px 0 6px">Coût initialisation par projet</div>
                  <div class="chart-wrap" :style="{height: Math.max(60, yearNewOnes.length * 32) + 'px'}"><canvas id="shp-bar-init"></canvas></div>
                </div>
                <div v-if="yearSuiviOnes.length > 0">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin:16px 0 6px">Coût suivi par projet (−50 %)</div>
                  <div class="chart-wrap" :style="{height: Math.max(60, yearSuiviOnes.length * 32) + 'px'}"><canvas id="shp-bar-suivi"></canvas></div>
                </div>
              </div>

              <!-- Annuel (Pléiades) pricing -->
              <div v-show="suiviMode==='annuel'">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
                  <div class="mc hl">
                    <div class="mc-label">Total annuel HT</div>
                    <div class="mc-val">{{ fmt(annPricing.totalHT) }}</div>
                    <div class="mc-sub">{{ annYearProjects.length }} projet{{ annYearProjects.length > 1 ? 's' : '' }} actifs · {{ shpYear }}</div>
                  </div>
                  <div class="mc">
                    <div class="mc-label">AOIs optimisés</div>
                    <div class="mc-val">{{ annTotalAOIsYear }} AOI{{ annTotalAOIsYear > 1 ? 's' : '' }}</div>
                    <div class="mc-sub">{{ annConsolidationYear.totalArea.toLocaleString('fr-FR', {maximumFractionDigits:2}) }} km² consolidés</div>
                  </div>
                </div>
                <div class="brow">
                  <span class="blabel">Abonnement plateforme</span>
                  <span class="bamount">{{ fmt(sub) }}</span>
                </div>
                <div class="brow">
                  <span class="blabel">Monitoring — nouveaux projets<small v-if="yearNewOnes.length"> — {{ yearNewOnes.length }} projet{{ yearNewOnes.length > 1 ? 's' : '' }}</small></span>
                  <span class="bamount">{{ fmt(annPricing.initCost) }}</span>
                </div>
                <div class="brow">
                  <span class="blabel">Monitoring — en suivi (−50 %)<small v-if="yearSuiviOnes.length"> — {{ yearSuiviOnes.length }} projet{{ yearSuiviOnes.length > 1 ? 's' : '' }}</small></span>
                  <span class="bamount">{{ fmt(annPricing.suiviCost) }}</span>
                </div>
                <div class="brow" style="border-top:1px solid var(--gray-200);padding-top:8px;margin-top:4px">
                  <span class="blabel" style="color:var(--blue)">Acquisition Pléiades<small> — {{ annPricing.pleiArea.toLocaleString('fr-FR', {maximumFractionDigits:2}) }} km² × {{ annEffRate }} €/km²</small></span>
                  <span class="bamount" style="color:var(--blue)">{{ fmt(annPricing.pleiCost) }}</span>
                </div>
                <div style="background:var(--blue-pale);border:1px solid #bbdefb;border-radius:var(--r-sm);padding:10px 12px;margin:4px 0 8px;font-size:12px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="color:var(--gray-600)">Acquisitions séparées :</span>
                    <span v-html="fmtKm2Compare(annPricing.rawAreaInd, annPricing.pleiAreaInd)"></span>
                  </div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="color:var(--gray-600)">Après mutualisation :</span>
                    <span style="font-weight:600" v-html="fmtKm2Compare(annPricing.rawAreaCons, annPricing.pleiAreaCons)"></span>
                  </div>
                  <div style="display:flex;justify-content:space-between;border-top:1px solid #bbdefb;padding-top:4px;margin-top:2px">
                    <span style="color:var(--blue);font-weight:600">Économie mutualisation :</span>
                    <span style="font-weight:700" :style="{color: annPricing.savings > 1 ? 'var(--green)' : 'var(--gray-600)'}">
                      {{ annPricing.savings > 1 ? '−' + fmt(annPricing.savings) + ' (' + Math.round(annPricing.savings / annPricing.pleiCostInd * 100) + ' %)' : 'Pas de surface mutualisable' }}
                    </span>
                  </div>
                  <div v-if="annPricing.minApplies" style="margin-top:7px;padding:5px 8px;background:#e8f5e9;border:1px solid #c8e6c9;border-radius:var(--r-sm);font-size:11px;color:var(--green);line-height:1.4">
                    ⚠ Surface brute inférieure à 100 km² — tarif calculé sur le minimum de commande (100 km²)
                  </div>
                </div>
                <div class="brow total">
                  <span class="blabel">Total HT</span>
                  <span class="bamount">{{ fmt(annPricing.totalHT) }}</span>
                </div>
                <div class="brow sub-line">
                  <span class="blabel">TVA 20 %</span>
                  <span class="bamount">{{ fmt(annPricing.tva) }}</span>
                </div>
                <div class="brow sub-line" style="padding-bottom:10px">
                  <span class="blabel" style="font-size:13px;font-weight:600;color:var(--gray-800)">Total TTC</span>
                  <span class="bamount" style="font-size:15px">{{ fmt(annPricing.ttc) }}</span>
                </div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin:14px 0 6px">Structure du coût global</div>
                <div class="chart-wrap" style="height:160px"><canvas id="ann-donut-chart"></canvas></div>
                <div v-if="annHasAreaYear">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin:16px 0 6px">Surface imagée par projet (km²)</div>
                  <div class="chart-wrap" :style="{height: Math.max(60, shpProjects.length * 32) + 'px'}"><canvas id="ann-bar-area"></canvas></div>
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin:16px 0 6px">Coût Pléiades par projet (€)</div>
                  <div class="chart-wrap" :style="{height: Math.max(60, shpProjects.length * 32) + 'px'}"><canvas id="ann-bar-plei"></canvas></div>
                </div>
              </div>

            </div>
          </div>

          <!-- ── Projections sub-tab ── -->
          <div v-show="evalSubTab==='projections'">
            <p style="font-size:12px;color:var(--gray-600);margin-bottom:14px">
              Projections 2020 → 2050 — données issues des fichiers chargés + projets supplémentaires renseignés manuellement dans la colonne <strong>+&nbsp;Manuel</strong>.
              <span v-if="suiviMode==='triennal'">Projets initialisés en N → premiers suivis en N+3.</span>
              <span v-else style="color:var(--blue)">Suivi annuel : tous les projets antérieurs sont imagés chaque année — coût Pléiades estimé d'après l'année de référence.</span>
              <span style="margin-left:6px;color:var(--gray-600)">· Ligne <span style="background:var(--green-pale);padding:1px 5px;border-radius:4px;font-weight:700;color:var(--green)">verte</span> = année sélectionnée · <span style="color:var(--blue)">Bleu</span> = années futures</span>
            </p>
            <div class="proj-tbl-scroll" ref="projTableRef" style="margin-bottom:24px">
              <table class="proj-tbl">
                <thead>
                  <tr>
                    <th>Année</th><th>Total projets</th><th>Fichiers</th><th>+ Manuel</th><th>Dont suivis</th>
                    <th>Abonnement</th><th>Initialisation</th><th>Suivi</th>
                    <th v-if="suiviMode==='annuel'" style="color:#90caf9">Pléiades (est.)</th>
                    <th>Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in projectionRows" :key="row.year"
                      :class="{'proj-row-selected': row.isSelected, 'proj-row-future': row.isFuture && !row.isSelected}">
                    <td><strong>{{ row.year }}</strong> <span v-if="row.isSelected" class="pill">Sélectionnée</span></td>
                    <td class="hl">{{ row.total }}</td>
                    <td>{{ row.realNewCount }}</td>
                    <td><input type="number" min="0" :value="manualNewPerYear[row.year] || 0" @input="manualNewPerYear[row.year] = +$event.target.value || 0" style="width:48px;padding:2px 4px;border:1.5px solid var(--gray-200);border-radius:4px;font-size:12px;text-align:center" placeholder="0"></td>
                    <td>{{ row.exCount }}</td>
                    <td class="amt" :style="{color: row.newCount === 0 && row.exCount === 0 ? 'var(--gray-200)' : ''}">
                      {{ row.newCount === 0 && row.exCount === 0 ? '—' : fmt(sub) }}
                    </td>
                    <td class="amt">{{ row.initCost > 0 ? fmt(row.initCost) : '—' }}</td>
                    <td class="amt">{{ row.suiviCost > 0 ? fmt(row.suiviCost) : '—' }}</td>
                    <td v-if="suiviMode==='annuel'" class="amt" style="color:var(--blue)">{{ row.pleiCost > 0 ? fmt(row.pleiCost) : '—' }}</td>
                    <td class="amt hl" style="font-size:14px">{{ row.totalHT > 0 ? fmt(row.totalHT) : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin-bottom:10px">Évolution du coût total annuel (HT)</div>
            <div class="chart-wrap" style="height:260px"><canvas id="shp-bar-proj"></canvas></div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);margin:24px 0 10px">Coût moyen par projet (HT)</div>
            <div class="chart-wrap" style="height:220px"><canvas id="shp-avg-cost-proj"></canvas></div>
          </div>

        </div><!-- /sub-tabs panel -->
      </div><!-- /right column -->
    </div><!-- /main grid -->
  </div><!-- /main tab -->

</div><!-- /container -->

<ColorPickerPopup :state="colorPicker"
                  :project="colorPickerProj"
                  :palette="PALETTE"
                  @pick="applyProjColor" />

<PasswordModal v-model="pwOpen"
               :expected="SETTINGS_PASSWORD"
               @unlock="onPasswordUnlock" />

<EditProjectModal :state="editModal"
                  :palette="PALETTE"
                  @close="closeEditModal"
                  @save="saveEditModal"
                  @annee-change="onEditAnneeChange"
                  @toggle-suivi="toggleEditSuiviYear" />

<footer>Kermap — Simulateur de tarification « Suivi des projets d'agroforesterie » — {{ currentDate }}</footer>

</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import L from 'leaflet'
import shp from 'shpjs'

import { supabase } from './lib/supabase.js'
import {
  SHP_COLORS, PALETTE,
  ALL_YEARS, TIMELINE_VISIBLE, TIMELINE_MAX_OFFSET,
  DEPT_STYLE_DARK, DEPT_STYLE_LIGHT
} from './constants.js'
import { fmt, fmtN, fmtLen, defaultSuiviYears } from './utils/format.js'
import { computeShpPrice } from './utils/pricing.js'
import { geomLength, calcOptimizedProjectAOIs, consolidateAOIs } from './utils/geo.js'

import YearTimeline from './components/YearTimeline.vue'
import PasswordModal from './components/PasswordModal.vue'
import ColorPickerPopup from './components/ColorPickerPopup.vue'
import EditProjectModal from './components/EditProjectModal.vue'

const SETTINGS_PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || 'KerMap'

// ── Tab / UI state ────────────────────────────────────────────────────────
const activeTab      = ref('shp');
const suiviMode      = ref('annuel'); // 'annuel' | 'triennal'
const evalSubTab     = ref('eval');     // 'eval' | 'projections'
const settingsOpen     = ref(false);
const settingsUnlocked = ref(false);
const pwOpen           = ref(false);
const isDragOver     = ref(false);
const fileInputEl    = ref(null);
const threshold100Label = ref('⊞ Seuil 100 km² — optimiser les paramètres');

// ── Settings / pricing params ─────────────────────────────────────────────
const sub       = ref(3700);
const shpBase   = ref(150);
const shpScale  = ref(1850);
const shpWH     = ref(70);
const shpMaxH   = ref(200);
const shpMaxML  = ref(100000);
const shpProg   = ref('log');
const initRate  = ref(30);
const priceFloor= ref(100);

// ── Annual tab params ─────────────────────────────────────────────────────
const annDifficulty = ref('easy');
const annRate       = ref(35);
const annCloud      = ref(false);
const annPadding    = ref(1.10);
const annBufferM    = ref(75);
const annClusterM   = ref(500);
const annConsolKm   = ref(5);

// ── Manual extra projects per year (persisted in localStorage) ───────────
const manualNewPerYear = reactive(
  JSON.parse(localStorage.getItem('manualNewPerYear') || '{}')
);
watch(manualNewPerYear, () => {
  localStorage.setItem('manualNewPerYear', JSON.stringify(manualNewPerYear));
}, { deep: true });

// ── Year options ──────────────────────────────────────────────────────────
const curYear    = new Date().getFullYear();
const shpYear    = ref(curYear);
const annYear    = ref(curYear);
const currentDate= new Date().toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'});

// ── Shapefile projects ────────────────────────────────────────────────────
const shpProjects = ref([]);
let shpNextId = 1;
const selectedShpId = ref(null);

// Offset initial : curYear centré dans la fenêtre, borné à [0, maxOffset]
const timelineOffset = ref(
  Math.max(0, Math.min(curYear - 2020 - Math.floor(TIMELINE_VISIBLE / 2), TIMELINE_MAX_OFFSET))
);

const visibleYears = computed(() =>
  ALL_YEARS.slice(timelineOffset.value, timelineOffset.value + TIMELINE_VISIBLE)
);

function timelineScrollLeft()  { timelineOffset.value = Math.max(0, timelineOffset.value - 1); }
function timelineScrollRight() { timelineOffset.value = Math.min(TIMELINE_MAX_OFFSET, timelineOffset.value + 1); }
function timelineJumpLeft()    { timelineOffset.value = 0; }
function timelineJumpRight()   { timelineOffset.value = TIMELINE_MAX_OFFSET; }

// ── Projection table ref (auto-scroll) ───────────────────────────────────
const projTableRef = ref(null);

// ── Color picker ──────────────────────────────────────────────────────────
const colorPicker = reactive({open:false,projId:null,top:0,left:0});

// ── Edit modal ────────────────────────────────────────────────────────────
const editModal = reactive({
  open: false,
  projId: null,
  form: {name:'', color:'', haiesCount:0, totalLengthM:0, annee:0, suiviYears:[]},
  suiviYearOptions: []
});

// ── Map / chart instances (non-reactive) ──────────────────────────────────
let shpMapInst=null, shpLayerGroupInst=null;
let annMapInst=null, annLayerGroupInst=null;
let shpProjBarInst=null, shpAvgCostInst=null;
let shpDonutInst=null, shpInitInst=null, shpSuiviInst=null;
let annDonutInst=null, annAreaInst=null, annPleiInst=null;

// ── Computed pricing params ───────────────────────────────────────────────
const pp = computed(() => {
  const wH = Math.min(100,Math.max(0,shpWH.value))/100;
  return {base:shpBase.value,scale:shpScale.value,wH,wML:1-wH,maxH:shpMaxH.value,maxML:shpMaxML.value,prog:shpProg.value};
});

const annEffRate = computed(() => annRate.value + (annCloud.value ? 9 : 0));

// ── Project group helpers ─────────────────────────────────────────────────
const shpNewOnes = computed(() => shpProjects.value.filter(p=>p.isNew));
const shpExOnes  = computed(() => shpProjects.value.filter(p=>!p.isNew));
const shpTotalHaies = computed(() => shpProjects.value.reduce((s,p)=>s+p.haiesCount,0));
const shpTotalLen   = computed(() => shpProjects.value.reduce((s,p)=>s+p.totalLengthM,0));

// ── Shapefile tab pricing ─────────────────────────────────────────────────
const shpInitCost  = computed(() => shpNewOnes.value.reduce((s,p)=>s+computeShpPrice(p.haiesCount,p.totalLengthM,pp.value),0));
const shpSuiviCost = computed(() => shpExOnes.value.reduce((s,p)=>s+computeShpPrice(p.haiesCount,p.totalLengthM,pp.value)*0.5,0));
const shpTotalHT   = computed(() => sub.value+shpInitCost.value+shpSuiviCost.value);

function shpProjAnnCost(p) {
  const price = computeShpPrice(p.haiesCount,p.totalLengthM,pp.value);
  return p.isNew ? price : price*0.5;
}

// ── Year-filtered computed values ─────────────────────────────────────────
// Projects initialized exactly in the selected year → initialization billing
const yearNewOnes = computed(() =>
  shpProjects.value.filter(p => p.annee === shpYear.value)
);

// Helper: is `year` a suivi year for project `p`?
function isSuiviYear(p, year) {
  if (p.annee >= year) return false;
  if (p.suiviYears && p.suiviYears.length > 0) return p.suiviYears.includes(year);
  return (year - p.annee) % 3 === 0;
}

// Projects in suivi for the selected year.
// Annuel mode: all past projects are monitored every year.
// Triennal mode: only every-3-year cycles.
const yearSuiviOnes = computed(() =>
  suiviMode.value === 'annuel'
    ? shpProjects.value.filter(p => p.annee < shpYear.value)
    : shpProjects.value.filter(p => isSuiviYear(p, shpYear.value))
);

// All projects existing at or before selected year
const yearVisibleProjects = computed(() =>
  shpProjects.value.filter(p => p.annee <= shpYear.value)
);

// Year-filtered costs (actual billing for selected year, not amortized)
const shpInitCostYear = computed(() =>
  yearNewOnes.value.reduce((s, p) => s + computeShpPrice(p.haiesCount, p.totalLengthM, pp.value), 0)
);
const shpSuiviCostYear = computed(() =>
  yearSuiviOnes.value.reduce((s, p) => s + computeShpPrice(p.haiesCount, p.totalLengthM, pp.value) * 0.5, 0)
);
const shpTotalHTYear = computed(() => {
  const hasActivity = yearNewOnes.value.length > 0 || yearSuiviOnes.value.length > 0;
  return (hasActivity ? sub.value : 0) + shpInitCostYear.value + shpSuiviCostYear.value;
});

// ── Projection 2020→2050 ──────────────────────────────────────────────────
const projectionRows = computed(() => {
  const startYear = shpYear.value;
  const isAnnuel  = suiviMode.value === 'annuel';

  const avgPrice = shpProjects.value.length > 0
    ? shpProjects.value.reduce((s, p) => s + computeShpPrice(p.haiesCount, p.totalLengthM, pp.value), 0) / shpProjects.value.length
    : computeShpPrice(10, 5000, pp.value);

  // Coût Pléiades projeté : plancher 3 500 € → plafond 8 000 € à ×20 projets actifs
  // Coût Pléiades projeté : plancher 3 500 € → plafond 8 000 € à 100 projets actifs
  const PLEI_MIN = 3500, PLEI_MAX = 8000, PLEI_SCALE = 100;

  const forecasts = []; // { annee, price } — projets simulés
  const rows = [];

  for (const year of ALL_YEARS) {
    // Les extras manuels s'appliquent à toutes les années
    const extras = manualNewPerYear[year] || 0;
    for (let j = 0; j < extras; j++) {
      forecasts.push({ annee: year, price: avgPrice });
    }

    const realInit  = shpProjects.value.filter(p => p.annee === year);
    const realSuivi = isAnnuel
      ? shpProjects.value.filter(p => p.annee < year)
      : shpProjects.value.filter(p => isSuiviYear(p, year));

    const fInit  = forecasts.filter(p => p.annee === year);
    const fSuivi = isAnnuel
      ? forecasts.filter(p => p.annee < year)
      : forecasts.filter(p => p.annee < year && (year - p.annee) % 3 === 0);

    const initCost  = realInit.reduce((s, p) => s + computeShpPrice(p.haiesCount, p.totalLengthM, pp.value), 0)
                    + fInit.reduce((s, p) => s + p.price, 0);
    const suiviCost = realSuivi.reduce((s, p) => s + computeShpPrice(p.haiesCount, p.totalLengthM, pp.value) * 0.5, 0)
                    + fSuivi.reduce((s, p) => s + p.price * 0.5, 0);

    const total    = shpProjects.value.filter(p => p.annee <= year).length
                   + forecasts.filter(p => p.annee <= year).length;
    const realNewCount = realInit.length;
    const newCount = realInit.length + fInit.length;
    const exCount  = realSuivi.length + fSuivi.length;
    const hasActivity = newCount > 0 || exCount > 0;

    const activeCount = newCount + exCount;
    const pleiCost = isAnnuel && hasActivity
      ? Math.min(PLEI_MAX, Math.max(PLEI_MIN, PLEI_MIN + (activeCount - 1) * (PLEI_MAX - PLEI_MIN) / (PLEI_SCALE - 1)))
      : 0;
    const totalHT  = (hasActivity ? sub.value : 0) + initCost + suiviCost + pleiCost;

    rows.push({
      year, total, realNewCount, newCount, exCount,
      initCost, suiviCost, pleiCost, totalHT,
      tva: totalHT * 0.2, ttc: totalHT * 1.2,
      isSelected: year === startYear,
      isFuture:   year > startYear
    });
  }
  return rows;
});

// ── Annual tab (Pléiades) ─────────────────────────────────────────────────
const annProjectAOIs = computed(() =>
  shpProjects.value.map(proj=>({
    projectId:proj.id,projectName:proj.name,color:proj.color,
    aois:calcOptimizedProjectAOIs(proj,annBufferM.value,annClusterM.value)
  }))
);

const annConsolidation = computed(() => consolidateAOIs(annProjectAOIs.value,annConsolKm.value));
const annTotalAOIs = computed(() => annProjectAOIs.value.reduce((s,p)=>s+p.aois.length,0));
const annHasArea   = computed(() => annProjectAOIs.value.some(p=>p.aois.some(a=>a.area>0)));

// ── Year-filtered Pléiades AOIs (only init + suivi de shpYear) ────────────
const annYearProjects = computed(() => [...yearNewOnes.value, ...yearSuiviOnes.value]);

const annProjectAOIsYear = computed(() =>
  annYearProjects.value.map(proj=>({
    projectId:proj.id, projectName:proj.name, color:proj.color,
    aois:calcOptimizedProjectAOIs(proj, annBufferM.value, annClusterM.value)
  }))
);

const annConsolidationYear = computed(() => consolidateAOIs(annProjectAOIsYear.value, annConsolKm.value));
const annTotalAOIsYear     = computed(() => annProjectAOIsYear.value.reduce((s,p)=>s+p.aois.length,0));
const annHasAreaYear       = computed(() => annProjectAOIsYear.value.some(p=>p.aois.some(a=>a.area>0)));

const annPricing = computed(()=>{
  const MIN_KM2=100;
  const rate=annEffRate.value, pad=annPadding.value;
  // Surface Pléiades calculée sur les projets actifs de l'année uniquement
  const rawAreaInd =annConsolidationYear.value.individualArea*pad;
  const rawAreaCons=annConsolidationYear.value.totalArea*pad;
  const pleiAreaInd  =Math.max(rawAreaInd,MIN_KM2);
  const pleiAreaCons =Math.max(rawAreaCons,MIN_KM2);
  const pleiCostInd  =pleiAreaInd*rate;
  const pleiCostCons =pleiAreaCons*rate;
  const savings=pleiCostInd-pleiCostCons;
  const pleiCost=Math.min(pleiCostInd,pleiCostCons);
  const pleiArea=pleiCost===pleiCostCons?pleiAreaCons:pleiAreaInd;
  // Coûts monitoring filtrés par année (init et suivi N+3)
  const initCost =yearNewOnes.value.reduce((s,p)=>s+computeShpPrice(p.haiesCount,p.totalLengthM,pp.value),0);
  const suiviCost=yearSuiviOnes.value.reduce((s,p)=>s+computeShpPrice(p.haiesCount,p.totalLengthM,pp.value)*0.5,0);
  const hasActivity=yearNewOnes.value.length>0||yearSuiviOnes.value.length>0;
  const totalHT=(hasActivity?sub.value:0)+initCost+suiviCost+pleiCost;
  return {initCost,suiviCost,pleiCost,pleiArea,pleiAreaInd,pleiAreaCons,
          rawAreaInd,rawAreaCons,savings,pleiCostInd,pleiCostCons,
          totalHT,tva:totalHT*0.2,ttc:totalHT*1.2,
          minApplies:rawAreaInd<MIN_KM2||rawAreaCons<MIN_KM2};
});

function annProjInfo(p) {
  const projAOIs=annProjectAOIsYear.value.find(x=>x.projectId===p.id);
  const nClusters=projAOIs?projAOIs.aois.length:0;
  const area=projAOIs?projAOIs.aois.reduce((s,a)=>s+a.area,0):0;
  return {nClusters,area};
}
function annProjMonCost(p) {
  const price=computeShpPrice(p.haiesCount,p.totalLengthM,pp.value);
  return p.isNew?price:price*0.5;
}

function fmtKm2Compare(raw,eff) {
  return raw.toLocaleString('fr-FR',{maximumFractionDigits:2})+' km²'+(raw<100?' → <strong>100 km²</strong> min.':'')+' — '+fmt(eff*annEffRate.value);
}

// ── Color picker helpers ──────────────────────────────────────────────────
const colorPickerProj = computed(()=>colorPicker.projId?shpProjects.value.find(p=>p.id===colorPicker.projId):null);

function openColorPicker(projId,event) {
  event.stopPropagation();
  if(colorPicker.open&&colorPicker.projId===projId){colorPicker.open=false;return;}
  const rect=event.target.getBoundingClientRect();
  let top=rect.bottom+8, left=rect.left;
  if(left+240>window.innerWidth)  left=window.innerWidth-244;
  if(top+230>window.innerHeight)  top=rect.top-236;
  colorPicker.projId=projId;
  colorPicker.top=top;
  colorPicker.left=left;
  colorPicker.open=true;
  setTimeout(()=>document.addEventListener('click',closeColorPickerOutside),0);
}

function closeColorPickerOutside(e) {
  const cpop=document.querySelector('.cpop');
  if(!cpop||!cpop.contains(e.target)){
    colorPicker.open=false;
    document.removeEventListener('click',closeColorPickerOutside);
  } else {
    setTimeout(()=>document.addEventListener('click',closeColorPickerOutside),0);
  }
}

async function applyProjColor(projId,color) {
  if(!/^#[0-9a-fA-F]{6}$/.test(color)) return;
  const proj=shpProjects.value.find(p=>p.id===projId);
  if(!proj) return;
  proj.color=color;
  if(proj._layer){
    proj._layer.eachLayer(l=>{
      if(l instanceof L.CircleMarker) l.setStyle({fillColor:color,color:'#fff'});
      else if(l.setStyle) l.setStyle({color,fillColor:color});
    });
  }
  if(proj.dbId) await supabase.from('projets_agroforesterie').update({couleur:color}).eq('id',proj.dbId);
}

// ── Settings password ─────────────────────────────────────────────────────
function openSettings() {
  if (settingsUnlocked.value) { settingsOpen.value = !settingsOpen.value; return; }
  pwOpen.value = true;
}
function onPasswordUnlock() {
  settingsUnlocked.value = true;
  settingsOpen.value = true;
}

// ── Edit modal ────────────────────────────────────────────────────────────
function openEditModal(projId) {
  const proj = shpProjects.value.find(p => p.id === projId);
  if (!proj) return;
  editModal.projId = projId;
  const suiviYears = proj.suiviYears && proj.suiviYears.length > 0
    ? [...proj.suiviYears]
    : defaultSuiviYears(proj.annee);
  editModal.form = {
    name: proj.name,
    color: proj.color,
    haiesCount: proj.haiesCount,
    totalLengthM: proj.totalLengthM,
    annee: proj.annee,
    suiviYears
  };
  editModal.suiviYearOptions = Array.from({length:10}, (_,i) => proj.annee + 1 + i);
  editModal.open = true;
}

function closeEditModal() {
  editModal.open = false;
  editModal.projId = null;
}

function onEditAnneeChange() {
  editModal.suiviYearOptions = Array.from({length:10}, (_,i) => editModal.form.annee + 1 + i);
  editModal.form.suiviYears = defaultSuiviYears(editModal.form.annee);
}

function toggleEditSuiviYear(y) {
  const idx = editModal.form.suiviYears.indexOf(y);
  if (idx >= 0) editModal.form.suiviYears.splice(idx, 1);
  else editModal.form.suiviYears.push(y);
}

async function saveEditModal() {
  const proj = shpProjects.value.find(p => p.id === editModal.projId);
  if (!proj) return;
  proj.name = editModal.form.name;
  proj.annee = editModal.form.annee;
  proj.suiviYears = [...editModal.form.suiviYears];
  if (editModal.form.color !== proj.color) {
    await applyProjColor(proj.id, editModal.form.color);
  }
  if (proj.dbId) {
    await supabase.from('projets_agroforesterie')
      .update({nom: proj.name, annee: proj.annee, suivi_years: proj.suiviYears})
      .eq('id', proj.dbId);
  }
  updateShpMapStyles();
  closeEditModal();
}

// ── Map initialization ────────────────────────────────────────────────────

// Cache partagé pour les données BD ORTHO (chargé une seule fois par session)
let _deptOrthoData = null;
function invalidateOrthoCache() { _deptOrthoData = null; }

// Injecte les patterns SVG de hachures (une fois) pour les depts programmés 2026
function ensureHatchPatterns(colors) {
  if(document.getElementById('nimbo-hatch-svg')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'nimbo-hatch-svg';
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
  const defs = document.createElementNS(ns, 'defs');
  Object.entries(colors).forEach(([year, color]) => {
    const pat = document.createElementNS(ns, 'pattern');
    pat.id = `hatch-bdortho-${year}`;
    pat.setAttribute('patternUnits', 'userSpaceOnUse');
    pat.setAttribute('width', '8'); pat.setAttribute('height', '8');
    pat.setAttribute('patternTransform', 'rotate(45)');
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', '8'); rect.setAttribute('height', '8');
    rect.setAttribute('fill', color); rect.setAttribute('opacity', '0.55');
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1','0'); line.setAttribute('y1','0');
    line.setAttribute('x2','0'); line.setAttribute('y2','8');
    line.setAttribute('stroke', 'rgba(255,255,255,0.75)');
    line.setAttribute('stroke-width', '3');
    pat.appendChild(rect); pat.appendChild(line);
    defs.appendChild(pat);
  });
  svg.appendChild(defs);
  document.body.appendChild(svg);
}

// Ajoute un overlay choroplèthe BD ORTHO (millésimes) à un contrôle de couches Leaflet
async function addOrthoMillesimeOverlay(mapInst, layerCtrl) {
  const COLORS = {2026:'#2d6a4f', 2025:'#52b788', 2024:'#e9c46a', 2023:'#457b9d', 2022:'#e63946'};
  const PROG_LABEL = {
    'aerien':'Programme aérien 20cm', 'pleiades':'Programme Pléiades Néo 30cm', 'non_programme':'Non programmé'
  };
  const STATUT_LABEL = {
    'disponible_final':'Ortho finale disponible','termine':'Acquisition terminée',
    'en_cours':'Acquisition en cours','programme':'Programmé 2026','non_programme':'Non programmé'
  };
  ensureHatchPatterns(COLORS);
  try {
    if(!_deptOrthoData) {
      const { data } = await supabase.from('dept_ortho_disponibilites').select('*');
      _deptOrthoData = data || [];
    }
    const r = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson');
    const gj = await r.json();
    const orthoMap = {};
    _deptOrthoData.forEach(d => orthoMap[d.code_dept] = d);

    const layer = L.geoJSON(gj, {
      style: feat => {
        const d = orthoMap[feat.properties.code];
        const mil = d?.millesime_bdortho;
        const baseCol = d ? (COLORS[mil] || '#bbb') : '#bbb';
        const isProg = d?.statut_2026 === 'programme';
        return isProg
          ? {fillColor:`url(#hatch-bdortho-${mil})`, fillOpacity:1, color:'#aaa', weight:1, opacity:0.7}
          : {fillColor:baseCol, fillOpacity:0.55, color:'#fff', weight:1, opacity:0.8};
      },
      onEachFeature: (feat, lyr) => {
        const d = orthoMap[feat.properties.code];
        if(d) lyr.bindPopup(
          `<strong>${d.nom_dept} (${d.code_dept})</strong><br>Millésime BD ORTHO : <b>${d.millesime_bdortho}</b>` +
          (d.programme_2026 && d.programme_2026 !== 'non_programme'
            ? `<br>2026 : ${PROG_LABEL[d.programme_2026]||d.programme_2026} — ${STATUT_LABEL[d.statut_2026]||d.statut_2026}`
            : (d.statut_2026 === 'non_programme' ? '<br>2026 : Non programmé' : ''))
        );
      }
    });

    const legend = L.control({position:'bottomleft'});
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:rgba(255,255,255,0.92);padding:8px 12px;border-radius:4px;font-size:12px;line-height:1.9;box-shadow:0 1px 5px rgba(0,0,0,.3);';
      const hatchSwatch = y => {
        const c = COLORS[y];
        return `<span style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:3px;`+
          `background:repeating-linear-gradient(45deg,${c} 0px,${c} 3px,rgba(255,255,255,0.8) 3px,rgba(255,255,255,0.8) 6px);border-radius:2px"></span>`;
      };
      div.innerHTML = '<strong style="font-size:11px;display:block;margin-bottom:3px">BD ORTHO millésime</strong>' +
        [2026,2025,2024,2023,2022].map(y=>`<span style="color:${COLORS[y]};font-size:15px">■</span> ${y}`).join('<br>') +
        '<hr style="margin:5px 0;border-color:#ddd">' +
        hatchSwatch(2022) + '<span style="color:#666">Programmé 2026</span>';
      return div;
    };

    layerCtrl.addOverlay(layer, 'BD ORTHO (millésimes)');
    mapInst.on('overlayadd',    e => { if(e.layer===layer) legend.addTo(mapInst); });
    mapInst.on('overlayremove', e => { if(e.layer===layer) legend.remove(); });
  } catch(e) {
    console.warn('Overlay BD ORTHO millésimes non chargé :', e);
  }
}

// Ajoute les limites des départements français (overlay fixe, non-interactif).
// startOnOrtho : true si le fond actif au démarrage est une orthophoto (→ trait blanc).
async function addDeptBoundaries(mapInst, startOnOrtho = false) {
  try {
    const r = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson');
    const gj = await r.json();
    const deptLayer = L.geoJSON(gj, {
      style: startOnOrtho ? DEPT_STYLE_LIGHT : DEPT_STYLE_DARK,
      interactive: false,
      pane: 'overlayPane'
    }).addTo(mapInst);
    // Bascule automatique quand l'utilisateur change de fond de carte
    mapInst.on('baselayerchange', e => {
      const isOrtho = /esri|ortho/i.test(e.name);
      deptLayer.setStyle(isOrtho ? DEPT_STYLE_LIGHT : DEPT_STYLE_DARK);
    });
  } catch(e) {
    console.warn('Limites départementales non chargées :', e);
  }
}

function initShpMap() {
  if(shpMapInst){shpMapInst.invalidateSize();return;}
  shpMapInst=L.map('shp-map').setView([46.5,2.5],6);
  const cartoLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {attribution:'© OpenStreetMap contributors © CARTO',maxZoom:19});
  const orthoLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {attribution:'Tiles © Esri',maxZoom:19});
  cartoLayer.addTo(shpMapInst);
  const shpLayerCtrl=L.control.layers(
    {'Carte (CARTO)':cartoLayer,'Orthophotos (ESRI)':orthoLayer},
    {},
    {position:'topright',collapsed:false}
  ).addTo(shpMapInst);
  addDeptBoundaries(shpMapInst, false);
  shpLayerGroupInst=L.layerGroup().addTo(shpMapInst);
  addOrthoMillesimeOverlay(shpMapInst, shpLayerCtrl);
}

function initAnnMap() {
  if(annMapInst){annMapInst.invalidateSize();return;}
  annMapInst=L.map('ann-map').setView([46.5,2.5],6);
  const cartoLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap contributors © CARTO',maxZoom:19});
  const orthoLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles © Esri',maxZoom:19});
  cartoLayer.addTo(annMapInst);
  const annLayerCtrl=L.control.layers({'Carte (CARTO)':cartoLayer,'Orthophotographies (ESRI)':orthoLayer},{},{position:'topright',collapsed:false}).addTo(annMapInst);
  addDeptBoundaries(annMapInst, false);
  annLayerGroupInst=L.layerGroup().addTo(annMapInst);
  addOrthoMillesimeOverlay(annMapInst, annLayerCtrl);
}

// ── Map layer helpers ─────────────────────────────────────────────────────
function addShpToMap(proj) {
  if(!shpMapInst||!shpLayerGroupInst) return;
  const layer=L.geoJSON(proj.fc,{
    style:{color:proj.color,weight:3,opacity:0.85},
    pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:4,fillColor:proj.color,color:'#fff',weight:1,fillOpacity:0.8})
  });
  layer.bindPopup(f=>{
    const len=geomLength(f.feature.geometry);
    return '<strong>'+proj.name+'</strong>'+(len>0?'<br>Longueur : '+fmtLen(len):'');
  });
  layer.addTo(shpLayerGroupInst);
  proj._layer=layer;
  fitShpMap();
}

function fitShpMap() {
  if(!shpLayerGroupInst) return;
  const valid=shpLayerGroupInst.getLayers().filter(l=>typeof l.getBounds==='function');
  if(!valid.length) return;
  try {
    let b=valid[0].getBounds();
    for(let i=1;i<valid.length;i++) b=b.extend(valid[i].getBounds());
    if(b.isValid()) shpMapInst.fitBounds(b,{padding:[24,24]});
  }catch(e){}
}

// ── Map opacity based on selected year ────────────────────────────────────
function updateShpMapStyles() {
  if(!shpLayerGroupInst) return;
  const selectedYear=shpYear.value;
  shpProjects.value.forEach(proj=>{
    if(!proj._layer) return;
    const isCurrent=proj.annee===selectedYear;
    proj._layer.eachLayer(l=>{
      if(l instanceof L.CircleMarker){
        l.setStyle({fillOpacity:isCurrent?0.8:0.35,opacity:isCurrent?1:0.5});
      } else if(l.setStyle){
        l.setStyle({opacity:isCurrent?0.85:0.35,fillOpacity:isCurrent?0.3:0.08});
      }
    });
  });
}

// Helper: CSS class for year badge
function projYearClass(p) {
  if(p.annee===shpYear.value) return 'current';
  if(p.annee<shpYear.value) return 'past';
  return 'future';
}

// ── Year timeline helpers ──────────────────────────────────────────────────
function yearInitCountFor(y) {
  return shpProjects.value.filter(p => p.annee === y).length;
}
function yearSuiviCountFor(y) {
  return suiviMode.value === 'annuel'
    ? shpProjects.value.filter(p => p.annee < y).length
    : shpProjects.value.filter(p => isSuiviYear(p, y)).length;
}

// ── Project card status helpers (driven by shpYear) ───────────────────────
function projStatusLabel(p) {
  if (p.annee === shpYear.value) return 'Initialisation';
  if (p.annee < shpYear.value) {
    const suivi = suiviMode.value === 'annuel' || isSuiviYear(p, shpYear.value);
    return suivi ? 'Suivi' : 'Actif';
  }
  return 'Prévu';
}

function projStatusClass(p) {
  if (p.annee === shpYear.value) return 'new';
  if (p.annee < shpYear.value) {
    const suivi = suiviMode.value === 'annuel' || isSuiviYear(p, shpYear.value);
    return suivi ? 'existing' : 'inter';
  }
  return 'future';
}

function projYearCostColor(p) {
  if (p.annee === shpYear.value) return 'var(--green)';
  if (p.annee < shpYear.value) {
    const suivi = suiviMode.value === 'annuel' || isSuiviYear(p, shpYear.value);
    return suivi ? 'var(--gray-600)' : 'var(--gray-300,#b0bec5)';
  }
  return 'var(--blue)';
}

function projYearCostText(p) {
  const price = computeShpPrice(p.haiesCount, p.totalLengthM, pp.value);
  if (p.annee === shpYear.value) return fmt(price);
  if (p.annee < shpYear.value) {
    const suivi = suiviMode.value === 'annuel' || isSuiviYear(p, shpYear.value);
    return suivi ? fmt(price * 0.5) : '—';
  }
  return fmt(price);
}

function updateAnnMap() {
  if(!annMapInst||!annLayerGroupInst) return;
  annLayerGroupInst.clearLayers();
  const aois=annProjectAOIsYear.value;
  const consol=annConsolidationYear.value;

  annYearProjects.value.forEach(proj=>{
    if(!proj.fc) return;
    L.geoJSON(proj.fc,{
      style:{color:proj.color,weight:2,opacity:0.55},
      pointToLayer:(f,ll)=>L.circleMarker(ll,{radius:3,fillColor:proj.color,color:'#fff',weight:1,fillOpacity:0.7})
    }).addTo(annLayerGroupInst);
  });

  aois.forEach(projData=>{
    projData.aois.forEach((aoi,idx)=>{
      if(!aoi.hull) return;
      L.geoJSON(aoi.hull,{style:{color:projData.color,weight:1.5,opacity:0.9,fillColor:projData.color,fillOpacity:0.10,dashArray:'5 4'}})
       .bindPopup('<strong>'+projData.projectName+'</strong> — AOI '+(idx+1)+'<br>'+aoi.featureCount+' haie'+(aoi.featureCount>1?'s':'')+' · '+aoi.area.toLocaleString('fr-FR',{maximumFractionDigits:2})+' km²')
       .addTo(annLayerGroupInst);
    });
  });

  consol.groups.forEach(group=>{
    if(!group.mergedHull||!group.isMultiProject) return;
    L.geoJSON(group.mergedHull,{style:{color:'#1565c0',weight:2.5,opacity:0.85,fillColor:'#1565c0',fillOpacity:0.13,dashArray:'9 5'}})
     .bindPopup('<strong>Acquisition mutualisée</strong><br>'+group.projectIds.length+' projets · '+group.mergedArea.toLocaleString('fr-FR',{maximumFractionDigits:2})+' km²')
     .addTo(annLayerGroupInst);
  });

  const layers=annLayerGroupInst.getLayers().filter(l=>typeof l.getBounds==='function');
  if(layers.length){
    try {
      let b=layers[0].getBounds();
      for(let i=1;i<layers.length;i++){try{b=b.extend(layers[i].getBounds());}catch(e){}}
      if(b.isValid()) annMapInst.fitBounds(b,{padding:[24,24]});
    }catch(e){}
  }
}

// ── Shapefile project CRUD ────────────────────────────────────────────────
function onDrop(e) {
  isDragOver.value=false;
  handleShpFiles(e.dataTransfer.files);
}

function onFileChange(e) {
  handleShpFiles(e.target.files);
  e.target.value='';
}

async function handleShpFiles(files) {
  for(const file of files) await loadShpFile(file);
}

async function loadShpFile(file) {
  const name=file.name.replace(/\.zip$/i,'');
  try {
    const buffer=await file.arrayBuffer();
    const result=await shp(buffer);
    const fcs=Array.isArray(result)?result:[result];
    const features=fcs.flatMap(fc=>(fc&&fc.features)?fc.features:[]);
    const lineFeats=features.filter(f=>f.geometry&&['LineString','MultiLineString'].includes(f.geometry.type));
    const haiesCount=lineFeats.length>0?lineFeats.length:features.length;
    const totalLengthM=features.reduce((s,f)=>s+geomLength(f.geometry),0);
    const fc={type:'FeatureCollection',features};
    const color=SHP_COLORS[shpProjects.value.length%SHP_COLORS.length];
    const yearInName = name.match(/\b(20\d{2})\b/)?.[1];
    const annee = yearInName ? parseInt(yearInName) : (shpYear.value || new Date().getFullYear());
    const suiviYears=defaultSuiviYears(annee);
    const proj={id:shpNextId++,name,haiesCount,totalLengthM,isNew:true,color,fc,dbId:null,annee,suiviYears};
    shpProjects.value.push(proj);
    const {data,error}=await supabase.from('projets_agroforesterie')
      .insert({nom:name,haies_count:haiesCount,total_length_m:totalLengthM,is_new:true,couleur:color,geojson:fc,annee,suivi_years:suiviYears})
      .select().single();
    if(!error&&data) proj.dbId=data.id;
    addShpToMap(proj);
    updateShpMapStyles();
  }catch(e){
    alert('Erreur lors du chargement de « '+file.name+' » :\n'+e.message);
  }
}

async function removeShpProject(id) {
  const idx=shpProjects.value.findIndex(p=>p.id===id);
  if(idx<0) return;
  const proj=shpProjects.value[idx];
  if(proj.dbId) await supabase.from('projets_agroforesterie').delete().eq('id',proj.dbId);
  if(proj._layer&&shpLayerGroupInst) shpLayerGroupInst.removeLayer(proj._layer);
  shpProjects.value.splice(idx,1);
  if(selectedShpId.value===id) selectedShpId.value=null;
}

async function toggleShpStatus(id) {
  const proj=shpProjects.value.find(p=>p.id===id);
  if(!proj) return;
  proj.isNew=!proj.isNew;
  if(proj.dbId) await supabase.from('projets_agroforesterie').update({is_new:proj.isNew}).eq('id',proj.dbId);
}

function focusShpProject(id) {
  if(selectedShpId.value===id){
    selectedShpId.value=null;
    fitShpMap();
    return;
  }
  const proj=shpProjects.value.find(p=>p.id===id);
  if(!proj||!proj._layer) return;
  selectedShpId.value=id;
  try{const b=proj._layer.getBounds();if(b.isValid())shpMapInst.fitBounds(b,{padding:[30,30]});}catch(e){}
}

// ── Supabase: load from DB ────────────────────────────────────────────────
async function loadProjectsFromDB() {
  const {data,error}=await supabase.from('projets_agroforesterie').select('*').order('created_at');
  if(error){console.error('Supabase load error:',error);return;}
  if(!data||!data.length) return;
  for(const row of data){
    const proj={id:shpNextId++,dbId:row.id,name:row.nom,haiesCount:row.haies_count,
      totalLengthM:row.total_length_m,isNew:row.is_new,color:row.couleur,fc:row.geojson,
      annee:row.annee||new Date().getFullYear(),suiviYears:row.suivi_years||[]};
    shpProjects.value.push(proj);
    if(proj.fc) addShpToMap(proj);
  }
  updateShpMapStyles();
}

// ── 100 km² threshold search ──────────────────────────────────────────────
function computeRawAreaWith(bufM,clM,conKm) {
  const aois=shpProjects.value.map(proj=>({
    projectId:proj.id,projectName:proj.name,color:proj.color,
    aois:calcOptimizedProjectAOIs(proj,bufM,clM)
  }));
  return consolidateAOIs(aois,conKm).totalArea*annPadding.value;
}

function applyThreshold100() {
  if(!shpProjects.value.length) return;
  const MIN_KM2=100;
  if(computeRawAreaWith(annBufferM.value,annClusterM.value,annConsolKm.value)>=MIN_KM2){
    threshold100Label.value='✓ Seuil déjà atteint';
    setTimeout(()=>{threshold100Label.value='⊞ Seuil 100 km² — optimiser les paramètres';},2000);
    return;
  }
  threshold100Label.value='⏳ Calcul en cours…';
  setTimeout(()=>{
    let bufM=annBufferM.value,clM=annClusterM.value,conKm=annConsolKm.value,found=false;
    for(let b=bufM;b<=200;b+=25){
      if(computeRawAreaWith(b,clM,conKm)>=MIN_KM2){annBufferM.value=b;found=true;break;}
    }
    if(!found){
      bufM=200;annBufferM.value=200;
      for(let cl=clM;cl<=10000;cl+=500){
        if(computeRawAreaWith(bufM,cl,conKm)>=MIN_KM2){annClusterM.value=cl;found=true;break;}
      }
    }
    if(!found){
      clM=10000;annClusterM.value=10000;
      for(let ck=conKm;ck<=25;ck++){
        if(computeRawAreaWith(bufM,clM,ck)>=MIN_KM2){annConsolKm.value=ck;found=true;break;}
      }
    }
    if(!found){annBufferM.value=200;annClusterM.value=10000;annConsolKm.value=25;}
    threshold100Label.value='⊞ Seuil 100 km² — optimiser les paramètres';
  },20);
}

// ── Mode / sub-tab switching ──────────────────────────────────────────────
function setSuiviMode(mode) {
  if(suiviMode.value===mode) return;
  destroyShpCharts(); destroyAnnCharts();
  suiviMode.value=mode;
  nextTick(()=>setTimeout(()=>{
    if(mode==='triennal'){
      initShpMap(); updateShpMapStyles();
      if(shpProjects.value.length) updateShpCharts();
    } else {
      initShpMap(); // keep shp map initialised for when we switch back
      initAnnMap();
      if(shpProjects.value.length){updateAnnMap();updateAnnCharts();}
    }
  },30));
}
function setEvalSubTab(tab) {
  evalSubTab.value=tab;
  nextTick(()=>setTimeout(()=>{
    if(!shpProjects.value.length) return;
    if(tab==='eval'){
      if(suiviMode.value==='annuel'){updateAnnCharts();}
      else{updateShpCharts();}
    } else {
      updateShpCharts(); // redraws projection bar
    }
  },30));
}

// ── Tab switching ─────────────────────────────────────────────────────────
function setTab(tab) {
  if(activeTab.value==='shp'){ destroyShpCharts(); }
  else if(activeTab.value==='ann'){ destroyAnnCharts(); }
  activeTab.value=tab;
  nextTick(()=>setTimeout(()=>{
    if(tab==='shp'){
      initShpMap();
      updateShpMapStyles();
      if(shpProjects.value.length) updateShpCharts();
    } else if(tab==='ann'){
      initAnnMap();
      if(shpProjects.value.length){updateAnnMap();updateAnnCharts();}
    }
  },30));
}

// ── Chart helpers ─────────────────────────────────────────────────────────
function destroyShpCharts(){
  if(shpDonutInst){shpDonutInst.destroy();shpDonutInst=null;}
  if(shpInitInst) {shpInitInst.destroy(); shpInitInst=null;}
  if(shpSuiviInst){shpSuiviInst.destroy();shpSuiviInst=null;}
  if(shpProjBarInst){shpProjBarInst.destroy();shpProjBarInst=null;}
  if(shpAvgCostInst){shpAvgCostInst.destroy();shpAvgCostInst=null;}
}
function destroyAnnCharts(){
  if(annDonutInst){annDonutInst.destroy();annDonutInst=null;}
  if(annAreaInst) {annAreaInst.destroy(); annAreaInst=null;}
  if(annPleiInst) {annPleiInst.destroy(); annPleiInst=null;}
}

function getCtx(id){const c=document.getElementById(id);return c?c.getContext('2d'):null;}

function updateShpCharts(){
  const dCtx=getCtx('shp-donut-chart');
  if(dCtx){
    const dData=[sub.value,shpInitCostYear.value,shpSuiviCostYear.value];
    if(shpDonutInst){shpDonutInst.data.datasets[0].data=dData;shpDonutInst.update();}
    else {
      shpDonutInst=new Chart(dCtx,{type:'doughnut',
        data:{labels:['Abonnement','Initialisation','Suivi'],datasets:[{data:dData,backgroundColor:['#2d6a4f','#52b788','#95d5b2'],borderWidth:2,borderColor:'#fff'}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11},padding:8,boxWidth:12}},tooltip:{callbacks:{label:c=>` ${c.label} : ${Math.round(c.raw).toLocaleString('fr-FR')} €`}}}}
      });
    }
  }
  // Init bar
  const newOnes=yearNewOnes.value;
  if(newOnes.length){
    const iCtx=getCtx('shp-bar-init');
    if(iCtx){
      const iData=newOnes.map(p=>Math.round(computeShpPrice(p.haiesCount,p.totalLengthM,pp.value)));
      const iLabels=newOnes.map(p=>p.name), iColors=newOnes.map(p=>p.color);
      if(shpInitInst){shpInitInst.data.labels=iLabels;shpInitInst.data.datasets[0].data=iData;shpInitInst.data.datasets[0].backgroundColor=iColors;shpInitInst.update();}
      else {
        shpInitInst=new Chart(iCtx,{type:'bar',
          data:{labels:iLabels,datasets:[{label:'Init',data:iData,backgroundColor:iColors,borderRadius:4,borderSkipped:false}]},
          options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
            plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${Math.round(c.raw).toLocaleString('fr-FR')} €`}}},
            scales:{x:{ticks:{callback:v=>v.toLocaleString('fr-FR')+' €',font:{size:10}}},y:{ticks:{font:{size:11}}}}}
        });
      }
    }
  } else { if(shpInitInst){shpInitInst.destroy();shpInitInst=null;} }

  // Suivi bar
  const exOnes=yearSuiviOnes.value;
  if(exOnes.length){
    const sCtx=getCtx('shp-bar-suivi');
    if(sCtx){
      const sData=exOnes.map(p=>Math.round(computeShpPrice(p.haiesCount,p.totalLengthM,pp.value)*0.5));
      const sLabels=exOnes.map(p=>p.name), sColors=exOnes.map(p=>p.color);
      if(shpSuiviInst){shpSuiviInst.data.labels=sLabels;shpSuiviInst.data.datasets[0].data=sData;shpSuiviInst.data.datasets[0].backgroundColor=sColors;shpSuiviInst.update();}
      else {
        shpSuiviInst=new Chart(sCtx,{type:'bar',
          data:{labels:sLabels,datasets:[{label:'Suivi',data:sData,backgroundColor:sColors,borderRadius:4,borderSkipped:false}]},
          options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
            plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${Math.round(c.raw).toLocaleString('fr-FR')} €`}}},
            scales:{x:{ticks:{callback:v=>v.toLocaleString('fr-FR')+' €',font:{size:10}}},y:{ticks:{font:{size:11}}}}}
        });
      }
    }
  } else { if(shpSuiviInst){shpSuiviInst.destroy();shpSuiviInst=null;} }

  // Projection bar chart — 5 ans à partir de shpYear
  const bCtx=getCtx('shp-bar-proj');
  if(bCtx&&projectionRows.value.length){
    const rows=projectionRows.value.filter(r=>r.year>=shpYear.value&&r.year<shpYear.value+5);
    const labels=rows.map(r=>r.year.toString());
    const ds=[
      {label:'Abonnement',    data:rows.map(()=>sub.value),        backgroundColor:'#2d6a4f'},
      {label:'Initialisation',data:rows.map(r=>r.initCost),        backgroundColor:'#52b788'},
      {label:'Suivi',         data:rows.map(r=>r.suiviCost),       backgroundColor:'#95d5b2'}
    ];
    if(shpProjBarInst){
      shpProjBarInst.data.labels=labels;
      shpProjBarInst.data.datasets=ds;
      shpProjBarInst.update();
    } else {
      shpProjBarInst=new Chart(bCtx,{
        type:'bar',data:{labels,datasets:ds},
        options:{
          responsive:true,maintainAspectRatio:false,
          scales:{
            x:{stacked:true},
            y:{stacked:true,ticks:{callback:v=>v.toLocaleString('fr-FR')+' €'}}
          },
          plugins:{
            legend:{position:'top',labels:{font:{size:11},padding:10,boxWidth:12}},
            tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${Math.round(c.raw).toLocaleString('fr-FR')} €`}}
          }
        }
      });
    }
  }

  // Coût moyen par projet — line chart sur toute la plage
  const cCtx=getCtx('shp-avg-cost-proj');
  if(cCtx&&projectionRows.value.length){
    const rows=projectionRows.value.filter(r=>r.total>0);
    const labels=rows.map(r=>r.year.toString());
    const data=rows.map(r=>Math.round(r.totalHT/r.total));
    const isSelected=rows.map(r=>r.isSelected);
    if(shpAvgCostInst){
      shpAvgCostInst.data.labels=labels;
      shpAvgCostInst.data.datasets[0].data=data;
      shpAvgCostInst.data.datasets[0].pointBackgroundColor=isSelected.map(s=>s?'#e63946':'#457b9d');
      shpAvgCostInst.data.datasets[0].pointRadius=isSelected.map(s=>s?6:3);
      shpAvgCostInst.update();
    } else {
      shpAvgCostInst=new Chart(cCtx,{
        type:'line',
        data:{labels,datasets:[{
          label:'Coût moyen / projet',
          data,
          borderColor:'#457b9d',
          backgroundColor:'rgba(69,123,157,0.08)',
          fill:true,
          tension:0.35,
          pointBackgroundColor:isSelected.map(s=>s?'#e63946':'#457b9d'),
          pointRadius:isSelected.map(s=>s?6:3),
          pointHoverRadius:6,
          borderWidth:2
        }]},
        options:{
          responsive:true,maintainAspectRatio:false,
          scales:{
            y:{ticks:{callback:v=>v.toLocaleString('fr-FR')+' €'},beginAtZero:false}
          },
          plugins:{
            legend:{display:false},
            tooltip:{callbacks:{label:c=>` ${Math.round(c.raw).toLocaleString('fr-FR')} € / projet`}}
          }
        }
      });
    }
  }
}

function updateAnnCharts(){
  const pr=annPricing.value;
  const dCtx=getCtx('ann-donut-chart');
  if(dCtx){
    const dData=[sub.value,pr.initCost,pr.suiviCost,pr.pleiCost];
    if(annDonutInst){annDonutInst.data.datasets[0].data=dData;annDonutInst.update();}
    else {
      annDonutInst=new Chart(dCtx,{type:'doughnut',
        data:{labels:['Abonnement','Monitoring init.','Monitoring suivi','Pléiades'],datasets:[{data:dData,backgroundColor:['#2d6a4f','#52b788','#95d5b2','#1565c0'],borderWidth:2,borderColor:'#fff'}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:11},padding:8,boxWidth:12}},tooltip:{callbacks:{label:c=>` ${c.label} : ${Math.round(c.raw).toLocaleString('fr-FR')} €`}}}}
      });
    }
  }
  const perProjArea=annYearProjects.value.map(p=>{
    const pAOIs=annProjectAOIsYear.value.find(x=>x.projectId===p.id);
    return {name:p.name,color:p.color,area:pAOIs?pAOIs.aois.reduce((s,a)=>s+a.area,0):0};
  });
  if(annHasAreaYear.value){
    const aCtx=getCtx('ann-bar-area');
    if(aCtx){
      const aLabels=perProjArea.map(p=>p.name),aColors=perProjArea.map(p=>p.color),aData=perProjArea.map(p=>parseFloat(p.area.toFixed(3)));
      if(annAreaInst){annAreaInst.data.labels=aLabels;annAreaInst.data.datasets[0].data=aData;annAreaInst.data.datasets[0].backgroundColor=aColors;annAreaInst.update();}
      else {
        annAreaInst=new Chart(aCtx,{type:'bar',data:{labels:aLabels,datasets:[{label:'km²',data:aData,backgroundColor:aColors,borderRadius:4,borderSkipped:false}]},
          options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.raw.toLocaleString('fr-FR')} km²`}}},
            scales:{x:{ticks:{callback:v=>v+' km²',font:{size:10}}},y:{ticks:{font:{size:11}}}}}});
      }
    }
    const pCtx=getCtx('ann-bar-plei');
    if(pCtx){
      const aLabels=perProjArea.map(p=>p.name),aColors=perProjArea.map(p=>p.color);
      const pData=perProjArea.map(p=>Math.round(p.area*annEffRate.value*annPadding.value));
      if(annPleiInst){annPleiInst.data.labels=aLabels;annPleiInst.data.datasets[0].data=pData;annPleiInst.data.datasets[0].backgroundColor=aColors;annPleiInst.update();}
      else {
        annPleiInst=new Chart(pCtx,{type:'bar',data:{labels:aLabels,datasets:[{label:'€',data:pData,backgroundColor:aColors,borderRadius:4,borderSkipped:false}]},
          options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${Math.round(c.raw).toLocaleString('fr-FR')} €`}}},
            scales:{x:{ticks:{callback:v=>v.toLocaleString('fr-FR')+' €',font:{size:10}}},y:{ticks:{font:{size:11}}}}}});
      }
    }
  } else {
    if(annAreaInst){annAreaInst.destroy();annAreaInst=null;}
    if(annPleiInst){annPleiInst.destroy();annPleiInst=null;}
  }
}

// ── Watchers: update charts reactively ────────────────────────────────────
watch(shpYear, async ()=>{
  updateShpMapStyles();
  // Auto-scroll dans le tableau de projections si l'onglet est actif
  if (evalSubTab.value === 'projections') {
    await nextTick();
    const el = projTableRef.value?.querySelector('tr.proj-row-selected');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
});

watch([
  shpTotalHTYear,
  projectionRows,
  ()=>shpProjects.value.map(p=>p.color+p.isNew+p.annee+(p.suiviYears||[]).join(',')).join('|')
], async ()=>{
  if(!shpProjects.value.length) return;
  await nextTick(); updateShpCharts();
}, {deep:true});

watch([annPricing, annProjectAOIs], async ()=>{
  if(suiviMode.value!=='annuel'||!shpProjects.value.length) return;
  await nextTick(); updateAnnMap(); updateAnnCharts();
}, {deep:true});

// ── Pricing params persistence ────────────────────────────────────────────
async function loadPricingFromDB() {
  const {data, error} = await supabase
    .from('parametres_tarification').select('*').eq('id', 1).single();
  if (error || !data) return;
  sub.value         = data.sub;
  shpBase.value     = data.shp_base;
  shpScale.value    = data.shp_scale;
  shpWH.value       = data.shp_wh;
  shpMaxH.value     = data.shp_max_h;
  shpMaxML.value    = data.shp_max_ml;
  shpProg.value     = data.shp_prog;
  initRate.value    = data.init_rate;
  priceFloor.value  = data.price_floor;
  annDifficulty.value = data.ann_difficulty;
  annRate.value     = data.ann_rate;
  annCloud.value    = data.ann_cloud;
  annPadding.value  = data.ann_padding;
  annBufferM.value  = data.ann_buffer_m;
  annClusterM.value = data.ann_cluster_m;
  annConsolKm.value = data.ann_consol_km;
}

async function savePricingToDB() {
  await supabase.from('parametres_tarification').upsert({
    id: 1,
    sub:           sub.value,
    shp_base:      shpBase.value,
    shp_scale:     shpScale.value,
    shp_wh:        shpWH.value,
    shp_max_h:     shpMaxH.value,
    shp_max_ml:    shpMaxML.value,
    shp_prog:      shpProg.value,
    init_rate:     initRate.value,
    price_floor:   priceFloor.value,
    ann_difficulty: annDifficulty.value,
    ann_rate:      annRate.value,
    ann_cloud:     annCloud.value,
    ann_padding:   annPadding.value,
    ann_buffer_m:  annBufferM.value,
    ann_cluster_m: annClusterM.value,
    ann_consol_km: annConsolKm.value,
    updated_at:    new Date().toISOString()
  });
}

// Debounce : sauvegarde 800 ms après le dernier changement
let _savePricingTimer = null;
function scheduleSavePricing() {
  clearTimeout(_savePricingTimer);
  _savePricingTimer = setTimeout(savePricingToDB, 800);
}

watch(
  [sub, shpBase, shpScale, shpWH, shpMaxH, shpMaxML, shpProg,
   initRate, priceFloor, annDifficulty, annRate, annCloud,
   annPadding, annBufferM, annClusterM, annConsolKm],
  scheduleSavePricing
);

// ── Init ──────────────────────────────────────────────────────────────────
onMounted(()=>{
  setTimeout(()=>{
    if(suiviMode.value==='annuel') initAnnMap(); else initShpMap();
    loadProjectsFromDB();
    loadPricingFromDB();
  }, 120);
});
</script>

<style>
:root {
  --green:#2d6a4f;--green-mid:#52b788;--green-light:#95d5b2;
  --green-pale:#e8f5e9;--dark:#1b4332;--blue:#1565c0;--blue-pale:#e3f2fd;
  --gray-50:#f8fafb;--gray-100:#f1f5f2;--gray-200:#e2e8e4;
  --gray-600:#4a5e52;--gray-800:#1e2e24;
  --shadow:0 2px 12px rgba(0,0,0,.08);--r:12px;--r-sm:8px;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--gray-50);color:var(--gray-800);line-height:1.6;}
header{background:linear-gradient(135deg,var(--dark),var(--green));color:#fff;padding:20px 32px;}
header .brand{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.65;margin-bottom:4px;}
header h1{font-size:20px;font-weight:600;}
header p{font-size:12px;opacity:.7;margin-top:2px;}
.container{max-width:1400px;margin:0 auto;padding:20px;}
.tabs{display:flex;border-radius:var(--r);overflow:hidden;border:2px solid var(--green);width:fit-content;margin-bottom:16px;}
.tab{padding:9px 22px;cursor:pointer;font-size:13px;font-weight:500;background:#fff;color:var(--green);border:none;transition:.2s;}
.tab.active{background:var(--green);color:#fff;}
.tab:hover:not(.active){background:var(--green-pale);}
.opt-banner{font-size:12px;padding:7px 14px;border-radius:var(--r-sm);margin-bottom:20px;}
.opt-banner.standard{background:var(--green-pale);color:var(--green);border:1px solid #c8e6c9;}
.opt-banner.annual{background:var(--blue-pale);color:var(--blue);border:1px solid #bbdefb;}
.layout{display:grid;grid-template-columns:380px 1fr;gap:18px;align-items:start;}
.panel{background:#fff;border-radius:var(--r);box-shadow:var(--shadow);padding:22px;}
.panel-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--green);margin-bottom:18px;padding-bottom:10px;border-bottom:2px solid var(--green-pale);}
.proj-counter{font-size:11px;color:var(--gray-600);margin-left:6px;}
.sec-div{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--gray-600);font-weight:600;margin:18px 0 10px;padding-bottom:5px;border-bottom:1px solid var(--gray-200);}
.fgroup{margin-bottom:14px;}
.flabel{display:flex;justify-content:space-between;font-size:13px;font-weight:500;color:var(--gray-600);margin-bottom:5px;}
.fval{font-size:14px;font-weight:700;color:var(--green);}
input[type=range]{-webkit-appearance:none;width:100%;height:5px;border-radius:3px;background:var(--gray-200);outline:none;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--green);cursor:pointer;box-shadow:0 2px 5px rgba(45,106,79,.4);}
.irow{display:flex;align-items:center;gap:8px;margin-top:5px;}
.irow span{font-size:12px;color:var(--gray-600);}
input[type=number],select{padding:5px 8px;border:1.5px solid var(--gray-200);border-radius:var(--r-sm);font-size:13px;color:var(--gray-800);}
input[type=number]:focus,select:focus{outline:none;border-color:var(--green);}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;}
.mc{background:var(--gray-100);border-radius:var(--r-sm);padding:13px 15px;border-left:3px solid var(--green-mid);}
.mc.hl{background:linear-gradient(135deg,var(--green),var(--green-mid));border-left-color:transparent;}
.mc-label{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-600);font-weight:600;margin-bottom:3px;}
.mc.hl .mc-label{color:rgba(255,255,255,.7);}
.mc-val{font-size:21px;font-weight:700;color:var(--green);}
.mc.hl .mc-val{color:#fff;}
.mc-sub{font-size:11px;color:var(--gray-600);margin-top:1px;}
.mc.hl .mc-sub{color:rgba(255,255,255,.65);}
.brow{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--gray-100);}
.brow:last-child{border-bottom:none;}
.blabel{font-size:14px;color:var(--gray-600);}
.blabel small{font-size:11px;color:#aaa;margin-left:5px;}
.bamount{font-size:14px;font-weight:600;color:var(--gray-800);}
.brow.total .blabel{font-size:15px;font-weight:700;color:var(--gray-800);}
.brow.total .bamount{font-size:18px;font-weight:700;color:var(--green);}
.brow.sub-line .blabel{font-size:12px;color:#aaa;}
.brow.sub-line .bamount{font-size:12px;color:#aaa;}
.proj-section{margin-top:18px;}
table.proj-tbl{width:100%;border-collapse:collapse;font-size:12px;}
table.proj-tbl th{background:var(--green);color:#fff;padding:9px 12px;text-align:left;font-weight:600;font-size:11px;position:sticky;top:0;z-index:2;}
table.proj-tbl td{padding:8px 12px;border-bottom:1px solid var(--gray-100);}
table.proj-tbl tr:last-child td{border-bottom:none;}
table.proj-tbl tr:nth-child(even) td{background:var(--gray-50);}
table.proj-tbl tr.proj-row-selected td{background:var(--green-pale)!important;font-weight:700;}
table.proj-tbl tr.proj-row-future td{color:var(--blue);}
table.proj-tbl tr.proj-row-future td.amt{color:#1976d2;}
.proj-tbl-scroll{max-height:420px;overflow-y:auto;border-radius:var(--r-sm);border:1px solid var(--gray-200);}
td.amt{font-weight:600;color:var(--green);text-align:right;}
td.hl{font-weight:700;color:var(--dark);}
.pill{display:inline-block;padding:1px 8px;border-radius:20px;font-size:10px;font-weight:600;background:var(--green-pale);color:var(--green);}
.year-sel-wrap{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
.year-sel-label{font-size:12px;color:var(--gray-600);font-weight:500;white-space:nowrap;}
.year-badge{font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:var(--green-pale);color:var(--green);}
.year-badge.future{background:var(--blue-pale);color:var(--blue);}
.chart-wrap{position:relative;height:200px;margin-top:14px;}
footer{text-align:center;padding:16px;font-size:11px;color:var(--gray-600);margin-top:16px;}
@media(max-width:960px){.layout{grid-template-columns:1fr;}.metrics{grid-template-columns:1fr 1fr;}}
/* Shapefile tab */
.shp-dropzone{border:2px dashed var(--gray-200);border-radius:var(--r-sm);padding:22px 16px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;font-size:13px;color:var(--gray-600);}
.shp-dropzone:hover,.shp-dropzone.drag-over{border-color:var(--green);background:var(--green-pale);color:var(--green);}
.shp-proj-card{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--gray-100);cursor:pointer;border-radius:var(--r-sm);transition:background .1s;}
.shp-proj-card:hover{background:var(--gray-50);}
.shp-proj-card.selected{background:var(--green-pale);border-left:3px solid var(--green);padding-left:6px;}
.shp-proj-card:last-child{border-bottom:none;}
.shp-color-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;cursor:pointer;transition:transform .15s,box-shadow .15s;border:2px solid rgba(255,255,255,.6);}
.shp-color-dot:hover{transform:scale(1.25);box-shadow:0 0 0 3px rgba(45,106,79,.25);}
.cpop{position:fixed;z-index:3000;background:#fff;border-radius:var(--r);box-shadow:0 6px 28px rgba(0,0,0,.18);padding:14px 16px;width:232px;}
.cpop-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--green);margin-bottom:10px;}
.cpop-swatches{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
.cswatch{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .12s;outline:none;}
.cswatch:hover{transform:scale(1.2);}
.cswatch.active{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--dark);}
.cpop-hex{display:flex;align-items:center;gap:8px;margin-top:4px;}
.cpop-hex input[type=color]{width:34px;height:32px;border:none;padding:2px;cursor:pointer;border-radius:6px;background:none;}
.cpop-hex input[type=text]{flex:1;font-size:12px;font-family:monospace;padding:5px 8px;border:1.5px solid var(--gray-200);border-radius:var(--r-sm);}
.shp-proj-info{flex:1;min-width:0;}
.shp-proj-name{font-size:12px;font-weight:600;color:var(--gray-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.shp-proj-meta{font-size:11px;color:var(--gray-600);margin-top:1px;}
.yr-badge{font-size:10px;font-weight:600;padding:1px 7px;border-radius:20px;white-space:nowrap;}
.yr-badge.current{background:var(--green-pale);color:var(--green);}
.yr-badge.past{background:var(--gray-100);color:var(--gray-600);}
.yr-badge.future{background:var(--blue-pale);color:var(--blue);}
/* Year timeline strip */
.year-timeline{display:flex;align-items:stretch;gap:0;overflow:hidden;border-radius:var(--r-sm);border:1.5px solid var(--gray-200);}
.year-tile{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 6px 7px;cursor:pointer;border-right:1px solid var(--gray-200);transition:background .15s,color .15s;min-width:0;position:relative;}
.year-tile:last-child{border-right:none;}
.year-tile:hover{background:var(--green-pale);}
.year-tile.yt-selected{background:var(--green);color:#fff;}
.year-tile.yt-selected .yt-year{color:#fff;}
.year-tile.yt-selected .yt-pill{opacity:.85;}
.yt-year{font-size:14px;font-weight:700;color:var(--gray-800);line-height:1;}
.yt-pills{display:flex;gap:3px;flex-wrap:wrap;justify-content:center;min-height:16px;}
.yt-pill{font-size:9px;font-weight:700;padding:1px 5px;border-radius:20px;white-space:nowrap;line-height:14px;}
.yt-pill.yt-init{background:var(--green-pale);color:var(--green);}
.yt-pill.yt-suivi{background:var(--gray-100);color:var(--gray-600);}
.year-tile.yt-selected .yt-pill.yt-init{background:rgba(255,255,255,.3);color:#fff;}
.year-tile.yt-selected .yt-pill.yt-suivi{background:rgba(255,255,255,.2);color:rgba(255,255,255,.9);}
/* Timeline navigation */
.timeline-nav-btn{background:#fff;border:1.5px solid var(--gray-200);border-radius:var(--r-sm);cursor:pointer;font-size:15px;font-weight:700;padding:0 11px;color:var(--green);transition:.15s;flex-shrink:0;line-height:1;display:flex;align-items:center;}
.timeline-nav-btn:hover:not(:disabled){background:var(--green-pale);border-color:var(--green);}
.timeline-nav-btn:disabled{color:var(--gray-200);cursor:default;}
/* Mode toggle */
.mode-toggle{display:flex;border:2px solid var(--green);border-radius:var(--r-sm);overflow:hidden;width:fit-content;}
.mode-btn{padding:7px 20px;cursor:pointer;font-size:13px;font-weight:600;background:#fff;color:var(--green);border:none;transition:.2s;}
.mode-btn.active{background:var(--green);color:#fff;}
.mode-btn:hover:not(.active){background:var(--green-pale);}
.mode-btn-ann{color:var(--blue)!important;border-left:2px solid var(--green);}
.mode-btn-ann.active{background:var(--blue)!important;color:#fff!important;}
/* Sub-tabs */
.sub-tabs-bar{display:flex;border-bottom:2px solid var(--gray-200);margin:0 -22px 18px;padding:0 22px;gap:0;}
.sub-tab-btn{padding:10px 20px;cursor:pointer;font-size:13px;font-weight:500;background:none;color:var(--gray-600);border:none;border-bottom:2px solid transparent;margin-bottom:-2px;transition:.2s;white-space:nowrap;}
.sub-tab-btn.active{color:var(--green);border-bottom-color:var(--green);font-weight:600;}
.sub-tab-btn:hover:not(.active){color:var(--gray-800);}
.shp-opt-btn{font-size:12px;font-weight:600;padding:5px 12px;border:1.5px solid var(--green);border-radius:var(--r-sm);background:#fff;color:var(--green);cursor:pointer;transition:.15s;}
.shp-opt-btn.active{background:var(--green);color:#fff;}
.shp-opt-btn:hover:not(.active){background:var(--green-pale);}
.shp-stats-footer{margin-top:12px;padding-top:10px;border-top:1px solid var(--gray-200);font-size:12px;color:var(--gray-600);display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.proj-status-btn{font-size:10px;font-weight:600;padding:3px 7px;border-radius:20px;border:none;cursor:pointer;white-space:nowrap;transition:.15s;}
.proj-status-btn.new{background:var(--green-pale);color:var(--green);}
.proj-status-btn.new:hover{background:#c8e6c9;}
.proj-status-btn.existing{background:var(--gray-100);color:var(--gray-600);}
.proj-status-btn.existing:hover{background:var(--gray-200);}
.proj-status-btn.future{background:var(--blue-pale);color:var(--blue);}
.proj-status-btn.future:hover{background:#bbdefb;}
.proj-status-btn.inter{background:#fff8e1;color:#f57f17;}
.proj-status-btn.inter:hover{background:#fff3cd;}
.del-btn{background:none;border:none;color:#ccc;cursor:pointer;font-size:15px;line-height:1;padding:0 3px;}
.del-btn:hover{color:#e53935;}
.proj-empty{padding:20px;text-align:center;font-size:12px;color:var(--gray-600);}
.add-btn{font-size:12px;font-weight:600;padding:5px 12px;background:var(--green);color:#fff;border:none;border-radius:var(--r-sm);cursor:pointer;transition:.15s;}
.add-btn:hover{background:var(--dark);}
/* Settings panel */
#settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2000;cursor:pointer;}
#settings-panel{position:fixed;top:0;right:0;bottom:0;width:360px;background:#fff;z-index:2001;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.18);overflow:hidden;}
#settings-panel .sp-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:2px solid var(--green-pale);flex-shrink:0;}
#settings-panel .sp-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--green);}
#settings-panel .sp-close{background:none;border:none;font-size:22px;cursor:pointer;color:var(--gray-600);line-height:1;padding:0 2px;}
#settings-panel .sp-close:hover{color:var(--dark);}
#settings-panel .sp-body{padding:18px 20px;overflow-y:auto;flex:1;}
.gear-btn{background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.4);color:#fff;font-size:16px;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0;margin-top:4px;}
.gear-btn:hover{background:rgba(255,255,255,.28);}
/* Password modal */
.pw-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:4000;display:flex;align-items:center;justify-content:center;}
.pw-modal{background:#fff;border-radius:var(--r);box-shadow:0 8px 32px rgba(0,0,0,.22);padding:28px 28px 22px;width:300px;max-width:92vw;text-align:center;}
.pw-modal-icon{font-size:28px;margin-bottom:10px;}
.pw-modal-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--green);margin-bottom:4px;}
.pw-modal-sub{font-size:12px;color:var(--gray-600);margin-bottom:16px;}
.pw-input{width:100%;padding:9px 12px;border:1.5px solid var(--gray-200);border-radius:var(--r-sm);font-size:14px;text-align:center;letter-spacing:2px;outline:none;transition:border-color .15s;}
.pw-input:focus{border-color:var(--green);}
.pw-input.pw-error{border-color:#e53935;animation:pw-shake .25s;}
.pw-err-msg{font-size:11px;color:#e53935;margin-top:6px;min-height:16px;}
.pw-actions{display:flex;gap:8px;margin-top:16px;}
.pw-actions .btn-cancel{flex:1;}
.pw-actions .btn-save{flex:1;}
@keyframes pw-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
/* Tooltip générique */
[data-tip]{position:relative;}
[data-tip]::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:rgba(30,46,36,.88);color:#fff;font-size:10px;font-weight:600;white-space:nowrap;padding:3px 7px;border-radius:5px;pointer-events:none;opacity:0;transition:opacity .15s;}
[data-tip]:hover::after{opacity:1;}
/* Edit button */
.edit-btn{background:none;border:none;color:#ccc;cursor:pointer;font-size:13px;line-height:1;padding:0 2px;transition:color .15s;display:inline-flex;align-items:center;flex-shrink:0;}
.edit-btn span{display:inline-block;transform:rotate(90deg);}
.edit-btn:hover{color:var(--green);}
/* Edit project modal */
.edit-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:3500;display:flex;align-items:center;justify-content:center;}
.edit-modal{background:#fff;border-radius:var(--r);box-shadow:0 8px 32px rgba(0,0,0,.2);padding:24px;width:380px;max-width:94vw;max-height:90vh;overflow-y:auto;}
.edit-modal-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--green);margin-bottom:18px;padding-bottom:10px;border-bottom:2px solid var(--green-pale);display:flex;justify-content:space-between;align-items:center;}
.edit-modal-close{background:none;border:none;font-size:22px;cursor:pointer;color:var(--gray-600);line-height:1;padding:0 2px;}
.edit-modal-close:hover{color:var(--dark);}
.edit-field{margin-bottom:14px;}
.edit-field label{display:block;font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:5px;}
.edit-field input[type=text],.edit-field input[type=number]{width:100%;padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:var(--r-sm);font-size:13px;color:var(--gray-800);}
.edit-field input[type=text]:focus,.edit-field input[type=number]:focus{outline:none;border-color:var(--green);}
.edit-field .read-only-val{font-size:13px;font-weight:600;color:var(--gray-800);padding:7px 10px;background:var(--gray-100);border-radius:var(--r-sm);border:1.5px solid var(--gray-200);}
.suivi-years-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}
.suivi-year-chip{display:flex;align-items:center;padding:5px 12px;border:1.5px solid var(--gray-200);border-radius:20px;cursor:pointer;font-size:12px;font-weight:600;color:var(--gray-600);transition:.15s;user-select:none;}
.suivi-year-chip:hover{border-color:var(--green);color:var(--green);}
.suivi-year-chip.active{background:var(--green-pale);border-color:var(--green);color:var(--green);}
.edit-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid var(--gray-200);}
.btn-cancel{padding:8px 16px;background:#fff;border:1.5px solid var(--gray-200);border-radius:var(--r-sm);font-size:13px;font-weight:600;color:var(--gray-600);cursor:pointer;}
.btn-cancel:hover{background:var(--gray-100);}
.btn-save{padding:8px 20px;background:var(--green);border:none;border-radius:var(--r-sm);font-size:13px;font-weight:600;color:#fff;cursor:pointer;}
.btn-save:hover{background:var(--dark);}
</style>
