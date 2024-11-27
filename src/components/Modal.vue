<script setup>

// Props para controlar a visibilidade e o título da modal
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Título da Modal'
  },
  class: {
    type: String,
  }
});

// Emit para fechar a modal
const emit = defineEmits(['close']);

function close() {
  emit('close');
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div :class="['w-full max-w-md relative bg-white rounded-lg mx-4', props.class]">
      <div class="flex justify-between items-center border-b p-4 lg:p-7">
        <h2 class="text-xl font-semibold text-blue-900">{{ title }}</h2>
        <button @click="close" class="text-red-500">
          <PhX :size="24" />
        </button>
      </div>
      <div class="p-4 lg:px-7 h-5/6 overflow-y-auto">
        <slot></slot>
      </div>
    </div>
  </div>
</template>



