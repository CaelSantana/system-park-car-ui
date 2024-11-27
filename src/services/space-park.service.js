import api from './api';

class CapacityService {
  async getAllCapacities() {
    try {
      const response = await api.get(`/capacities`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar as capacidades: ' + error.message);
    }
  }

  async createCapacity(capacityData) {
    try {
      const response = await api.post(`/capacities`, capacityData);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar a capacidade: ' + error.message);
    }
  }

  async getCapacityById(id) {
    try {
      const response = await api.get(`/capacities/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar a capacidade: ' + error.message);
    }
  }

  async getCapacityByVehicleType(carParksId) {
    try {
      // Fazendo a chamada à API para buscar capacidades específicas de um estacionamento
      const response = await api.get(`/capacities/vehicle-type/${carParksId} `);
      
      // Retornando os dados de capacidades que incluem o tipo de veículo
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao buscar as capacidades para o estacionamento ${carParksId}: ` + error.message);
    }
  }

  async updateCapacity(id, capacityData) {
    try {
      const response = await api.put(`/capacities/${id}`, capacityData);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar a capacidade: ' + error.message);
    }
  }

  async deleteCapacity(vehiclesTypeId) {
    try {
      const response = await api.delete(`/capacities/vehicle-type/${vehiclesTypeId}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao deletar a capacidade: ' + error.message);
    }
  }
}

export default new CapacityService();
