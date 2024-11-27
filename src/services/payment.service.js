import api from './api';

class PaymentService {
  getAllPayments() {
    return api.get(`/payments`).then(result => {
      return result.data;
    });
  }

  createPayment(paymentData) {
    return api.post('/payments', paymentData).then(result => {
      return result.data;
    });
  }
}

export default new PaymentService();