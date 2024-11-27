<script setup>
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  position: {
    type: String,
    default: 'top'
  }
});
</script>

<template>
  <div class="relative group inline-block">
    <!-- Ícone recebido via props -->
    <slot name="icon"></slot>

    <!-- Tooltip -->
    <div class="w-48 absolute hidden group-hover:flex items-center justify-center bg-white border border-gray-500 text-sm rounded py-3 px-5"
      :class="`tooltip-${position}`"
    >
    <p class="text-blue-900">{{ text }}</p>
    </div>
  </div>
</template>

<style>
/* Estilos para o tooltip */
.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 0.5rem;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
}

/* Alteração para telas menores que 640px */
@media (max-width: 640px) {
  .tooltip-top,
  .tooltip-left,
  .tooltip-right {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.5rem;
  }
}
</style>
