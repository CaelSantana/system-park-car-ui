import api from './api';

class CarParkCapacityService {
  // Método existente para buscar todas as capacidades
  async getAllCapacities() {
    try {
      const response = await api.get(`/capacities`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar as capacidades: ' + error.message);
    }
  }

  // Novo método para buscar capacidades por tipo de veículo de um estacionamento específico
  async getCapacityByVehicleType(carParksId) {
    try {
      // Fazendo a chamada à API para buscar capacidades específicas de um estacionamento
      const response = await api.get(`/car_parks/${carParksId}/capacities`);
      
      // Retornando os dados de capacidades que incluem o tipo de veículo
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar as capacidades para o estacionamento ${carParksId}: ` + error.message);
    }
  }
}

export default new CarParkCapacityService();