<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import duration from 'dayjs/plugin/duration';
import UserService from './../../../services/user.service';
import TicketService from './../../../services/tickets.service';
import CapacityService from './../../../services/space-park.service';
import TariffService from './../../../services/tariff.service';
import PaymentService from './../../../services/payment.service';
import NavBar from '../../../components/NavBar.vue';
import BaseSelect from '../../../components/BaseSelect.vue';
import Modal from '../../../components/Modal.vue';
import BaseButton from '../../../components/BaseButton.vue';
import { useToast } from '../../../composables/useToast';
import BaseInput from '../../../components/BaseInput.vue';
import Footer from '../../../components/Footer.vue';

dayjs.extend(duration);

const { addToast } = useToast();
const user = ref(null);
const tickets = ref([]);
const showModal = ref(false);
const tariffs = ref([]);
const payments = ref([]);
const selectedFilter = ref('');
const searchTerm = ref('');
const filteredTickets = ref([]);
const capacityMap = ref({});
const selectedTicket = ref({
  status: 'pending',
  method: 'cash'
});

const isValid = computed(() => !!selectedTicket.value.method);

onMounted(async () => {
  await loadUser();
  await loadSpaces();
  await loadTariffs();
  await loadPayments();
  updateTicketTariffs();
  await filterTickets();
});

async function loadUser() {
  const token = localStorage.getItem('userToken');
  if (token) {
    const tokenParts = token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.id;
    try {
      user.value = await UserService.getUser(userId);
      const ticketResponse = await TicketService.getTickets();
      if (ticketResponse && ticketResponse.length > 0) {
        tickets.value = ticketResponse;
        updateTicketTariffs();
        filterTickets();
        sortTicketsByTicketId();
      }
    } catch (error) {
      addToast('Error fetching user or tickets:', 'error');
    }
  } else {
    console.error('Token JWT não encontrado no localStorage');
  }
}

async function loadSpaces() {
  try {
    const carParksId = 1;
    const capacities = await CapacityService.getCapacityByVehicleType(carParksId);
    capacityMap.value = {};
    for (const capacity of capacities) {
      const vehicleTypeId = capacity.vehicles_type_id;
      if (vehicleTypeId) {
        capacityMap.value[vehicleTypeId] = Array.from({ length: parseInt(capacity.total_spaces) }, (_, i) => i + 1);
      }
    }
  } catch (error) {
    addToast('Erro ao carregar vagas:', 'error');
  }
}

async function loadTariffs() {
  try {
    const allTariffs = await TariffService.getAllTariffs();
    tariffs.value = allTariffs.reduce((acc, tariff) => {
      acc[tariff.vehicles_type_id] = tariff;
      return acc;
    }, {});
  } catch (error) {
    addToast('Error loading tariffs:', 'error');
  }
}

async function loadPayments() {
  try {
    payments.value = await PaymentService.getAllPayments();
  } catch (error) {
    addToast('Error ao carregar pagamentos:', 'error');
  }
}

function updateTicketTariffs() {
  tickets.value = tickets.value.map(ticket => {
    const tariff = tariffs.value[ticket.vehicles_type_id];
    return {
      ...ticket,
      tariffPrice: tariff ? tariff.price : 'N/A'
    };
  });
}

function sortTicketsByTicketId() {
  tickets.value.sort((a, b) => a.id - b.id);
}

function isSpaceOccupied(spaceNumber, vehicleTypeId) {
  return tickets.value.some(ticket => ticket.garage_number === spaceNumber && ticket.vehicles_type_id === vehicleTypeId && ticket.status !== 'paid');
}

function openModal(ticket) {
  selectedTicket.value = { ...ticket, method: '' };
  const payment = payments.value.find(p => p.tickets_id === ticket.id);
  selectedTicket.value.payment = payment || {};
  selectedTicket.value.status == 'pending' 
    ? selectedTicket.value.finish_time = getCurrentDateTime() 
    : selectedTicket.value.finish_time
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedTicket.value = {
    status: 'pending',
    method: null,
    payment: null,
    finish_time: null
  };
}

function getCurrentDateTime() {
  const now = dayjs();
  return now.format("YYYY/MM/DD HH:mm:ss");
}

function formatDateTime(dateTime) {
  return dayjs(dateTime).format('DD/MM/YYYY HH:mm:ss');
}

function calculateDuration(startTime, finishTime) {
  const start = dayjs(startTime);
  const finish = dayjs(finishTime);
  const diff = finish.diff(start);
  const duration = dayjs.duration(diff);
  const totalHours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  return `${totalHours}h ${minutes}m`;
}

function calculatePrice(startTime, finishTime, tariffPrice) {
  const start = dayjs(startTime);
  const finish = dayjs(finishTime);
  const diff = finish.diff(start);
  const duration = dayjs.duration(diff);
  const totalHours = Math.max(Math.ceil(duration.asHours()), 1);
  return (tariffPrice * totalHours).toFixed(2);
}

function getMethodName(method) {
  const methodsMap = {
    cash: 'Dinheiro',
    debit_card: 'Cartão de débito',
    credit_card: 'Cartão de crédito',
    pix: 'PIX',
    others: 'Outros'
  };
  return methodsMap[method] || 'Desconhecido';
}

async function closeTicket(ticket) {
  try {
    const paymentDetails = {
      tickets_id: ticket.id,
      client_id: ticket.client_id,
      date: getCurrentDateTime(),
      amount: ticket.tariff,
      method: ticket.method,
      method_name: getMethodName(ticket.method),
    };
    await PaymentService.createPayment(paymentDetails);
    ticket.status = 'paid';
    await TicketService.updateTicket(ticket.id, { status: ticket.status, finish_time: ticket.finish_time, tariffs_id: ticket.tariffPrice });

    await loadUser();
    await loadPayments();

    showModal.value = false;

    addToast('Ticket encerrado e pagamento realizado com sucesso!', 'success');
  } catch (error) {
    addToast('Error closing ticket:', 'error');
  }
}

function formatCurrency(value) {
  const numberValue = parseFloat(value);
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  return formatter.format(numberValue);
}

watch([searchTerm, selectedFilter], filterTickets);

function filterTickets() {
  const now = dayjs();
  let dateFilteredTickets = [];
  if (selectedFilter.value === 'dia') {
    dateFilteredTickets = tickets.value.filter(ticket => dayjs(ticket.created_at).isSame(now, 'day'));
  } else if (selectedFilter.value === 'semana') {
    dateFilteredTickets = tickets.value.filter(ticket => dayjs(ticket.created_at).isSame(now, 'week'));
  } else if (selectedFilter.value === 'mes') {
    dateFilteredTickets = tickets.value.filter(ticket => dayjs(ticket.created_at).isSame(now, 'month'));
  } else {
    dateFilteredTickets = tickets.value;
  }

  if (searchTerm.value) {
    filteredTickets.value = dateFilteredTickets.filter(ticket =>
      (ticket.vehicleType?.type_name && ticket.vehicleType.type_name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (ticket.vehicles_plate && ticket.vehicles_plate.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (ticket.client?.full_name && ticket.client.full_name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (ticket.status_name && ticket.status_name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (ticket.id && ticket.id.toString().toLowerCase().includes(searchTerm.value.toLowerCase()))
    );
  } else {
    filteredTickets.value = dateFilteredTickets;
  }
}

function setFilter(filter) {
  if (selectedFilter.value === filter) {
    selectedFilter.value = '';
  } else {
    selectedFilter.value = filter;
  }
}

async function exportToExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tickets');
  worksheet.columns = [
    { header: 'Código do Ticket', key: 'id', width: 30 },
    { header: 'Placa do Veículo', key: 'vehicles_plate', width: 30 },
    { header: 'Tipo de Veículo', key: 'vehicle_type', width: 30 },
    { header: 'Cliente', key: 'client', width: 30 },
    { header: 'Data de Criação', key: 'created_at', width: 30 },
    { header: 'Status', key: 'status', width: 30 },
    { header: 'Preço da Tarifa', key: 'tariffPrice', width: 30 },
    { header: 'Tempo Estacionado', key: 'duration', width: 30 },
  ];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' }
    };
    cell.font = {
      name: 'Inter',
      size: 12,
      bold: true,
      color: { argb: 'FFFFFF' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  headerRow.height = 25;
  filteredTickets.value.forEach(ticket => {
    const finishTime = ticket.finish_time || getCurrentDateTime();
    const row = worksheet.addRow({
      id: ticket.id,
      vehicles_plate: ticket.vehicles_plate,
      vehicle_type: ticket.vehicleType ? ticket.vehicleType.type_name : 'Desconhecido',
      client: ticket.client ? ticket.client.full_name : 'Desconhecido',
      created_at: formatDateTime(ticket.created_at),
      status: ticket.status  === 'pending' ? 'Pendente' : 'Pago',
      tariffPrice: formatCurrency(ticket.tariffPrice),
      duration: calculateDuration(ticket.created_at, finishTime)
    });
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Inter', size: 12 };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    row.height = 20;
  });
  const lastRow = filteredTickets.value.length + 1;
  worksheet.views = [{ state: 'normal', showGridLines: false }];
  worksheet.pageSetup.printArea = `A1:H${lastRow}`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'tickets.xlsx');
}

function printTicket() {
  window.print();
}

let isDragging = false;
let startX = 0;
let scrollLeft = 0;

function startDrag(event) {
  isDragging = true;
  startX = event.pageX - event.currentTarget.offsetLeft;
  scrollLeft = event.currentTarget.scrollLeft;
}

function onDrag(event) {
  if (!isDragging) return;
  event.preventDefault();
  const x = event.pageX - event.currentTarget.offsetLeft;
  const walk = (x - startX) * 2;
  event.currentTarget.scrollLeft = scrollLeft - walk;
}

function stopDrag() {
  isDragging = false;
}

</script>

<template>
  <div class="h-screen">
    <NavBar label="Registrar saída" />
    <div class="container mx-auto mb-28">
      <div class="flex flex-col lg:flex-row gap-5 mb-5">
        <BaseInput v-model="searchTerm" class="!mb-0" name="search" placeholder="Pesquisar" />
        <BaseButton :label="'Dia'" :icon="'PhCalendar'" :btnClass="selectedFilter === 'dia' ? 'primary' : 'secondary'" class="lg:max-w-[120px] xl:max-w-[180px]" @click="setFilter('dia')" />
        <BaseButton :label="'Semana'" :icon="'PhCalendarCheck'" :btnClass="selectedFilter === 'semana' ? 'primary' : 'secondary'" class="lg:max-w-[120px] xl:max-w-[180px]" @click="setFilter('semana')" />
        <BaseButton :label="'Mês'" :icon="'PhCalendarDots'" :btnClass="selectedFilter === 'mes' ? 'primary' : 'secondary'" class="lg:max-w-[120px] xl:max-w-[180px]" @click="setFilter('mes')" />
        <BaseButton :label="'Exportar Excel'" :icon="'PhMicrosoftExcelLogo'" :btnClass="'primary'" class="lg:!max-w-[175px] xl:max-w-[180px] bg-green-800 hover:bg-green-400" @click="exportToExcel" />
      </div>
      <div class="overflow-x-auto cursor-all-scroll mx-auto"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        >
        <div class="w-7xl 2xl:w-full">
          <div class="w-full h-12 flex justify-center items-center bg-blue-800 pl-3">
            <div class="w-36">
              <p class="text-white">Ticket</p>
            </div>
            <div class="w-36">
              <p class="text-white">Vaga</p>
            </div>
            <div class="w-40">
              <p class="text-white">Placa</p>
            </div>
            <div class="w-60">
              <p class="text-white">Categoria</p>
            </div>
            <div class="w-44">
              <p class="text-white">Valor hora</p>
            </div>
            <div class="w-72">
              <p class="text-white">Cliente</p>
            </div>
            <div class="w-40 flex mx-auto">
              <p class="text-center text-white">Status</p>
            </div>
            <div class="w-48 flex text-center">
              <p class="text-white">Ações</p>
            </div>
          </div>
          <div v-if="filteredTickets && filteredTickets.length" class="w-full mb-12">
            <div v-for="ticket in filteredTickets" :key="ticket.id">
              <div class="h-12 flex justify-center items-center pl-3 border-b">
                <div class="w-36 h-10 flex items-center">
                  <p class="text-gray-900">{{ ticket.id }}</p>
                </div>
                <div class="w-36 h-10 flex items-center">
                  <p class="text-gray-900">{{ ticket.garage_number }}</p>
                </div>
                <div class="w-40 h-10 flex items-center">
                  <p class="text-gray-900 uppercase">{{ ticket.vehicles_plate }}</p>
                </div>
                <div class="w-60 h-10 flex items-center">
                  <p class="text-gray-900">{{ ticket.vehicleType.type_name }}</p>
                </div>
                <div class="w-44 h-10 flex items-center">
                  <p class="text-gray-900">{{ formatCurrency(ticket.tariffPrice) }}</p>
                </div>
                <div class="w-72 h-10 flex items-center truncate">
                  <p class="text-gray-900 truncate">{{ ticket.client.full_name }}</p>
                </div>
                <div class="w-40 h-10 flex items-center gap-2">
                  <PhHourglassMedium v-if="ticket.status === 'pending'":size="24" class="text-orange-500" alt="Ícone de ampulheta" />
                  <PhCheck v-else-if="ticket.status === 'paid'":size="24" class="text-green-500" alt="Ícone de check" />
                  <p :class="ticket.status == 'pending' ? 'text-orange-500' : 'text-green-500'">{{ ticket.status === 'pending' ? 'Pendente' : 'Pago' }}</p>
                </div>
                <div class="w-48 h-10 flex justify-center items-center gap-2 cursor-pointer" @click="openModal(ticket)">
                  <PhTicket v-if="ticket.status === 'pending'":size="24" class="text-blue-500" alt="Ícone de ticket" />
                  <PhPrinter v-else-if="ticket.status === 'paid'":size="24" class="text-gray-500" alt="Ícone de impressora" />
                  <p :class="ticket.status == 'pending' ? 'text-blue-500' : 'text-gray-500'" >{{ ticket.status === 'pending' ? 'Detalhes' : 'Imprimir'  }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-12 flex justify-center items-center px-3 border-b">
            <div class="h-10 flex justify-center items-center px-3">
              <p class="text-lg text-gray-700">
                Nenhum veículo no pátio momento.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Modal :show="showModal" title="Detalhes do Ticket" @close="closeModal">
        <div v-if="selectedTicket">
          <p><strong>ID:</strong> {{ selectedTicket.id }}</p>
          <p><strong>Cód do cliente:</strong> {{ selectedTicket.client_id }}</p>
          <p class="mb-8"><strong>Nome do cliente:</strong> {{ selectedTicket.client.full_name }}</p>
          <p><strong>Vaga:</strong> {{ selectedTicket.garage_number }}</p>
          <p><strong>Placa:</strong> {{ selectedTicket.vehicles_plate }}</p>
          <p class="mb-8"><strong>Categoria:</strong> {{ selectedTicket.vehicleType.type_name }}</p>
          <p><strong>Entrada:</strong> {{ formatDateTime(selectedTicket.start_time) }}</p>
          <p class="mb-8"><strong>Saida:</strong> {{ formatDateTime(selectedTicket.finish_time) }}</p>
          <p><strong>Duração:</strong> {{ selectedTicket.duration = calculateDuration(selectedTicket.start_time, selectedTicket.finish_time) }}</p>
          <p class="mb-8"><strong>A pagar:</strong> R$ {{ formatCurrency(selectedTicket.tariff = calculatePrice(selectedTicket.start_time, selectedTicket.finish_time, selectedTicket.tariffPrice)) }}</p>
          <p><strong>Status:</strong> {{ selectedTicket.status === 'pending' ? 'Pendente' : 'Pago' }}</p>
          <p v-if="selectedTicket.status != 'pending'"><strong>Forma de pagamento:</strong> 
            {{ selectedTicket.payment.method === 'cash' ? 'Dinheiro' :
               selectedTicket.payment.method === 'debit_card' ? 'Cartão de débito' :
               selectedTicket.payment.method === 'credit_card' ? 'Cartão de crédito' :
               selectedTicket.payment.method === 'pix' ? 'PIX' :
               selectedTicket.payment.method === 'others' ? 'Outros' : 'Não disponível' }}
           </p>
          <div v-if="selectedTicket.status == 'pending'" class="mt-8">
            <BaseSelect 
              label="Forma de pagamento"
              placeholder="Selecione uma forma de pagamento" 
              :options="[
                { value: 'cash', label: 'Dinheiro' },
                { value: 'debit_card', label: 'Cartão de débito' },
                { value: 'credit_card', label: 'Cartão de crédito' },
                { value: 'pix', label: 'PIX' },
                { value: 'others', label: 'Outros' }
              ]" 
              v-model="selectedTicket.method"
              name="method" 
            />
          </div>
        </div>
        <div class="lg:flex gap-5 mt-8">
          <BaseButton
            type="button" 
            label="Fechar" 
            btnClass="cancel"
            @click="closeModal"
          />
          <BaseButton v-if="selectedTicket && selectedTicket.status === 'pending'"
            type="button"
            label="Pagar Ticket"
            :class="[isValid]"
            @click="closeTicket(selectedTicket)"
            :disabled="!isValid"
          />
          <BaseButton v-if="selectedTicket && selectedTicket.status === 'paid'"
            type="button"
            label="Imprimir"
            icon="PhPrinter"
            @click="printTicket"
          />
        </div>
      </Modal>
    </div>
  </div>
  <Footer></Footer>
</template>

<style scoped>
@media print {
  @page {
    width: 200px;
    height: auto;
    margin: 20px;
  }
  .no-print {
    display: none;
  }
  .print-content {
    font-size: 12pt;
    color: #000;
  }
  body {
    background-color: white;
    color: black;
  }
}
</style>
