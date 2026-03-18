<script setup lang="ts">
import { computed } from 'vue'
import { useBranding } from '../composables/useBranding'

const { logoSymbolUrl } = useBranding()

const maskStyle = computed(() => {
  return {
    '--logo-mask': `url("${logoSymbolUrl}")`,
  }
})
</script>

<template>
  <div class="flex w-full items-center justify-center px-4 py-8 sm:py-12">
    <div class="lumi-wait" :style="maskStyle">
      <div class="lumi-wait__glow" />
      <div class="lumi-wait__bloom" />
      <div class="lumi-wait__aura lumi-wait__aura--left" />
      <div class="lumi-wait__aura lumi-wait__aura--right" />
      <div class="lumi-wait__beam" />
      <div class="lumi-wait__symbol" />
      <div class="lumi-wait__sweep" />
    </div>
  </div>
</template>

<style scoped>
.lumi-wait {
  --cicluz-purple: #8b4fbc;
  --cicluz-blue: #2f7fd2;
  --cicluz-teal: #05a79d;
  --cicluz-green: #58b83b;
  --cicluz-yellow: #f7c514;
  --cicluz-orange: #f3a41c;
  --cicluz-red: #ef3a23;
  --cicluz-magenta: #c72f76;
  position: relative;
  width: min(40vw, 290px);
  min-width: 190px;
  aspect-ratio: 1;
  opacity: 0;
  transform: translate3d(0, 18px, 0) scale(0.88);
  animation: light-arrival 1.1s cubic-bezier(0.18, 0.9, 0.2, 1) 0.05s forwards;
}

.lumi-wait__glow {
  position: absolute;
  inset: 14%;
  border-radius: 9999px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(5, 167, 157, 0.22) 24%, rgba(247, 197, 20, 0.18) 47%, rgba(199, 47, 118, 0.14) 66%, transparent 82%);
  filter: blur(30px);
  opacity: 0;
  animation: glow-awaken 1.25s ease-out 0.08s forwards, glow-pulse 6.6s ease-in-out 1.2s infinite;
}

.lumi-wait__bloom {
  position: absolute;
  inset: 8%;
  border-radius: 9999px;
  background:
    radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.55) 18%, rgba(5, 167, 157, 0.18) 38%, rgba(247, 197, 20, 0.12) 55%, transparent 74%);
  filter: blur(34px);
  opacity: 0;
  transform: scale(0.76);
  animation: bloom-flash 1.3s cubic-bezier(0.2, 0.9, 0.2, 1) 0.04s forwards;
}

.lumi-wait__aura {
  position: absolute;
  border-radius: 9999px;
  filter: blur(24px);
  opacity: 0;
  animation: aura-enter 1.2s ease-out 0.18s forwards, aura-float 7.5s ease-in-out 1.2s infinite;
}

.lumi-wait__aura--left {
  inset: 18% auto auto 4%;
  height: 30%;
  width: 30%;
  background: radial-gradient(circle, rgba(47, 127, 210, 0.34) 0%, rgba(139, 79, 188, 0.22) 34%, transparent 72%);
}

.lumi-wait__aura--right {
  inset: auto 6% 14% auto;
  height: 34%;
  width: 34%;
  background: radial-gradient(circle, rgba(247, 197, 20, 0.34) 0%, rgba(243, 164, 28, 0.2) 38%, transparent 72%);
  animation-delay: -2.8s;
}

.lumi-wait__symbol,
.lumi-wait__symbol::before,
.lumi-wait__symbol::after,
.lumi-wait__sweep {
  position: absolute;
  inset: 0;
  -webkit-mask-image: var(--logo-mask);
  mask-image: var(--logo-mask);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.lumi-wait__beam {
  position: absolute;
  inset: 16% 8%;
  border-radius: 9999px;
  background: linear-gradient(110deg, transparent 12%, rgba(255, 255, 255, 0.08) 34%, rgba(255, 255, 255, 0.92) 48%, rgba(255, 255, 255, 0.12) 62%, transparent 82%);
  filter: blur(18px);
  opacity: 0;
  transform: translate3d(-12%, 10%, 0) rotate(-12deg) scale(0.9);
  animation: beam-pass 1.35s cubic-bezier(0.2, 0.92, 0.18, 1) 0.16s forwards;
}

.lumi-wait__symbol {
  background:
    conic-gradient(
      from 218deg at 50% 50%,
      var(--cicluz-magenta) 0deg,
      var(--cicluz-purple) 48deg,
      var(--cicluz-blue) 98deg,
      var(--cicluz-teal) 152deg,
      var(--cicluz-green) 208deg,
      var(--cicluz-yellow) 258deg,
      var(--cicluz-orange) 306deg,
      var(--cicluz-red) 340deg,
      var(--cicluz-magenta) 360deg
    );
  background-position: 18% 18%;
  background-size: 190% 190%;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.22));
  opacity: 0;
  transform: scale(0.92);
  animation:
    symbol-ignite 1.05s cubic-bezier(0.18, 0.94, 0.24, 1) 0.18s forwards,
    symbol-breathe 6.4s ease-in-out 1.12s infinite,
    spectrum-flow 11.5s linear 1.12s infinite;
}

.lumi-wait__symbol::before {
  content: '';
  inset: -20%;
  background:
    radial-gradient(circle at 18% 24%, rgba(255, 255, 255, 0.96) 0 5%, transparent 12%),
    radial-gradient(circle at 78% 26%, rgba(255, 255, 255, 0.86) 0 4.5%, transparent 12%),
    radial-gradient(circle at 24% 78%, rgba(255, 255, 255, 0.82) 0 4%, transparent 11%),
    radial-gradient(circle at 78% 76%, rgba(255, 255, 255, 0.72) 0 4%, transparent 11%),
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.12) 24%, rgba(255, 255, 255, 0.96) 48%, rgba(255, 255, 255, 0.14) 72%, transparent 100%);
  background-position:
    18% 24%,
    78% 26%,
    24% 78%,
    78% 76%,
    -24% 50%;
  background-size:
    24% 24%,
    22% 22%,
    20% 20%,
    20% 20%,
    220% 100%;
  mix-blend-mode: screen;
  filter: blur(2px);
  opacity: 0;
  animation: vein-reveal 0.95s ease-out 0.28s forwards, vein-flow 5.2s ease-in-out 1.12s infinite alternate;
}

.lumi-wait__symbol::after {
  content: '';
  inset: -8%;
  background:
    radial-gradient(circle at 16% 22%, rgba(47, 127, 210, 0.96) 0%, transparent 18%),
    radial-gradient(circle at 78% 22%, rgba(247, 197, 20, 0.94) 0%, transparent 18%),
    radial-gradient(circle at 26% 76%, rgba(199, 47, 118, 0.92) 0%, transparent 18%),
    radial-gradient(circle at 78% 80%, rgba(239, 58, 35, 0.92) 0%, transparent 16%),
    radial-gradient(circle at 50% 50%, rgba(88, 184, 59, 0.74) 0%, transparent 22%);
  opacity: 0;
  filter: blur(10px);
  animation: chroma-reveal 1s ease-out 0.34s forwards, chroma-drift 7.8s ease-in-out 1.12s infinite alternate;
}

.lumi-wait__sweep {
  background:
    linear-gradient(
      108deg,
      transparent 0%,
      transparent 28%,
      rgba(255, 255, 255, 0.18) 40%,
      rgba(255, 255, 255, 0.98) 50%,
      rgba(255, 255, 255, 0.22) 60%,
      transparent 74%,
      transparent 100%
    );
  background-position: -160% 50%;
  background-size: 220% 100%;
  opacity: 0;
  mix-blend-mode: screen;
  animation: light-sweep 1.3s cubic-bezier(0.16, 0.88, 0.24, 1) 0.12s forwards, soft-sheen 6.8s ease-in-out 1.8s infinite;
}

@keyframes light-arrival {
  0% {
    opacity: 0;
    transform: translate3d(0, 18px, 0) scale(0.88);
  }

  55% {
    opacity: 1;
    transform: translate3d(0, -2px, 0) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes glow-awaken {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }

  62% {
    opacity: 0.94;
    transform: scale(1.08);
  }

  100% {
    opacity: 0.64;
    transform: scale(0.98);
  }
}

@keyframes bloom-flash {
  0% {
    opacity: 0;
    transform: scale(0.76);
  }

  42% {
    opacity: 0.96;
    transform: scale(1.12);
  }

  100% {
    opacity: 0.18;
    transform: scale(1.26);
  }
}

@keyframes aura-enter {
  0% {
    opacity: 0;
    transform: scale(0.78);
  }

  100% {
    opacity: 0.72;
    transform: scale(1);
  }
}

@keyframes beam-pass {
  0% {
    opacity: 0;
    transform: translate3d(-16%, 16%, 0) rotate(-14deg) scale(0.84);
  }

  30% {
    opacity: 0.98;
  }

  100% {
    opacity: 0;
    transform: translate3d(14%, -14%, 0) rotate(-8deg) scale(1.12);
  }
}

@keyframes symbol-ignite {
  0% {
    opacity: 0;
    transform: scale(0.9);
    filter: drop-shadow(0 0 0 rgba(255, 255, 255, 0));
  }

  55% {
    opacity: 1;
    transform: scale(1.028);
    filter: drop-shadow(0 0 26px rgba(255, 255, 255, 0.46));
  }

  100% {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 0 18px rgba(255, 255, 255, 0.22));
  }
}

@keyframes spectrum-flow {
  0% {
    background-position: 18% 16%;
  }

  50% {
    background-position: 82% 44%;
  }

  100% {
    background-position: 30% 82%;
  }
}

@keyframes symbol-breathe {
  0%,
  100% {
    transform: scale(0.992);
  }

  50% {
    transform: scale(1.018);
  }
}

@keyframes vein-reveal {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 0.92;
  }
}

@keyframes vein-flow {
  0% {
    background-position:
      16% 22%,
      80% 24%,
      26% 80%,
      76% 74%,
      0% 50%;
    opacity: 0.72;
  }

  50% {
    background-position:
      30% 16%,
      72% 32%,
      34% 66%,
      68% 82%,
      72% 50%;
    opacity: 0.98;
  }

  100% {
    background-position:
      42% 26%,
      62% 18%,
      18% 72%,
      82% 68%,
      132% 50%;
    opacity: 0.8;
  }
}

@keyframes chroma-reveal {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 0.9;
  }
}

@keyframes chroma-drift {
  0% {
    background-position:
      16% 22%,
      78% 22%,
      26% 76%,
      78% 80%,
      50% 50%;
    opacity: 0.82;
  }

  50% {
    background-position:
      26% 10%,
      84% 34%,
      36% 66%,
      68% 88%,
      44% 42%;
    opacity: 0.96;
  }

  100% {
    background-position:
      10% 30%,
      70% 16%,
      22% 84%,
      86% 66%,
      58% 58%;
    opacity: 0.88;
  }
}

@keyframes light-sweep {
  0% {
    opacity: 0;
    background-position: -160% 50%;
  }

  18% {
    opacity: 0.08;
  }

  42% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    background-position: 160% 50%;
  }
}

@keyframes soft-sheen {
  0%,
  100% {
    opacity: 0.08;
    background-position: -40% 50%;
  }

  50% {
    opacity: 0.18;
    background-position: 70% 50%;
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.52;
    transform: scale(0.94);
  }

  50% {
    opacity: 0.86;
    transform: scale(1.06);
  }
}

@keyframes aura-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(0.92);
  }

  50% {
    transform: translate3d(4%, -6%, 0) scale(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lumi-wait {
    opacity: 1;
    transform: none;
  }

  .lumi-wait__glow,
  .lumi-wait__bloom,
  .lumi-wait__aura,
  .lumi-wait__beam,
  .lumi-wait__symbol,
  .lumi-wait__symbol::before,
  .lumi-wait__symbol::after,
  .lumi-wait__sweep {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
