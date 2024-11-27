<script setup>
import { onMounted, ref, watch } from 'vue';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import UserService from './../../../services/user.service';
import TicketService from './../../../services/tickets.service';
import PaymentService from './../../../services/payment.service'
import NavBar from '../../../components/NavBar.vue';
import { useToast } from '../../../composables/useToast';
import BaseButton from '../../../components/BaseButton.vue';
import BaseInput from '../../../components/BaseInput.vue';
import Footer from '../../../components/Footer.vue';

const { addToast } = useToast();

const user = ref(null);
const tickets = ref([]);
const payments = ref([]);
const filteredTickets = ref([]);
const searchTerm = ref('');
const selectedFilter = ref('');

onMounted(async () => {
  await loadUser();
  await loadPaymentes()
  combineTicketsAndPayments();
});

async function loadUser() {
  const token = localStorage.getItem('userToken');
  if (token) {
    const tokenParts = token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.id;
    try {
      user.value = await UserService.getUser(userId);
      const ticketResponse = await TicketService.getTicketByUserId(userId);
      if (ticketResponse && ticketResponse.length > 0) {
        tickets.value = ticketResponse.filter(ticket => ticket.client_id === userId);
        filterTickets();
      }
    } catch (error) {
      addToast('Error fetching user or tickets:', 'error');
    }
  } else {
    console.error('Token JWT não encontrado no localStorage');
  }
}

async function loadPaymentes() {
  try {
    payments.value = await PaymentService.getAllPayments();
  } catch (error) {
    addToast('Erro ao carregar pagamentos:', 'error');
  }
}

function combineTicketsAndPayments() {
  tickets.value = tickets.value.map(ticket => {
    const payment = payments.value.find(payment => payment.tickets_id === ticket.id);
    return { ...ticket, payment: payment ? payment.amount : 0 };
  });
  filterTickets();
}

function filterTickets() {
  const now = dayjs();
  let dateFilteredTickets = [];
  if (selectedFilter.value === 'dia') {
    dateFilteredTickets = tickets.value.filter(ticket => dayjs(ticket.start_time).isSame(now, 'day'));
  } else if (selectedFilter.value === 'semana') {
    dateFilteredTickets = tickets.value.filter(ticket => dayjs(ticket.start_time).isSame(now, 'week'));
  } else if (selectedFilter.value === 'mes') {
    dateFilteredTickets = tickets.value.filter(ticket => dayjs(ticket.start_time).isSame(now, 'month'));
  } else {
    dateFilteredTickets = tickets.value;
  }

  if (searchTerm.value) {
    filteredTickets.value = dateFilteredTickets.filter(ticket =>
      (ticket.client_id && ticket.client_id.toString().toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (ticket.vehicles_plate && ticket.vehicles_plate.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
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
    { header: 'Data de Entrada', key: 'start_time', width: 30 },
    { header: 'Data de Saída', key: 'finish_time', width: 30 },
    { header: 'Permanência', key: 'duration', width: 30 },
    { header: 'Total a Pagar', key: 'tariffs_price', width: 30 }
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
    const row = worksheet.addRow({
      id: ticket.id,
      vehicles_plate: ticket.vehicles_plate.toUpperCase(),
      start_time: formatDateTime(ticket.start_time),
      finish_time: formatDateTime(ticket.finish_time),
      duration: formatDuration(ticket.duration),
      tariffs_price: formatCurrency(ticket.payment)
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
  worksheet.pageSetup.printArea = `A1:F${lastRow}`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'tickets.xlsx');
}

watch([searchTerm, selectedFilter], filterTickets);

function formatDateTime(dateTime) {
  return dayjs(dateTime).format('DD/MM/YYYY HH:mm:ss');
}

function formatDuration(duration) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatCurrency(value) {
  const numberValue = parseFloat(value);
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  return formatter.format(numberValue);
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
  <div class="sm:h-screen">
    <NavBar label="Histórico de tickets"/>
    <div class="container mx-auto pb-28">
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
          <div class="w-full h-12 flex justify-between items-center bg-blue-800 px-3">
            <div class="w-56 shrink-0">
              <p class="text-white">Código do Ticket</p>
            </div>
            <div class="w-56 shrink-0">
              <p class="text-white">Placa do Veículo</p>
            </div>
            <div class="w-56 shrink-0">
              <p class="text-white">Data de Entrada</p>
            </div>
            <div class="w-56">
              <p class="text-white">Data de Saída</p>
            </div>
            <div class="w-48 shrink-0">
              <p class="text-white">Permanência</p>
            </div>
            <div class="w-40 shrink-0">
              <p class="text-white">Total a Pagar</p>
            </div>
          </div>
          <div v-if="filteredTickets && filteredTickets.length" class="w-full">
            <div v-for="ticket in filteredTickets" :key="ticket.id">
              <div class="flex justify-between items-center px-3 border-b">
                <div class="w-56 h-12 flex items-center shrink-0">
                  <p class="text-gray-900">{{ ticket.id }}</p>
                </div>
                <div class="w-56 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ ticket.vehicles_plate.toUpperCase() }}</p>
                </div>
                <div class="w-56 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ formatDateTime(ticket.start_time) }}</p>
                </div>
                <div class="w-56 h-10 flex items-center">
                  <p class="text-gray-900">{{ ticket.finish_time != null ? formatDateTime(ticket.finish_time) : 'Pendente' }}</p>
                </div>
                <div class="w-48 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ formatDuration(ticket.duration) }}</p>
                </div>
                <div class="w-40 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ formatCurrency(ticket.payment) != null ? formatCurrency(ticket.payment) : '' }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-12 flex justify-center items-center px-3 border-b">
            <div class="h-10 flex justify-center items-center px-3">
              <p class="text-lg text-gray-700">
                Nenhum ticket encontrado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>
