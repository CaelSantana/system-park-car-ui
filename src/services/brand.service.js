import api from './api';

class BrandService {
  async getAllBrands() {
    try {
      const response = await api.get(`/brands`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar as marcas: ' + error.message);
    }
  }

  async createBrand(brandData) {
    try {
      const response = await api.post(`/brands`, brandData);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar a marca: ' + error.message);
    }
  }

  async getBrandById(id) {
    try {
      const response = await api.get(`/brands/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar a marca: ' + error.message);
    }
  }

  async updateBrand(id, brandData) {
    try {
      const response = await api.put(`/brands/${id}`, brandData);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao atualizar a marca: ' + error.message);
    }
  }

  async deleteBrand(id) {
    try {
      const response = await api.delete(`/brands/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Erro ao deletar a marca: ' + error.message);
    }
  }
}

export default new BrandService();
