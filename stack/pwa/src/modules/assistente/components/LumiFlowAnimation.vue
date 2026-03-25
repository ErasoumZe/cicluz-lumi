<script setup lang="ts">
import { computed, useId } from 'vue'
import logoSymbolUrl from '~/assets/logo_novo_sem_escrito-removebg-preview.png'

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

const officialFullPath = 'M1236.9 1040.18L3371.9 2263.18L3659.57 2460.79C3681.57 2475.9 3700.31 2495.25 3714.71 2517.72L3820.98 2683.51C3832.52 2701.51 3841.09 2721.24 3846.38 2741.95L3878.86 2869.1C3887.09 2901.31 3887.15 2935.07 3879.05 2967.32L3841.98 3114.91C3839.59 3124.41 3836.51 3133.73 3832.76 3142.78L3774.09 3284.3C3762.13 3313.15 3743.57 3338.8 3719.92 3359.2L3615.81 3448.93C3591.24 3470.11 3561.88 3485 3530.27 3492.31L3250.56 3556.96C3205.21 3567.45 3157.62 3561.78 3116 3540.95L2729.1 3347.3C2705.26 3335.37 2677.02 3336.28 2654.01 3349.72C2630.6 3363.39 2615.85 3388.12 2614.94 3415.21L2601.99 3801.66C2600.78 3837.67 2589.87 3872.69 2570.41 3903.01L2468.52 4061.71C2453.92 4084.46 2434.87 4104 2412.5 4119.18L2277.44 4210.8C2257.57 4224.28 2235.44 4234.07 2212.1 4239.7L2041.63 4280.86C2013.48 4287.66 1984.18 4288.26 1955.78 4282.63L1759.08 4243.61C1718.31 4235.53 1681.07 4214.94 1652.54 4184.71L1475.8 3997.43C1450.05 3970.15 1432.49 3936.17 1425.14 3899.39L1363.78 3592.6C1361.2 3579.69 1359.9 3566.55 1359.9 3553.38V697.958C1359.9 666.868 1367.14 636.207 1381.06 608.408L1505.15 360.607C1520.39 330.161 1543.16 304.112 1571.29 284.926L1791.45 134.771C1838.21 102.882 1896.29 92.2961 1951.29 105.638L2291.55 188.175C2341.81 200.369 2385.4 231.565 2413.16 275.212L2556.43 500.492C2574.45 528.828 2585.05 561.246 2587.24 594.755L2600.15 791.931L2614.18 1006.32C2615.6 1028.07 2625.27 1048.46 2641.21 1063.33C2670.31 1090.48 2714.28 1094 2747.32 1071.83L2942.38 940.966C2958.96 929.839 2977.12 921.259 2996.25 915.512L3152.24 868.641C3170.91 863.031 3190.3 860.181 3209.79 860.181H3361.59C3397.15 860.181 3432.07 869.663 3462.75 887.65L3674.36 1011.72C3706.1 1030.33 3732.09 1057.34 3749.48 1089.77L3823.77 1228.39C3833.46 1246.48 3840.32 1265.95 3844.09 1286.12L3882.39 1491.01C3888.31 1522.66 3886.5 1555.26 3877.11 1586.06L3823.11 1763.26C3810.94 1803.2 3786.57 1838.34 3753.42 1863.73L3542.41 2025.36C3534.75 2031.23 3526.66 2036.54 3518.23 2041.25L1482.9 3176.68L1165.54 3405.49C1150.19 3416.56 1133.34 3425.4 1115.51 3431.73L891.868 3511.15C870.379 3518.78 847.742 3522.68 824.938 3522.68H569.854C528.563 3522.68 488.285 3509.9 454.547 3486.1L315.167 3387.75C300.06 3377.09 286.503 3364.38 274.886 3350L169.362 3219.35C146.801 3191.42 132.176 3157.93 127.022 3122.4L102.072 2950.41C98.9755 2929.07 99.3525 2907.36 103.189 2886.13L129.377 2741.22C133.035 2720.98 139.792 2701.43 149.411 2683.25L220.198 2549.47C238.588 2514.72 266.815 2486.15 301.349 2467.35L628.26 2289.39C657.93 2273.23 676.396 2242.16 676.396 2208.37C676.396 2175.99 659.415 2145.98 631.655 2129.3L417.968 2000.94C401.67 1991.15 386.852 1979.09 373.96 1965.11L205.231 1782.23C183.972 1759.19 168.429 1731.47 159.854 1701.32L108.915 1522.19C101.319 1495.48 99.3695 1467.48 103.19 1439.97L126.471 1272.35C131.962 1232.81 149.158 1195.82 175.846 1166.14L348.424 974.199C377.603 941.747 416.595 919.729 459.454 911.504L684.877 868.245C712.576 862.929 741.087 863.533 768.538 870.015L976.404 919.105C990.689 922.479 1004.56 927.415 1017.76 933.824L1236.9 1040.18Z'

const upperDiagonalPath = 'M1236.9 1040.18L3371.9 2263.18'
const rightLowerOuterPath = 'M3371.9 2263.18L3659.57 2460.79C3681.57 2475.9 3700.31 2495.25 3714.71 2517.72L3820.98 2683.51C3832.52 2701.51 3841.09 2721.24 3846.38 2741.95L3878.86 2869.1C3887.09 2901.31 3887.15 2935.07 3879.05 2967.32L3841.98 3114.91C3839.59 3124.41 3836.51 3133.73 3832.76 3142.78L3774.09 3284.3C3762.13 3313.15 3743.57 3338.8 3719.92 3359.2L3615.81 3448.93C3591.24 3470.11 3561.88 3485 3530.27 3492.31L3250.56 3556.96C3205.21 3567.45 3157.62 3561.78 3116 3540.95L2729.1 3347.3C2705.26 3335.37 2677.02 3336.28 2654.01 3349.72C2630.6 3363.39 2615.85 3388.12 2614.94 3415.21L2601.99 3801.66C2600.78 3837.67 2589.87 3872.69 2570.41 3903.01L2468.52 4061.71C2453.92 4084.46 2434.87 4104 2412.5 4119.18L2277.44 4210.8C2257.57 4224.28 2235.44 4234.07 2212.1 4239.7L2041.63 4280.86C2013.48 4287.66 1984.18 4288.26 1955.78 4282.63L1759.08 4243.61C1718.31 4235.53 1681.07 4214.94 1652.54 4184.71L1475.8 3997.43C1450.05 3970.15 1432.49 3936.17 1425.14 3899.39L1363.78 3592.6C1361.2 3579.69 1359.9 3566.55 1359.9 3553.38'
const axisTopRightOuterPath = 'M1359.9 3553.38V697.958C1359.9 666.868 1367.14 636.207 1381.06 608.408L1505.15 360.607C1520.39 330.161 1543.16 304.112 1571.29 284.926L1791.45 134.771C1838.21 102.882 1896.29 92.2961 1951.29 105.638L2291.55 188.175C2341.81 200.369 2385.4 231.565 2413.16 275.212L2556.43 500.492C2574.45 528.828 2585.05 561.246 2587.24 594.755L2600.15 791.931L2614.18 1006.32C2615.6 1028.07 2625.27 1048.46 2641.21 1063.33C2670.31 1090.48 2714.28 1094 2747.32 1071.83L2942.38 940.966C2958.96 929.839 2977.12 921.259 2996.25 915.512L3152.24 868.641C3170.91 863.031 3190.3 860.181 3209.79 860.181H3361.59C3397.15 860.181 3432.07 869.663 3462.75 887.65L3674.36 1011.72C3706.1 1030.33 3732.09 1057.34 3749.48 1089.77L3823.77 1228.39C3833.46 1246.48 3840.32 1265.95 3844.09 1286.12L3882.39 1491.01C3888.31 1522.66 3886.5 1555.26 3877.11 1586.06L3823.11 1763.26C3810.94 1803.2 3786.57 1838.34 3753.42 1863.73L3542.41 2025.36C3534.75 2031.23 3526.66 2036.54 3518.23 2041.25'
const lowerDiagonalPath = 'M3518.23 2041.25L1482.9 3176.68'
const lowerDiagonalReversedPath = 'M1482.9 3176.68L3518.23 2041.25'
const leftOuterPath = 'M1482.9 3176.68L1165.54 3405.49C1150.19 3416.56 1133.34 3425.4 1115.51 3431.73L891.868 3511.15C870.379 3518.78 847.742 3522.68 824.938 3522.68H569.854C528.563 3522.68 488.285 3509.9 454.547 3486.1L315.167 3387.75C300.06 3377.09 286.503 3364.38 274.886 3350L169.362 3219.35C146.801 3191.42 132.176 3157.93 127.022 3122.4L102.072 2950.41C98.9755 2929.07 99.3525 2907.36 103.189 2886.13L129.377 2741.22C133.035 2720.98 139.792 2701.43 149.411 2683.25L220.198 2549.47C238.588 2514.72 266.815 2486.15 301.349 2467.35L628.26 2289.39C657.93 2273.23 676.396 2242.16 676.396 2208.37C676.396 2175.99 659.415 2145.98 631.655 2129.3L417.968 2000.94C401.67 1991.15 386.852 1979.09 373.96 1965.11L205.231 1782.23C183.972 1759.19 168.429 1731.47 159.854 1701.32L108.915 1522.19C101.319 1495.48 99.3695 1467.48 103.19 1439.97L126.471 1272.35C131.962 1232.81 149.158 1195.82 175.846 1166.14L348.424 974.199C377.603 941.747 416.595 919.729 459.454 911.504L684.877 868.245C712.576 862.929 741.087 863.533 768.538 870.015L976.404 919.105C990.689 922.479 1004.56 927.415 1017.76 933.824L1236.9 1040.18'

const strokeWidth = 200
const transform = 'translate(49.104264758946634 26.77810729974375) scale(0.10177136061165089 0.1010017393454937)'

const ids = {
  mask: `lumi-flow-mask-${uid}`,
  glow: `lumi-flow-glow-${uid}`,
  upperGuide: `lumi-flow-upper-${uid}`,
  rightGuide: `lumi-flow-right-${uid}`,
  axisGuide: `lumi-flow-axis-${uid}`,
  lowerGuide: `lumi-flow-lower-${uid}`,
  leftGuide: `lumi-flow-left-${uid}`,
  beamAxis: `lumi-flow-beam-axis-${uid}`,
  beamRight: `lumi-flow-beam-right-${uid}`,
  beamLeft: `lumi-flow-beam-left-${uid}`,
  beamUpper: `lumi-flow-beam-upper-${uid}`,
  beamLower: `lumi-flow-beam-lower-${uid}`,
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const sizeValue = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const glow = computed(() => clamp(props.glowIntensity, 0, 1.2))
const speed = computed(() => Math.max(props.speed, 0.2))
const durationValue = computed(() => props.duration / speed.value)

const toSeconds = (value: number) => `${value.toFixed(2)}s`

const baseDuration = computed(() => toSeconds(durationValue.value))
const axisDuration = computed(() => toSeconds(durationValue.value * 0.96))
const rightDuration = computed(() => toSeconds(durationValue.value * 0.88))
const leftDuration = computed(() => toSeconds(durationValue.value * 1.02))
const upperDuration = computed(() => toSeconds(durationValue.value * 0.72))
const lowerDuration = computed(() => toSeconds(durationValue.value * 0.76))

const axisOffset = computed(() => toSeconds(-durationValue.value * 0.18))
const rightOffset = computed(() => toSeconds(-durationValue.value * 0.42))
const leftOffset = computed(() => toSeconds(-durationValue.value * 0.65))
const upperOffset = computed(() => toSeconds(-durationValue.value * 0.14))
const lowerOffset = computed(() => toSeconds(-durationValue.value * 0.48))

const beamOpacity = computed(() => (0.2 + glow.value * 0.24).toFixed(3))
const beamCoreOpacity = computed(() => (0.16 + glow.value * 0.18).toFixed(3))
const glowStdDeviation = computed(() => (1.2 + glow.value * 1.8).toFixed(2))

const rootStyle = computed(() => ({
  '--lumi-size': sizeValue.value,
}))
</script>

<template>
  <div class="lumi-flow" :style="rootStyle">
    <svg aria-label="Logo animada da Cicluz" class="lumi-flow__svg" :viewBox="viewBox" role="img">
      <defs>
        <path :id="ids.upperGuide" :d="upperDiagonalPath" :transform="transform" />
        <path :id="ids.rightGuide" :d="rightLowerOuterPath" :transform="transform" />
        <path :id="ids.axisGuide" :d="axisTopRightOuterPath" :transform="transform" />
        <path :id="ids.lowerGuide" :d="lowerDiagonalReversedPath" :transform="transform" />
        <path :id="ids.leftGuide" :d="leftOuterPath" :transform="transform" />

        <mask :id="ids.mask" x="0" y="0" width="510" height="490" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
          <path
            :d="officialFullPath"
            :transform="transform"
            fill="none"
            stroke="#fff"
            :stroke-width="strokeWidth"
            stroke-linejoin="round"
          />
        </mask>

        <filter :id="ids.glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" :stdDeviation="glowStdDeviation" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient :id="ids.beamAxis" x1="-96" y1="0" x2="96" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="22%" stop-color="rgba(255,90,90,0.06)" />
          <stop offset="52%" stop-color="rgba(67,223,212,0.28)" />
          <stop offset="82%" stop-color="rgba(203,245,78,0.14)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>

        <linearGradient :id="ids.beamRight" x1="-88" y1="0" x2="88" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="20%" stop-color="rgba(255,232,90,0.08)" />
          <stop offset="54%" stop-color="rgba(255,189,47,0.28)" />
          <stop offset="84%" stop-color="rgba(255,106,44,0.16)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>

        <linearGradient :id="ids.beamLeft" x1="-92" y1="0" x2="92" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="18%" stop-color="rgba(255,88,123,0.08)" />
          <stop offset="48%" stop-color="rgba(190,90,255,0.22)" />
          <stop offset="82%" stop-color="rgba(55,166,255,0.18)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>

        <linearGradient :id="ids.beamUpper" x1="-88" y1="0" x2="88" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="20%" stop-color="rgba(40,195,212,0.08)" />
          <stop offset="52%" stop-color="rgba(124,210,57,0.22)" />
          <stop offset="84%" stop-color="rgba(255,214,46,0.16)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>

        <linearGradient :id="ids.beamLower" x1="-88" y1="0" x2="88" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="22%" stop-color="rgba(255,70,58,0.1)" />
          <stop offset="54%" stop-color="rgba(255,143,45,0.22)" />
          <stop offset="84%" stop-color="rgba(255,214,46,0.14)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <image :href="logoSymbolUrl" x="0" y="0" width="510" height="490" preserveAspectRatio="xMidYMid meet" />

      <g :mask="`url(#${ids.mask})`" class="lumi-flow__motion">
        <g :filter="`url(#${ids.glow})`" :opacity="beamOpacity" style="mix-blend-mode: screen;">
          <g>
            <rect x="-94" y="-11" width="188" height="22" rx="11" :fill="`url(#${ids.beamAxis})`" />
            <animateMotion :dur="axisDuration" begin="0s" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.axisGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-86" y="-10" width="172" height="20" rx="10" :fill="`url(#${ids.beamRight})`" />
            <animateMotion :dur="rightDuration" :begin="rightOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.rightGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-90" y="-10" width="180" height="20" rx="10" :fill="`url(#${ids.beamLeft})`" />
            <animateMotion :dur="leftDuration" :begin="leftOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.leftGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-86" y="-9" width="172" height="18" rx="9" :fill="`url(#${ids.beamUpper})`" />
            <animateMotion :dur="upperDuration" begin="0s" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.upperGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-86" y="-9" width="172" height="18" rx="9" :fill="`url(#${ids.beamLower})`" />
            <animateMotion :dur="lowerDuration" :begin="lowerOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.lowerGuide}`" />
            </animateMotion>
          </g>
        </g>

        <g :opacity="beamCoreOpacity" style="mix-blend-mode: screen;">
          <g>
            <rect x="-34" y="-3.5" width="68" height="7" rx="3.5" fill="rgba(255,255,255,0.18)" />
            <animateMotion :dur="axisDuration" :begin="axisOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.axisGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-30" y="-3" width="60" height="6" rx="3" fill="rgba(255,244,184,0.18)" />
            <animateMotion :dur="rightDuration" :begin="rightOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.rightGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-30" y="-3" width="60" height="6" rx="3" fill="rgba(214,182,255,0.16)" />
            <animateMotion :dur="leftDuration" :begin="leftOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.leftGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-28" y="-2.5" width="56" height="5" rx="2.5" fill="rgba(227,255,191,0.14)" />
            <animateMotion :dur="upperDuration" :begin="upperOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.upperGuide}`" />
            </animateMotion>
          </g>

          <g>
            <rect x="-28" y="-2.5" width="56" height="5" rx="2.5" fill="rgba(255,228,184,0.14)" />
            <animateMotion :dur="lowerDuration" :begin="lowerOffset" rotate="auto" repeatCount="indefinite">
              <mpath :href="`#${ids.lowerGuide}`" />
            </animateMotion>
          </g>
        </g>
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

.lumi-flow__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.lumi-flow__motion {
  isolation: isolate;
}
</style>
