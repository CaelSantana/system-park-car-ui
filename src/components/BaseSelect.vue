<script setup>
import { computed } from 'vue';
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: 'Escolha',
  },
  errorMessage: {
    type: String,
    required: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'primary',
  }
});

const emit = defineEmits(['update:modelValue']);

const updateValue = (value) => {
  emit('update:modelValue', value);
};

const selectClasses = computed(() => {
  let baseClasses = 'w-full h-12 lg:max-w-lg px-4 border outline-none'
  let variantClasses = '';
  let errorClasses = '';

  if (props.disabled) {
    variantClasses = 'bg-gray-100 text-gray-900 border-gray-500 cursor-not-allowed';
  } else if (props.variant === 'primary') {
    variantClasses = 'border-blue-800 text-gray-900';
  } else if (props.variant === 'secondary') {
    variantClasses = 'border-gray-400 text-gray-900';
  }

  if (props.errorMessage) {
    errorClasses = 'border-blue-800';
  }

  return [baseClasses, variantClasses, errorClasses].join(' ');
});
</script>

<template>
  <div class="w-full mb-5">
    <p class="text-blue-900 font-medium leading-none mb-2">{{ label }}</p>
    <select
      :value="modelValue"
      @change="updateValue($event.target.value)"
      :name="name"
      :class="selectClasses"
      required
      :disabled="disabled"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="errorMessage" class="text-red-500 text-sm mt-1">{{ errorMessage }}</p>
  </div>
</template>