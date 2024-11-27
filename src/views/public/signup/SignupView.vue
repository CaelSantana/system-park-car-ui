<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useValidators } from '@/composables/useValidators';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';

const router = useRouter();
const store = useStore();
const formData = ref({
  roles_id: 1,
  full_name: '',
  email: '',
  cpf: '',
  birth: '',
  phone: ''
});

const {
  nameError,
  dateError,
  phoneError,
  emailError,
  cpfError,
  validateName,
  validateDate,
  validatePhone,
  validateEmail,
  validateCPF
} = useValidators(formData.value);

const isValid = computed(() => {
  return formData.value.full_name &&
    formData.value.email &&
    formData.value.cpf &&
    formData.value.birth &&
    formData.value.phone &&
    !nameError.value &&
    !dateError.value &&
    !phoneError.value &&
    !emailError.value &&
    !cpfError.value;
});

watch(() => formData.value.email, validateEmail);
watch(() => formData.value.cpf, validateCPF);
watch(() => formData.value.phone, validatePhone);
watch(() => formData.value.full_name, validateName);
watch(() => formData.value.birth, validateDate);

const createAccount = () => {
  if (isValid.value) {
    store.dispatch('updateUserData', formData.value);
    router.push({ name: 'password' });
  }
};

</script>

<template>
  <div class="container py-12 mx-auto">
    <div class="flex flex-col lg:flex-row gap-8">
      <div class="w-full lg:w-1/2 flex justify-center items-center">
        <img src="../../../assets/img/image-001.jpg" alt="Marca do estacionamento">
      </div>
      <div class="w-full lg:w-1/2 flex justify-center items-center lg:border-l border-gray-100">
        <form class="w-full max-w-md" @submit.prevent="createAccount">
          <p class="text-3xl font-semibold text-blue-800 mb-8">Crie sua conta</p>
          <BaseInput 
            label="Nome*"
            v-model="formData.full_name"
            name="name"
            @blur="validateName"
            placeholder="Informe seu nome"
            :errorMessage="nameError"
            required
            />
          <BaseInput 
            label="Data de nascimento*"
            v-model="formData.birth"
            maska="date"
            name="birth"
            @blur="validateDate"
            placeholder="00/00/0000"
            :errorMessage="dateError"
            required
          />
          <BaseInput 
            label="CPF*"
            v-model="formData.cpf"
            name="cpf"
            maska="cpf"
            @blur="validateCPF"
            placeholder="000.000.000-00"
            :errorMessage="cpfError"
            required
          />
          <BaseInput 
            label="E-mail*"
            v-model="formData.email"
            name="email"
            type="email"
            @blur="validateEmail"
            placeholder="Informe seu e-mail"
            :errorMessage="emailError"
            required
          />
          <BaseInput 
            label="Telefone*"
            v-model="formData.phone"
            maska="phone"
            name="phone"
            @blur="validatePhone"
            placeholder="(00) 00000-0000"
            :errorMessage="phoneError"
            required
          />
          <div class="mb-8">
            <BaseButton 
              type="submit"
              label="Salvar"
              :class="isValid"
              :disabled="!isValid"
            />
          </div>
          <p class="text-gray-900">Já possui conta? <span class="text-blue-800"><RouterLink to="/">Login</RouterLink></span></p>
        </form>
      </div>
    </div>
  </div>
</template>
