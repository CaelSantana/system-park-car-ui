import api from './api.js';

class AuthService {

  createUser(userData) {
    return api.post('/users', userData).then(result => {
      return result.data;
    });
  }
  
  login(user) {
    return api.post('/login', { email: user.email, password: user.password })
      .then(response => { 
        // console.log('Resposta da API de login:', response.data);

        if (response.data.token && response.data.user) { 
          localStorage.setItem('userToken', response.data.token);
          return {
            user: response.data.user,
            token: response.data.token
          };
        } else {
          throw new Error("Dados de usuário ou token ausentes");
        }
      })
      .catch(error => {
        // console.error("Erro durante o login:", error);
        throw error;
      });
  }

  googleLogin(googleToken) {
    return api.post('/auth/google', { googleToken: googleToken })
      .then(response => { 
        console.log('Resposta da API de login Google:', response.data);
  
        if (response.data.token && response.data.user) { 
          localStorage.setItem('userToken', response.data.token);
          return {
            user: response.data.user,
            token: response.data.token
          };
        } else {
          throw new Error("Dados de usuário ou token ausentes");
        }
      })
      .catch(error => {
        console.error("Erro durante o login com Google:", error);
        throw error;
      });
  }

  isTokenExpired(token) {
    if (!token) return true;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  }

  logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
  }

  getCurrentUserToken() {
    return localStorage.getItem('userToken');
  }

  forgotPassword(email) {
    return api.post('/forgot-password', { email });
  }

  resetPassword(token, password) {
    return api.post(`/reset-password/${token}`, { password });
  }
  
}

export default new AuthService();
