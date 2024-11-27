import api from './api';

class TicketService {
  getTickets() {
    return api.get(`/tickets`).then(result => {
      return result.data;
    });
  }

  getTicket(ticketId) {
    return api.get(`/tickets/${ticketId}`).then(result => {
      return result.data;
    });
  }
  
  getTicketByUserId(userId) {
    return api.get(`/tickets?users_id=${userId}`).then(result => {
      return result.data;
    });
  }

  createTicket(ticketData) {
    return api.post('/tickets', ticketData).then(result => {
      return result.data;
    });
  }

  updateTicket(ticketId, data) {
    return api.put(`/tickets/${ticketId}`, data).then(result => {
      return result.data;
    });
  }

  getTicketsWithTariff () {
    return api.get(`/tickets`).then(result => {
      return result.data;
    });
  }

}

export default new TicketService();