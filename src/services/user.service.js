import api from './api';
import AuthService from './auth.service';

class UserService {
  getAllUsers() {
    const token = AuthService.getCurrentUserToken();
    if (!token) throw new Error('No token found');
    
    return api.get('/users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  createUser(userData) {
    return api.post('/users', userData).then(result => {
      return result.data;
    });
  }

  getUser(userId) {
    return api.get(`/users/${userId}`).then(result => {
      return result.data;
    });
  }

  getUserByEmail(email) {
    return api.get(`/users/email/${email}`).then(result => {
      return result.data;
    });
  }

  getUserByCPF(cpf) {
    return api.get(`/users/cpf/${cpf}`).then(result => {
      return result.data;
    })
  }

  updateUser(userId, userData) {
    return api.put(`/users/${userId}`, userData).then(result => {
      return result.data;
    });
  }

  updateUserPassword(userId, userData) {
    return api.put(`/users/${userId}`, userData).then(result => {
      return result.data;
    });
  }

  createAddress(userId, addressData) {
    return api.post(`/users/${userId}/address`, addressData).then(result => {
      return result.data;
    });
  }

  updateAddress(userId, addressData) {
    return api.put(`/users/${userId}/address`, addressData).then(result => {
      return result.data;
    });
  }

  createVehicle(userId, vehicleData) {
    return api.post(`/users/${userId}/vehicle`, vehicleData).then(result => {
      return result.data;
    });
  }

  updateVehicle(userId, vehicleData) {
    return api.put(`/users/${userId}/vehicle`, vehicleData).then(result => {
      return result.data;
    });
  }

  getVehicle(userId) {
    return api.get(`/users/${userId}/vehicle`).then(result => {
      return result.data;
    });
  }

}

export default new UserService();