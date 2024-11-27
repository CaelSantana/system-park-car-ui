<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

import { useToast } from '../../../composables/useToast';
import { useValidators } from '@/composables/useValidators';

import BaseInput from '../../../components/BaseInput.vue';
import BaseButton from '../../../components/BaseButton.vue';
import authService from '../../../services/auth.service';

const { addToast } = useToast();

const router = useRouter();
const store = useStore();
const formData = ref({
  ...store.getters.getUserData,
  password: '',
  copyPassword: '',
});

const {
  passwordError,
  copyPasswordError,
  validatePassword,
  hasUpperCase,
  hasLowerCase,
  hasNumber,
  hasSpecialChar,
} = useValidators(formData.value);

watch(() => formData.value.password, validatePassword);
watch(() => formData.value.copyPassword, validatePassword);

const showPassword = ref(false);
const showCopyPassword = ref(false);


const isValid = computed(() => {
  const password = formData.value.password || '';
  const copyPassword = formData.value.copyPassword || '';
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  const isPasswordValid = password.trim() !== '' && passwordRegex.test(password);
  const isCopyPasswordValid = copyPassword === password;

  return isPasswordValid && isCopyPasswordValid;
});

function cancelCreateAccount() {
    store.dispatch('clearUserData');
    addToast('Criação de conta cancelada!', 'sucess');
    router.push('/')
};

const savePassword = async () => {
  if (!isValid.value) {
    errorMessage.value = 'Por favor, preencha todos os campos corretamente.';
    addToast(errorMessage.value, 'error'); 
    return;
  }

  try {
    await authService.createUser(formData.value);
    store.dispatch('clearUserData');
    addToast('Conta criada com sucesso!', 'sucess'); 
    router.push('/');
  } catch (error) {
    store.dispatch('clearUserData');
    addToast('Erro ao criar a conta.', 'error');
    router.push('/')
  }
};

const togglePasswordVisibility = (type) => {
  if (type === 'password') {
    showPassword.value = !showPassword.value;
  } else if (type === 'copyPassword') {
    showCopyPassword.value = !showCopyPassword.value;
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
        <form class="w-full max-w-md" @submit.prevent="savePassword">
          <p class="text-3xl font-semibold text-blue-800 mb-8">Defina uma senha</p>
          <div class="mb-4">
            <p class="text-gray-900">A senha deve conter no mínimo 6 caracteres e atender os itens abaixo:</p>
          </div>
          <div class="flex justify-between mb-8">
            <div>
              <p class="text-xl text-center" :class="hasUpperCase ? 'text-green-600' : 'text-gray-500'">A-Z</p>
              <p class="text-sm text-center" :class="hasUpperCase ? 'text-green-600' : 'text-gray-500'">Maiúscula</p>
            </div>
            <div>
              <p class="text-xl text-center" :class="hasLowerCase ? 'text-green-600' : 'text-gray-500'">a-z</p>
              <p class="text-sm text-center" :class="hasLowerCase ? 'text-green-600' : 'text-gray-500'">Minúscula</p>
            </div>
            <div>
              <p class="text-xl text-center" :class="hasNumber ? 'text-green-600' : 'text-gray-500'">0-9</p>
              <p class="text-sm text-center" :class="hasNumber ? 'text-green-600' : 'text-gray-500'">Números</p>
            </div>
            <div>
              <p class="text-xl text-center" :class="hasSpecialChar ? 'text-green-600' : 'text-gray-500'">@</p>
              <p class="text-sm text-center" :class="hasSpecialChar ? 'text-green-600' : 'text-gray-500'">Especial</p>
            </div>
          </div>
          <div class="relative mb-4">
            <BaseInput 
              label="Senha*"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              class="mb-0"
              placeholder="Digite sua senha"
              @blur="validatePassword"
              :errorMessage="passwordError"
              required
            />
            <span @click="togglePasswordVisibility('password')" class="absolute top-9 right-0 flex items-center pr-3 cursor-pointer">
              <component :is="showPassword ? 'PhEye' : 'PhEyeSlash'" :size="24" class="text-blue-800" />
            </span>
          </div>
          <div class="relative mb-4">
            <BaseInput 
              label="Repita a senha*"
              v-model="formData.copyPassword"
              :type="showCopyPassword ? 'text' : 'password'"
              name="copyPassword"
              class="mb-0"
              @blur="validatePassword"
              placeholder="Digite sua senha novamente"
              :errorMessage="copyPasswordError"
              required
            />
            <span @click="togglePasswordVisibility('copyPassword')" class="absolute top-9 right-0 flex items-center pr-3 cursor-pointer">
              <component :is="showCopyPassword ? 'PhEye' : 'PhEyeSlash'" :size="24" class="text-blue-800" />
            </span>
          </div>
          <div class="flex justify-between gap-4 mt-8">
            <BaseButton 
              label="Cancelar" 
              type="button" 
              btnClass="secondary" 
              @click="cancelCreateAccount"
            />
            <BaseButton 
              type="submit" 
              label="Salvar" 
              :class="isValid" 
              :disabled="!isValid" 
            />
          </div>
          <div class="w-full max-w-[400px] flex justify-between">
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
