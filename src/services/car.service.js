import api from './api';

class CarService {

  getAll() {
    return api.get(`/users`).then(result => {
      return result.data
    });
  }

}

export default new CarService();