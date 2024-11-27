import api from './api';

class VehicleTypeService {
  getAllVehiclesType() {
    return api.get(`/vehicles-types`).then(result => {
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

export default new VehicleTypeService();