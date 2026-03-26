<script setup lang="ts">
import { computed, useId } from 'vue'
import logoSymbolUrl from '~/assets/logo_novo_sem_escrito-removebg-preview.png'
import officialSvgRaw from '../../../../public/path.svg?raw'

const props = withDefaults(defineProps<{
  duration?: number
  glowIntensity?: number
  size?: number | string
  speed?: number
}>(), {
  duration: 9.8,
  glowIntensity: 0.42,
  size: 340,
  speed: 1,
})

const uid = useId().replace(/:/g, '')

const viewBox = '0 0 510 490'
const normalizedPathLength = 1000
const transform = 'translate(49.104264758946634 26.77810729974375) scale(0.10177136061165089 0.1010017393454937)'

const extractOfficialPath = (svgMarkup: string) => {
  const match = svgMarkup.match(/<path[^>]*d="([^"]+)"/i)

  if (!match) {
    throw new Error('Nao foi possivel localizar o path oficial da logo em path.svg.')
  }

  return match[1]
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const formatNumber = (value: number) => value.toFixed(2)

const officialFullPath = extractOfficialPath(officialSvgRaw)

const ids = {
  trailMask: `lumi-flow-trail-mask-${uid}`,
  glow: `lumi-flow-glow-${uid}`,
  aura: `lumi-flow-aura-${uid}`,
}

const sizeValue = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const glow = computed(() => clamp(props.glowIntensity, 0, 1.4))
const speed = computed(() => Math.max(props.speed, 0.2))
const durationValue = computed(() => props.duration / speed.value)

const trailStrokeWidth = computed(() => formatNumber(152 + glow.value * 42))
const trailLength = computed(() => 192 + glow.value * 86)
const trailGap = computed(() => normalizedPathLength + 420)
const trailDasharray = computed(() => {
  return `${formatNumber(trailLength.value)} ${formatNumber(trailGap.value)}`
})
const trailTravel = computed(() => {
  return formatNumber(trailLength.value + trailGap.value)
})

const coreOpacity = computed(() => formatNumber(0.72 + glow.value * 0.18))
const glowOpacity = computed(() => formatNumber(0.52 + glow.value * 0.18))
const auraOpacity = computed(() => formatNumber(0.26 + glow.value * 0.18))
const glowBlur = computed(() => formatNumber(4.6 + glow.value * 3.6))
const auraBlur = computed(() => formatNumber(12 + glow.value * 8.5))
const durationText = computed(() => `${durationValue.value.toFixed(2)}s`)

const rootStyle = computed(() => ({
  '--lumi-size': sizeValue.value,
}))
</script>

<template>
  <div
    class="lumi-flow"
    :style="rootStyle"
    aria-label="Logo animada da Cicluz"
    role="img"
  >
    <img
      :src="logoSymbolUrl"
      alt=""
      aria-hidden="true"
      class="lumi-flow__base-image"
    >

    <svg
      aria-hidden="true"
      class="lumi-flow__overlay"
      :viewBox="viewBox"
      shape-rendering="geometricPrecision"
    >
      <defs>
        <mask
          :id="ids.trailMask"
          x="0"
          y="0"
          width="510"
          height="490"
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
        >
          <path
            :d="officialFullPath"
            :transform="transform"
            fill="none"
            stroke="#ffffff"
            :stroke-width="trailStrokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
            :pathLength="normalizedPathLength"
            :stroke-dasharray="trailDasharray"
            stroke-dashoffset="0"
          >
            <animate
              attributeName="stroke-dashoffset"
              calcMode="linear"
              dur="0s"
              begin="indefinite"
              fill="freeze"
            />
            <animate
              attributeName="stroke-dashoffset"
              calcMode="linear"
              begin="0s"
              :dur="durationText"
              :values="`0; -${trailTravel}`"
              repeatCount="indefinite"
            />
          </path>
        </mask>

        <filter :id="ids.glow" x="-24%" y="-24%" width="148%" height="148%">
          <feGaussianBlur in="SourceGraphic" :stdDeviation="glowBlur" />
        </filter>

        <filter :id="ids.aura" x="-36%" y="-36%" width="172%" height="172%">
          <feGaussianBlur in="SourceGraphic" :stdDeviation="auraBlur" />
        </filter>
      </defs>

      <g class="lumi-flow__aura" :filter="`url(#${ids.aura})`" :opacity="auraOpacity">
        <g :mask="`url(#${ids.trailMask})`">
          <image
            :href="logoSymbolUrl"
            x="0"
            y="0"
            width="510"
            height="490"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      </g>

      <g class="lumi-flow__glow" :filter="`url(#${ids.glow})`" :opacity="glowOpacity">
        <g :mask="`url(#${ids.trailMask})`">
          <image
            :href="logoSymbolUrl"
            x="0"
            y="0"
            width="510"
            height="490"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      </g>

      <g class="lumi-flow__core" :mask="`url(#${ids.trailMask})`" :opacity="coreOpacity">
        <image
          :href="logoSymbolUrl"
          x="0"
          y="0"
          width="510"
          height="490"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.lumi-flow {
  position: relative;
  width: min(100%, var(--lumi-size));
  aspect-ratio: 510 / 490;
}

.lumi-flow__base-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.lumi-flow__overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.lumi-flow__aura,
.lumi-flow__glow,
.lumi-flow__core {
  isolation: isolate;
  mix-blend-mode: screen;
}
</style>
