<script setup>
import { onMounted, ref, computed } from 'vue';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import UserService from './../../../services/user.service';
import VehicleService from './../../../services/vehicles.service';
import VehicleTypeService from './../../../services/vehicles-type.service';
import BrandService from './../../../services/brand.service';
import BaseInput from '../../../components/BaseInput.vue';
import BaseSelect from '../../../components/BaseSelect.vue';
import BaseButton from '../../../components/BaseButton.vue';
import NavBar from '../../../components/NavBar.vue';
import Modal from '../../../components/Modal.vue';
import Footer from '../../../components/Footer.vue';
import { useToast } from '../../../composables/useToast';

const { addToast } = useToast();
const user = ref(null);
const users = ref([]);
const searchTerm = ref('');
const showModal = ref(false);
const selectedUser = ref(null);
const address = ref(null);
const vehicle = ref({ id: '', plate: '', vehicles_type_id: '', brands_id: '' });
const vehicleTypes = ref([]);
const brands = ref([]);
const plateError = ref('');
const vehicleTypeError = ref('');
const brandError = ref('');
const selectedFilter = ref('');

const isValid = computed(() => {
  return (
    vehicle.value.plate &&
    vehicle.value.vehicles_type_id &&
    vehicle.value.brands_id &&
    !plateError.value &&
    !vehicleTypeError.value &&
    !brandError.value
  );
});

const filteredUsers = computed(() => {
  const now = dayjs();
  let dateFilteredUsers = users.value;

  if (selectedFilter.value === 'dia') {
    dateFilteredUsers = users.value.filter(user => dayjs(user.created_at).isSame(now, 'day'));
  } else if (selectedFilter.value === 'semana') {
    dateFilteredUsers = users.value.filter(user => dayjs(user.created_at).isSame(now, 'week'));
  } else if (selectedFilter.value === 'mes') {
    dateFilteredUsers = users.value.filter(user => dayjs(user.created_at).isSame(now, 'month'));
  }

  return dateFilteredUsers.filter(user => {
    const term = searchTerm.value.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(term) ||
      user.phone.toLowerCase().includes(term)
    );
  });
});

onMounted(async () => {
  await loadUser();
  await loadVehicleTypes();
  await loadBrands();
});

function setFilter(filter) {
  if (selectedFilter.value === filter) {
    selectedFilter.value = '';
  } else {
    selectedFilter.value = filter;
  }
}

function validatePlate() {
  if (vehicle.value.plate) {
    vehicle.value.plate = vehicle.value.plate.toUpperCase();
  }
  const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
  if (!vehicle.value.plate) {
    plateError.value = 'Por favor, informe a placa do veículo.';
  } else if (!plateRegex.test(vehicle.value.plate)) {
    plateError.value = 'Por favor, informe uma placa válida.';
  } else {
    plateError.value = '';
  }
}

function validateVehicleType() {
  if (!vehicle.value.vehicles_type_id) {
    vehicleTypeError.value = 'Por favor, selecione a categoria do veículo.';
  } else {
    vehicleTypeError.value = '';
  }
}

function validateBrand() {
  if (!vehicle.value.brands_id) {
    brandError.value = 'Por favor, selecione a marca do veículo.';
  } else {
    brandError.value = '';
  }
}

async function loadUser() {
  const token = localStorage.getItem('userToken');
  if (token) {
    const tokenParts = token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.id;
    try {
      user.value = await UserService.getUser(userId);
      const usersResponse = await UserService.getAllUsers();
      if (usersResponse) {
        for (const user of usersResponse.data) {
          const vehicleResponse = await VehicleService.getVehicleByUserId(user.id);
          user.vehiclePlate = vehicleResponse?.[0]?.plate || null;
        }
        users.value = usersResponse.data;
      }
    } catch (error) {
      addToast('Erro ao carregar os usuários:', 'error');
    }
  } else {
    console.error('Token JWT não encontrado no localStorage');
  }
}

async function loadBrands() {
  try {
    brands.value = await BrandService.getAllBrands();
  } catch (error) {
    addToast('Erro ao carregar marcas:', 'error');
  }
}

async function loadVehicleTypes() {
  try {
    const response = await VehicleTypeService.getAllVehiclesType();
    vehicleTypes.value = response;
  } catch (error) {
    addToast('Erro ao carregar tipos de veículos:', 'error');
  }
}

async function openModal(user) {
  selectedUser.value = user;
  address.value = null;
  vehicle.value = { id: '', plate: '', vehicles_type_id: '', brands_id: '' };
  try {
    const vehicleResponse = await VehicleService.getVehicleByUserId(user.id);
    vehicle.value = (vehicleResponse && vehicleResponse[0]) || { id: '', plate: '', vehicles_type_id: '', brands_id: '' };
  } catch (error) {
    addToast('Erro ao carregar o veículo:', 'error');
  }
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedUser.value = null;
  address.value = null;
  vehicle.value = null;
  plateError.value = ''
}

async function saveVehicle() {
  validatePlate();
  validateVehicleType();
  validateBrand();

  if (!isValid.value) {
    return;
  }

  try {
    if (vehicle.value.id) {
      await UserService.updateVehicle(selectedUser.value.id, vehicle.value);
      addToast('Veículo atualizado com sucesso!', 'success');
      await loadUser();
      closeModal();
    } else {
      await UserService.createVehicle(selectedUser.value.id, vehicle.value);
      addToast('Veículo cadastrado com sucesso!', 'success');
      await openModal(selectedUser.value);
      await loadUser();
      closeModal();
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      addToast("Já existe um veículo registrado com essa placa.", "error");
    } else {
      addToast("Erro ao salvar o veículo. Tente novamente.", "error");
    }
    addToast("Erro ao salvar o veículo:", 'error');
  }
}

async function exportToExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tickets');
  worksheet.columns = [
    { header: 'Código do Ticket', key: 'id', width: 30 },
    { header: 'Nome Completo', key: 'full_name', width: 30 },
    { header: 'Telefone', key: 'phone', width: 30 },
    { header: 'Placa', key: 'plate', width: 30 }
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
  filteredUsers.value
    .filter(user => user.roles_id === 1)
    .forEach(user => {
      const row = worksheet.addRow({
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        plate: user.vehiclePlate || 'Placa não cadastrada'
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
  const lastRow = filteredUsers.value.filter(user => user.roles_id === 1).length + 1;
  worksheet.views = [{ state: 'normal', showGridLines: false }];
  worksheet.pageSetup.printArea = `A1:D${lastRow}`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'veiculos.xlsx');
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

function stopDrag() { isDragging = false; }
</script>

<template>
  <div class="sm:h-screen">
    <NavBar label="Cadastro de veículos" />
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
        <div class="w-3xl lg:w-full">
          <div class="w-full h-12 flex justify-between items-center bg-blue-800 px-3">
            <div class="w-20 shrink-0">
              <p class="text-white">Código</p>
            </div>
            <div class="w-52 shrink-0">
              <p class="text-white">Nome</p>
            </div>
            <div class="w-40">
              <p class="text-white">Telefone</p>
            </div>
            <div class="w-48">
              <p class="text-white">Placa</p>
            </div>
            <div class="w-28 shrink-0 pl-2">
              <p class="text-white">Ações</p>
            </div>
          </div>
          <div class="w-full">
            <div v-for="user in filteredUsers" :key="user.id">
              <div v-if="user.roles_id == 1" class="flex justify-between items-center bg-white px-3 border-b">
                <div class="w-20 h-12 flex items-center shrink-0">
                  <p class="text-gray-900">{{ user.id }}</p>
                </div>
                <div class="w-52 h-10 flex items-center shrink-0">
                  <p class="text-gray-900 whitespace-nowrap truncate">{{ user.full_name }}</p>
                </div>
                <div class="w-40 h-10 flex items-center">
                  <p class="text-gray-900">{{ user.phone }}</p>
                </div>
                <div class="w-48 h-10 flex items-center">
                  <p :class="user.vehiclePlate ? 'text-gray-900' : 'text-red-500'">{{ user.vehiclePlate || 'Placa não cadastrada' }}</p>
                </div>
                <div class="w-28 h-10 flex items-center shrink-0">
                  <BaseButton label="Detalhes" btnClass="link" icon="PhAddressBook" class="!text-blue-700" @click="openModal(user)" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal :show="showModal" title="Cadastro do cliente" @close="closeModal">
          <form @submit.prevent="saveVehicle">
            <div v-if="selectedUser">
              <div class="border-b border-gray-200 pb-4">
                <h3 class="text-lg font-semibold text-blue-900 mb-1">Dados do cliente</h3>
                <p class="text-gray-700"><span class="font-semibold text-gray-900">Código:</span> {{ selectedUser.id }}</p>
                <p class="text-gray-700"><span class="font-semibold text-gray-900">Nome:</span> {{ selectedUser.full_name }}</p>
                <p class="text-gray-700"><span class="font-semibold text-gray-900">E-mail:</span> {{ selectedUser.email }}</p>
                <p class="text-gray-700"><span class="font-semibold text-gray-900">Telefone:</span> {{ selectedUser.phone }}</p>
              </div>
              <div v-if="vehicle && vehicle.id" class="py-4">
                <h3 class="text-lg font-semibold text-blue-900 mb-1">Veículo</h3>
                <p class="text-gray-700"><span class="font-semibold text-gray-900">Placa:</span> {{ vehicle.plate }}</p>
                <p class="text-gray-700"><span class="font-semibold text-gray-900">Categoria:</span> {{ vehicle.type.type_name }}</p>
                <p class="text-gray-700"><span class="font-semibold text-gray-900">Marca:</span> {{ vehicle.brand.name }}</p>
              </div>
              <div v-else class="py-4">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">Veículo</h3>
                <div>
                  <BaseInput 
                    label="Placa*" v-model="vehicle.plate" name="plate" :uppercase="true" placeholder="Digite a placa do veículo" 
                    :errorMessage="plateError" @input="validatePlate" required 
                  />
                  <BaseSelect 
                    label="Categoria*" :options="vehicleTypes.map(type => ({ value: type.id, label: type.type_name }))" 
                    v-model="vehicle.vehicles_type_id" name="vehicles_type_id" :errorMessage="vehicleTypeError"
                    @blur="validateVehicleType"
                  />
                  <BaseSelect 
                    label="Marca*" :options="brands.map(brand => ({ value: brand.id, label: brand.name }))" 
                    v-model="vehicle.brands_id" name="brands_id" :errorMessage="brandError"
                    @blur="validateBrand"
                  />
                </div>
              </div>
              <div class="lg:flex gap-5">
                <BaseButton  type="submit" label="Fechar" btnClass="cancel" @click="closeModal" />
                <BaseButton v-if="vehicle && !vehicle.id" type="submit" label="Salvar" :class="[isValid]" :disabled="!isValid" />
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  </div>
  <Footer></Footer>
</template>