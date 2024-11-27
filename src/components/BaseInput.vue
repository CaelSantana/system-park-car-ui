<script setup>
import { computed } from 'vue';
import { vMaska } from "maska/vue"

const props = defineProps({
  label: {
    type: String,
  },
  type: {
    type: String,
    default: "text",
  },
  maska: {
    type: String,
    required: false
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
    required: true,
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
  },
  uppercase: { 
    type: Boolean, 
    default: false 
  }
});

const emit = defineEmits(['update:modelValue', 'blur']);

const updateValue = (value) => {
  emit('update:modelValue', value);
};

const maskaValue = {
  'text': { mask: 'Z*', tokens: { 'Z': { pattern: /[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ ]/ } } },
  'cep': `#####-###`,
  'date': `##/##/####`,
  'cpf': `###.###.###-##`,
  'money': ['#,##', '##,##', '###,##', '#.###,##', '##.###,##', '###.###,##', '#.###.###,##'],
  'phone': `(##) #####-####`
}[props.maska]

const inputClass = computed(() => {
  return [
    'w-full h-12 lg:max-w-lg border outline-none text-black px-4',
    props.variant === 'primary' && !props.disabled ? 'border-blue-800 placeholder-gray-500' : '',
    props.variant === 'secondary' && !props.disabled ? 'border-gray-400 placeholder-gray-500' : '',
    // props.variant === 'error' || props.errorMessage ? 'border-red-500 text-red-500 placeholder-red-400' : '',
    props.disabled ? 'bg-gray-100 text-gray-700 border-gray-500 cursor-not-allowed' : '',
    props.uppercase ? 'text-uppercase' : ''
  ].filter(Boolean).join(' ');
});

</script>

<template>
  <div class="w-full mb-5">
    <p v-if="label" :class="['text-blue-900 font-medium leading-none', label ? 'mb-2' : 'mb-0']">{{ label }}</p>
    <input
      :value="modelValue"
      v-maska="maskaValue"
      @input="updateValue($event.target.value)"
      @blur="$emit('blur', $event)"
      :type="type"
      :name="name"
      :class="inputClass"
      :placeholder="placeholder"
      autocomplete="off"
      required
      :disabled="disabled"
    />
    <p v-if="errorMessage" class="text-red-500 text-sm mt-1">{{ errorMessage }}</p>
  </div>
</template>

<style>
.text-uppercase {
  text-transform: uppercase;
}

.text-uppercase::placeholder {
  text-transform: none;
}
</style>
