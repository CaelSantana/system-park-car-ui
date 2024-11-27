import api from './api';

class SearchCepService {

  find(cep) {
    return api.get(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => {
        return response.data
      })
  }
  
}

export default new SearchCepService(); 