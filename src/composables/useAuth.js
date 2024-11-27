import { computed, watch, ref } from 'vue';
import { useStore } from 'vuex';
import UserService from './../services/user.service';

export function useAuth() {
  const store = useStore();
  const isUserLoaded = ref(false); 
  const user = computed(() => store.getters.getUserData);
  const isLoggedIn = computed(() => !!user.value && !!store.getters.getUserToken);

  watch(user, (newUser) => {
    if (newUser && Object.keys(newUser).length > 0) {
      isUserLoaded.value = true;
    }
  });

  async function loadUser() {
    const token = localStorage.getItem('userToken');
    if (token) {
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.id;
      try {
        const userData = await UserService.getUser(userId);
        store.dispatch('updateUserData', userData);
      } catch (error) {
        console.error('Erro ao buscar os dados do usuário:', error);
      }
    } else {
      console.error('Token JWT não encontrado no localStorage');
    }
  }

  return {
    user,
    isLoggedIn,
    loadUser,
    isUserLoaded
  };
}
