import api from './api';

class AddressService {
  getAddresses() {
    return api.get(`/addresses`).then(result => {
      return result.data;
    });
  }
  
  getAddressByUserId(userId) {
    return api.get(`/users/${userId}/address`).then(result => {
      return result.data;
    });
  }

  createOrUpdateAddress(userId, addressData) {
    return api.post(`/users/${userId}/address`, addressData).then(result => {
      return result.data;
    });
  }
}

export default new AddressService();
