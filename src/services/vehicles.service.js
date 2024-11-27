import api from './api';

class VehicleService {
  getVehicles() {
    return api.get(`/vehicles`).then(result => {
      return result.data;
    });
  }

  getVehicleByPlate(plate) {
    return api.get(`/vehicles/${plate}`).then(result => {
      return result.data;
    });
  }

  getVehicleByUserId(userId) {
    return api.get(`/vehicles/user/${userId}`).then(result => {
      return result.data;
    });
  }
}

export default new VehicleService();