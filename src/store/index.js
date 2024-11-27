import { createStore } from 'vuex';
import AuthService from '../services/auth.service';
import { roleMenus } from './permissions';

function loadUserData() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : {};
}

function loadUserToken() {
  return localStorage.getItem('userToken') || null;
}

const store = createStore({
  state: {
    userData: loadUserData(),
    userToken: loadUserToken()
  },
  mutations: {
    setUserData(state, data) {
      state.userData = data;
      localStorage.setItem('user', JSON.stringify(data));
    },
    setUserToken(state, token) {
      state.userToken = token;
      localStorage.setItem('userToken', token);
    },
    clearUserData(state) {
      state.userData = {};
      state.userToken = null;
      localStorage.removeItem('user');
      localStorage.removeItem('userToken');
    }
  },
  actions: {
    login({ commit }, user) {
      return AuthService.login(user).then(response => {
        commit('setUserData', response.user);
        commit('setUserToken', response.token);
        return response;
      });
    },
    googleLogin({ commit }, googleToken) {
      return AuthService.googleLogin(googleToken).then(response => {
        commit('setUserData', response.user);
        commit('setUserToken', response.token);
        return response;
      });
    },
    logout({ commit }) {
      AuthService.logout();
      commit('clearUserData');
    },
    updateUserData({ commit }, data) {
      commit('setUserData', data);
    },
    clearUserData({ commit }) {
      commit('clearUserData');
    }
  },
  getters: {
    getUserData: state => state.userData,
    getUserToken: state => state.userToken,
    isLoggedIn: state => !!state.userToken,
    getUserRole: state => state.userData.role,
    getRoleMenus: state => {
      const role = state.userData.role;
      return role ? roleMenus[role] : [];
    }
  }
});

export default store;
