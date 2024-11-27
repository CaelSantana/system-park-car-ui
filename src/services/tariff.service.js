import api from './api';

class TariffService {
  getAllTariffs() {
    return api.get(`/tariffs`).then(result => {
      return result.data;
    });
  }

  getTariff(tariffId) {
    return api.get(`/tariffs/${tariffId}`).then(result => {
      return result.data;
    });
  }
  

}

export default new TariffService();