import dayjs from 'dayjs';

export function useFormatting() {

  function formatDate(date) {
    return dayjs(date).format('DD/MM/YYYY');
  }

  function formatDateTime(dateTime) {
    return dayjs(dateTime).format('DD/MM/YYYY - HH:mm:ss');
  }

  function formatCurrency(value) {
    const numberValue = parseFloat(value);
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return formatter.format(numberValue);
  }

  const formatDateBefore = (date) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };
  
  const formatDateBr = (date) => {
    if (!date) return '';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(date).toLocaleDateString('pt-BR', options);
  };

  return {
    formatDate,
    formatDateTime,
    formatDateBefore,
    formatCurrency,
    formatDateBr
  };
}