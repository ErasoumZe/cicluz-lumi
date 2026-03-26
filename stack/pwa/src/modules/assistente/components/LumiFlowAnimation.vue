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
  headMask: `lumi-flow-head-mask-${uid}`,
  coreTone: `lumi-flow-core-tone-${uid}`,
  inkField: `lumi-flow-ink-field-${uid}`,
  headGlow: `lumi-flow-head-glow-${uid}`,
  headAura: `lumi-flow-head-aura-${uid}`,
}

const sizeValue = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const glow = computed(() => clamp(props.glowIntensity, 0, 1.4))
const speed = computed(() => Math.max(props.speed, 0.2))
const durationValue = computed(() => props.duration / speed.value)

const headLength = computed(() => 84 + glow.value * 36)
const headGap = computed(() => normalizedPathLength - headLength.value)
const headDasharray = computed(() => {
  return `${formatNumber(headLength.value)} ${formatNumber(headGap.value)}`
})
const trailTravel = formatNumber(normalizedPathLength)
const headFrom = computed(() => formatNumber(-headLength.value))
const headTo = computed(() => formatNumber(-(normalizedPathLength + headLength.value)))
const headStrokeWidth = computed(() => formatNumber(210 + glow.value * 78))

const inkOpacity = computed(() => formatNumber(0.68 + glow.value * 0.14))
const coreSaturation = computed(() => formatNumber(1.85 + glow.value * 0.55))
const coreSlope = computed(() => 1.02 + glow.value * 0.05)
const headGlowBlur = computed(() => formatNumber(22 + glow.value * 12))
const headAuraBlur = computed(() => formatNumber(62 + glow.value * 24))
const headCoreOpacity = computed(() => formatNumber(clamp(0.9 + glow.value * 0.08, 0, 1)))
const headGlowOpacity = computed(() => formatNumber(clamp(0.96 + glow.value * 0.18, 0, 1)))
const headAuraOpacity = computed(() => formatNumber(clamp(0.86 + glow.value * 0.24, 0, 1)))
const toIntercept = (slope: number) => formatNumber(0.5 - slope / 2)
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
          :id="ids.headMask"
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
            :stroke-width="headStrokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
            :pathLength="normalizedPathLength"
            :stroke-dasharray="headDasharray"
            :stroke-dashoffset="headFrom"
          >
            <animate
              attributeName="stroke-dashoffset"
              calcMode="linear"
              begin="0s"
              :dur="durationText"
              :values="`${headFrom}; ${headTo}`"
              keyTimes="0;1"
              repeatCount="indefinite"
            />
          </path>
        </mask>

        <filter :id="ids.coreTone" x="-10%" y="-10%" width="120%" height="120%">
          <feColorMatrix in="SourceGraphic" type="saturate" :values="coreSaturation" result="core-tone" />
          <feComponentTransfer in="core-tone">
            <feFuncR type="linear" :slope="coreSlope" :intercept="toIntercept(coreSlope)" />
            <feFuncG type="linear" :slope="coreSlope" :intercept="toIntercept(coreSlope)" />
            <feFuncB type="linear" :slope="coreSlope" :intercept="toIntercept(coreSlope)" />
          </feComponentTransfer>
        </filter>

        <filter :id="ids.headGlow" x="-70%" y="-70%" width="240%" height="240%">
          <feColorMatrix in="SourceGraphic" type="saturate" values="2.35" result="head-glow-tone" />
          <feComponentTransfer in="head-glow-tone" result="head-glow-contrast">
            <feFuncR type="linear" slope="1.26" intercept="-0.1" />
            <feFuncG type="linear" slope="1.26" intercept="-0.1" />
            <feFuncB type="linear" slope="1.26" intercept="-0.1" />
          </feComponentTransfer>
          <feGaussianBlur in="head-glow-contrast" :stdDeviation="headGlowBlur" />
        </filter>

        <filter :id="ids.headAura" x="-120%" y="-120%" width="340%" height="340%">
          <feColorMatrix in="SourceGraphic" type="saturate" values="2.7" result="head-aura-tone" />
          <feComponentTransfer in="head-aura-tone" result="head-aura-contrast">
            <feFuncR type="linear" slope="1.18" intercept="-0.05" />
            <feFuncG type="linear" slope="1.18" intercept="-0.05" />
            <feFuncB type="linear" slope="1.18" intercept="-0.05" />
          </feComponentTransfer>
          <feGaussianBlur in="head-aura-contrast" :stdDeviation="headAuraBlur" />
        </filter>

        <g :id="ids.inkField">
          <ellipse cx="102" cy="196" rx="112" ry="132" fill="#7A5CFF" />
          <ellipse cx="148" cy="126" rx="98" ry="84" fill="#2A9BFF" />
          <ellipse cx="252" cy="84" rx="98" ry="82" fill="#2ED0C3" />
          <ellipse cx="332" cy="120" rx="88" ry="76" fill="#6ED64A" />
          <ellipse cx="408" cy="196" rx="108" ry="116" fill="#F4D12B" />
          <ellipse cx="338" cy="308" rx="122" ry="108" fill="#F19A2F" />
          <ellipse cx="238" cy="394" rx="132" ry="104" fill="#EF4328" />
          <ellipse cx="122" cy="300" rx="112" ry="116" fill="#D93468" />
        </g>
      </defs>

      <g class="lumi-flow__head-aura" :filter="`url(#${ids.headAura})`" :opacity="headAuraOpacity">
        <g :mask="`url(#${ids.headMask})`">
          <use :href="`#${ids.inkField}`" />
        </g>
      </g>

      <g class="lumi-flow__head-glow" :filter="`url(#${ids.headGlow})`" :opacity="headGlowOpacity">
        <g :mask="`url(#${ids.headMask})`">
          <use :href="`#${ids.inkField}`" />
        </g>
      </g>

      <g class="lumi-flow__head-core" :filter="`url(#${ids.coreTone})`" :mask="`url(#${ids.headMask})`" :opacity="headCoreOpacity">
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

.lumi-flow__head-aura,
.lumi-flow__head-glow,
.lumi-flow__head-core {
  isolation: isolate;
}

.lumi-flow__head-aura {
  mix-blend-mode: normal;
}

.lumi-flow__head-glow {
  mix-blend-mode: normal;
}

.lumi-flow__head-core {
  mix-blend-mode: normal;
}
</style>
