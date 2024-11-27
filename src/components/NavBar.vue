<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import AuthService from '../services/auth.service';

import { ref } from 'vue';

const isMenuOpen = ref(false);
const beforeEnter = (el) => {};
const afterLeave = (el) => {};
const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };

const store = useStore();
const router = useRouter();
const route = useRoute();

const isLoggedIn = store.getters.getUserData;

const handleLogout = () => {
  AuthService.logout();
  store.dispatch('logout');
  router.push('/');
};

const props = defineProps({
  label: {
    type: String,
    required: true,
  }
});

const menus = computed(() => store.getters.getRoleMenus);

const isActive = (menuPath) => {
  return route.path === menuPath;
};

const getInitials = (fullName) => {
  if (!fullName) return '';
  const names = fullName.split(' ');
  const initials = names.map(name => name.charAt(0)).join('');
  return initials.toUpperCase();
};

const userInitials = computed(() => {
  return getInitials(isLoggedIn.full_name);
});

</script>

<template>
  <div class="relative bg-white lg:border-b lg:mb-12">
    <div class="container mx-auto">
      <div>
        <div class="h-16 flex justify-between items-center">
          <img src="../assets/img/logo.jpg" class="w-24" alt="Marca do estacionamento">
          <button @click="toggleMenu" class="lg:hidden text-3xl">
            <PhList :size="24" />
          </button>
          <div class="hidden lg:flex lg:items-center lg:space-x-4">
            <div class="flex items-center gap-2">
              <div>
                <p>{{ isLoggedIn.full_name }}</p>
                <p class="text-xs font-normal text-end text-blue-500">
                  {{ isLoggedIn.role === "ROLE_MASTER" ? "Administrador" : isLoggedIn.role === "ROLE_EMPLOYEE" ? "Operador" : "Cliente" }}
                </p>
              </div>
              <div v-if="isLoggedIn.full_name" class="w-12 h-12 flex justify-center items-center border border-gray-500 rounded-full">
                <p class="text-2xl font-extrabold text-gray-600">
                  {{ userInitials }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <transition name="fade-slide" @before-enter="beforeEnter" @after-leave="afterLeave" >
        <div v-if="isMenuOpen" class="fixed top-0 left-0 w-full h-screen bg-gray-900 bg-opacity-90 backdrop-blur-sm flex flex-col justify-center items-center gap-6 z-50 pb-24 mx-auto">
          <button v-for="menu in menus" :key="menu.path" type="button" :class="['text-white text-lg', isActive(menu.path) ? '!text-blue-400' : '']" >
            <RouterLink :to="menu.path">{{ menu.name }}</RouterLink>
          </button>
          <button @click="handleLogout" class="flex items-center text-gray-700 text-lg hover:text-blue-400">
            <PhSignOut :size="32" />
            <p class="ml-2">Sair</p>
          </button>
        </div>
      </transition>

      <div class="hidden lg:flex flex-row justify-center items-center gap-2">
        <div class="flex items-center gap-4">
          <button v-for="menu in menus" :key="menu.path" type="button" :class="['h-8 text-sm', isActive(menu.path) ? 'text-blue-500' : 'text-gray-600']" >
            <RouterLink :to="menu.path">{{ menu.name }}</RouterLink>
          </button>
          <button @click="handleLogout" class="h-8 text-sm text-center text-gray-700 hover:text-blue-500">
            <p>Sair</p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Efeitos de Entrada e Saída */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

</style>


