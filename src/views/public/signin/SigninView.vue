<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useValidators } from '@/composables/useValidators';

import BaseInput from '../../../components/BaseInput.vue';
import BaseButton from '../../../components/BaseButton.vue';
import { useToast } from '../../../composables/useToast';

const { addToast } = useToast();

const router = useRouter();
const store = useStore();

const showPassword = ref(false);

const formData = ref({
  email: '',
  password: ''
});

const {
  validateEmailLogin,
  emailError,
  validatePassword,
  passwordError,
} = useValidators(formData.value);

const errorMessage = ref('');

watch(() => formData.value.email, validateEmailLogin);
watch(() => formData.value.password, validatePassword);

const isValid = computed(() => {
  return formData.value.email &&
    !emailError.value &&
    formData.value.password &&
    !passwordError.value;
});

const login = () => {
  if (!isValid.value) {
    errorMessage.value = 'Por favor, preencha todos os campos corretamente.';
    addToast(errorMessage.value, 'error'); 
    return;
  }
  
  store.dispatch('login', { email: formData.value.email, password: formData.value.password })
    .then(() => {
      router.push('/perfil');
      addToast('Login realizado com sucesso!', 'success');
    })
    .catch(() => {
      errorMessage.value = 'Email ou senha inválidos. Por favor, tente novamente.';
      addToast(errorMessage.value, 'error');
    });
};

const callback = (response) => {
  const googleToken = response.credential;
  store.dispatch('googleLogin', googleToken)
    .then(() => {
      router.push('/perfil');
      addToast('Login com Google realizado com sucesso!', 'success');
    })
    .catch(() => {
      errorMessage.value = 'Erro durante a autenticação com Google. Tente novamente.';
      addToast(errorMessage.value, 'error');
    });
};

const togglePasswordVisibility = (type) => {
  if (type === 'password') {
    showPassword.value = !showPassword.value;
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
        <form class="w-full max-w-md" @submit.prevent="login">
          <p class="text-3xl font-semibold text-blue-800 mb-8">Login</p>
          <BaseInput 
            label="E-mail*"
            v-model="formData.email"
            name="email"
            type="email"
            @blur="validateEmailLogin"
            placeholder="Informe seu e-mail"
            :errorMessage="emailError"
            required
          />

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

          <div class="mb-8">
            <BaseButton 
              type="submit"
              label="Acessar"
              :class="isValid"
              :disabled="!isValid"
            />
          </div>
          
          <div class="flex justify-center mb-8">
            <GoogleLogin :callback="callback" prompt auto-login />
          </div>
          
          <p class="text-center text-gray-900">Já possui conta? <span class="text-blue-800"><RouterLink to="/criar-conta">Crie agora</RouterLink></span></p>

        </form>
      </div>
    </div>
  </div>
</template>
