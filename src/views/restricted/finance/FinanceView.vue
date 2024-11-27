<script setup>
import { onMounted, ref, watch } from 'vue';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver'; 
import store from '../../../store/index'
import { useFormatting } from '@/composables/useFormatting';
import UserService from './../../../services/user.service';
import NavBar from '../../../components/NavBar.vue';
import PaymentService from './../../../services/payment.service';
import BaseInput from '../../../components/BaseInput.vue';
import BaseButton from '../../../components/BaseButton.vue';
import Footer from '../../../components/Footer.vue';

const user = ref(null);
const payments = ref([]);
const filteredPayments = ref([]);
const totalAmount = ref(0);
const selectedFilter = ref('');
const searchTerm = ref('');
const { formatDateTime, formatCurrency } = useFormatting();
const isLoggedIn = store.getters.getUserData;
const showPassword = ref(false);
const togglePasswordVisibility = (type) => {
  if (type === 'password') {
    showPassword.value = !showPassword.value;
  }
};
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

watch([searchTerm, selectedFilter], filterPayments);

onMounted(async () => {
  await loadUser();
});

async function loadUser() {
  if (isLoggedIn) {
    try {
      user.value = await UserService.getUser(isLoggedIn.id);

      const paymentResponse = await PaymentService.getAllPayments();
      if (paymentResponse && paymentResponse.length > 0) {
        payments.value = paymentResponse;
        sortPaymentById()
        filterPayments();
      }
    } catch (error) {
      console.error('Error fetching user or payments:', error);
    }
  } else {
    console.error('Token JWT não encontrado no localStorage');
  }
}

function sortPaymentById() {
  payments.value.sort((a, b) => a.id - b.id);
}

function calculateTotal() {
  totalAmount.value = filteredPayments.value.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
}

function filterPayments() {
  const now = dayjs();
  let dateFilteredPayments = [];
  if (selectedFilter.value === 'dia') {
    dateFilteredPayments = payments.value.filter(payment => dayjs(payment.date).isSame(now, 'day'));
  } else if (selectedFilter.value === 'semana') {
    dateFilteredPayments = payments.value.filter(payment => dayjs(payment.date).isSame(now, 'week'));
  } else if (selectedFilter.value === 'mes') {
    dateFilteredPayments = payments.value.filter(payment => dayjs(payment.date).isSame(now, 'month'));
  } else {
    dateFilteredPayments = payments.value;
  }
  if (searchTerm.value) {
    filteredPayments.value = dateFilteredPayments.filter(payment =>
      (payment.user.full_name && payment.user.full_name.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (payment.method === 'cash' && 'dinheiro'.includes(searchTerm.value.toLowerCase())) ||
      (payment.method === 'debit_card' && 'cartão de débito'.includes(searchTerm.value.toLowerCase())) ||
      (payment.method === 'credit_card' && 'cartão de crédito'.includes(searchTerm.value.toLowerCase())) ||
      (payment.method === 'pix' && 'pix'.includes(searchTerm.value.toLowerCase())) ||
      (payment.method === 'others' && 'outros'.includes(searchTerm.value.toLowerCase())) ||
      (payment.date && payment.date.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (payment.tickets_id && payment.tickets_id.toString().toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (payment.id && payment.id.toString().toLowerCase().includes(searchTerm.value.toLowerCase())) ||
      (payment.amount && `R$ ${payment.amount}`.toLowerCase().includes(searchTerm.value.toLowerCase()))
    );
  } else {
    filteredPayments.value = dateFilteredPayments;
  }
  calculateTotal();
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
  const worksheet = workbook.addWorksheet('Pagamentos');
  worksheet.columns = [
    { header: 'Código do Pagamento', key: 'id', width: 30 },
    { header: 'Código do Ticket', key: 'tickets_id', width: 30 },
    { header: 'Data', key: 'date', width: 30 },
    { header: 'Valor', key: 'amount', width: 30 },
    { header: 'Cliente', key: 'client', width: 30 },
    { header: 'Forma de Pagamento', key: 'method', width: 30 }
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
  filteredPayments.value.forEach(payment => {
    const row = worksheet.addRow({
      id: payment.id,
      tickets_id: payment.tickets_id,
      date: formatDateTime(payment.date),
      amount: formatCurrency(payment.amount),
      client: payment.user ? payment.user.full_name : 'Desconhecido',
      method: payment.method === 'cash' ? 'Dinheiro' :
              payment.method === 'debit_card' ? 'Cartão de débito' :
              payment.method === 'credit_card' ? 'Cartão de crédito' :
              payment.method === 'pix' ? 'PIX' :
              payment.method === 'others' ? 'Outros' : 'Não disponível'
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
  const lastRow = filteredPayments.value.length + 1;
  worksheet.views = [{ state: 'normal', showGridLines: false }];
  worksheet.pageSetup.printArea = `A1:F${lastRow}`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'pagamentos.xlsx');
}

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
    <NavBar label="Financeiro" />
    <div class="container mx-auto mb-28">
      <div class="flex flex-col lg:flex-row gap-5 mb-5">
        <BaseInput v-model="searchTerm" class="!mb-0" name="search" placeholder="Pesquisar" />
        <BaseButton :label="'Dia'" :icon="'PhCalendar'" :btnClass="selectedFilter === 'dia' ? 'primary' : 'secondary'" class="lg:max-w-[120px] xl:max-w-[180px]" @click="setFilter('dia')" />
        <BaseButton :label="'Semana'" :icon="'PhCalendarCheck'" :btnClass="selectedFilter === 'semana' ? 'primary' : 'secondary'" class="lg:max-w-[120px] xl:max-w-[180px]" @click="setFilter('semana')" />
        <BaseButton :label="'Mês'" :icon="'PhCalendarDots'" :btnClass="selectedFilter === 'mes' ? 'primary' : 'secondary'" class="lg:max-w-[120px] xl:max-w-[180px]" @click="setFilter('mes')" />
        <BaseButton :label="'Exportar Excel'" :icon="'PhMicrosoftExcelLogo'" :btnClass="'primary'" class="bg-green-800 lg:!max-w-[175px] xl:max-w-[180px]" @click="exportToExcel" />
      </div>
      <div class="overflow-x-auto cursor-all-scroll mx-auto"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        >
        <div class="w-7xl xl:w-full">
          <div class="w-full h-12 flex justify-between items-center bg-blue-800 pl-3">
            <div class="w-48 shrink-0">
              <p class="text-white">Cód. Pagamento</p>
            </div>
            <div class="w-48 shrink-0">
              <p class="text-white">Cód. do Ticket</p>
            </div>
            <div class="w-60 shrink-0">
              <p class="text-white">Data</p>
            </div>
            <div class="w-40 shrink-0">
              <p class="text-white">Valor</p>
            </div>
            <div class="w-64 shrink-0">
              <p class="text-white">Cliente</p>
            </div>
            <div class="w-52 shrink-0">
              <p class="text-white">Forma de Pagamento</p>
            </div>
          </div>
          <div v-if="filteredPayments && filteredPayments.length" class="w-full">
            <div v-for="payment in filteredPayments" :key="payment.id">
              <div class="flex justify-between items-center pl-3 border-b">
                <div class="w-48 h-12 flex items-center shrink-0">
                  <p class="text-gray-900">{{ payment.id }}</p>
                </div>
                <div class="w-48 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ payment.tickets_id }}</p>
                </div>
                <div class="w-60 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ formatDateTime(payment.date) }}</p>
                </div>
                <div class="w-40 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ formatCurrency(payment.amount) }}</p>
                </div>
                <div class="w-64 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ payment.user ? payment.user.full_name : 'Desconhecido' }}</p>
                </div>
                <div class="w-52 h-10 flex items-center gap-3 shrink-0">
                  <div v-if="payment.method === 'pix'"><PhPixLogo :size="24" class="text-purple-500" /></div>
                  <div v-if="payment.method === 'cash'"><PhMoney :size="24" class="text-green-500" /></div>
                  <div v-if="payment.method === 'debit_card'"><PhCreditCard :size="24" class="text-orange-500" /></div>
                  <div v-if="payment.method === 'credit_card'"><PhCreditCard :size="24" class="text-red-500" /></div>
                  <div v-if="payment.method === 'others'"><PhWallet :size="24"  class="text-gray-500"/></div>
                  <p class="text-gray-900 truncate">{{ 
                    payment.method === 'cash' ? 'Dinheiro' :
                    payment.method === 'debit_card' ? 'Cartão de débito' :
                    payment.method === 'credit_card' ? 'Cartão de crédito' :
                    payment.method === 'pix' ? 'PIX' :
                    payment.method === 'others' ? 'Outros' : 'Não disponível' 
                  }}
                  </p>
                </div>
              </div>
            </div>
            <div class="w-full h-12 flex justify-end items-center gap-3 bg-blue-800 px-3">
              <p class="text-2xl font-bold text-white">Total:</p>
              <div v-if="showPassword" class="flex gap-2">
                <p class="text-2xl font-bold text-white">{{ formatCurrency(totalAmount) }}</p>
              </div>
              <div v-if="!showPassword" class="flex gap-2">
                <p class="text-2xl font-bold text-white">R$ ***,00</p>
              </div>
              <span @click="togglePasswordVisibility('password')" class="top-9 right-0 flex items-center pr-3 cursor-pointer">
              <component :is="showPassword ? 'PhEye' : 'PhEyeSlash'" :size="24" class="text-white" />
            </span>
            </div>
          </div>
          <div v-else class="h-12 flex justify-center items-center px-3 border-b">
            <div class="h-10 flex justify-center items-center px-3">
              <p class="text-lg text-gray-700">
                Nenhum pagamento encontrado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer></Footer>
</template>

