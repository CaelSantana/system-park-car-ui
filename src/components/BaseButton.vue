<script setup>
import { ref } from 'vue';

const selectedFilter = ref('dia'); // Valor padrão
const setFilter = (filter) => {
  selectedFilter.value = filter;
};

const exportToExcel = () => {
  console.log('Exportando para Excel...');
};

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'button'
  },
  class: {
    type: String,
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {  // Propriedade opcional para o ícone
    type: String,
    default: null
  },
  btnClass: {
    type: String,
    default: 'primary'
  }
});

const emit = defineEmits(['click']);

</script>

<template>
  <button
    :type="type"
    :class="[
      'w-full h-12 lg:max-w-lg flex justify-center items-center outline-none gap-2 px-4',
      btnClass === 'primary' && !disabled ? 'bg-blue-800 text-white border-none cursor-pointer hover:bg-blue-400 transition-all duration-500' : '',
      btnClass === 'secondary' && !disabled ? 'border border-blue-800 text-blue-800 hover:bg-blue-800 hover:text-white transition-all duration-500' : '',
      btnClass === 'cancel' ? 'border border-red-500 text-red-500 cursor-pointer hover:bg-red-500 hover:text-white transition-all duration-500' : '',
      btnClass === 'link' ? 'text-gray-800 cursor-pointer  hover:opacity-70 transition-all duration-500' : '',
      disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed hover:bg-gray-500 hover:text-white transition-all duration-500' : '',
      props.class
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
  <component
      v-if="icon"
      :is="icon"
      class="shrink-0"
      :size="24"
    />
    {{ label }}
  </button>
</template>
