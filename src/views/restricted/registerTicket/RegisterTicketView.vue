<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import UserService from './../../../services/user.service';
import TicketService from './../../../services/tickets.service';
import CapacityService from './../../../services/space-park.service';
import TariffService from '../../../services/tariff.service';
import VehicleService from './../../../services/vehicles.service';
import VehicleTypeService from './../../../services/vehicles-type.service';
import BrandService from './../../../services/brand.service';
import NavBar from '../../../components/NavBar.vue';
import store from '../../../store/index'
import BaseInput from '../../../components/BaseInput.vue';
import BaseSelect from '../../../components/BaseSelect.vue';
import BaseButton from '../../../components/BaseButton.vue';
import { useToast } from '../../../composables/useToast';
import Footer from '../../../components/Footer.vue';

const isLoggedIn = store.getters.getUserData;
const { addToast } = useToast();
const user = ref(null);
const spaces = ref([]);
const capacityArray = ref([]);
const tickets = ref([]);
const router = useRouter();
const tariffs = ref([]);
const vehicleTypes = ref([]);
const brands = ref([]);
const userName = ref('');
const errorMessage = ref('');
const isVehicleParked = ref(false);

const form = ref({
  car_parks_id: 1,
  garage_number: '',
  brands_id: '',
  vehicles_plate: '',
  vehicles_type_id: '',
  start_time: '',
  tariff_price: '',
  client_id: '',
  employee_id: isLoggedIn.id,
  status: 'pending',
  brandName: '',
  vehicleTypeName: ''
});

const isFormComplete = computed(() => {
  return form.value.vehicles_plate !== '' && form.value.garage_number !== '';
});

function getCurrentDateTime() {
  return dayjs().format("DD/MM/YYYY HH:mm:ss");
}

onMounted(async () => {
  form.value.start_time = getCurrentDateTime();
  await loadUser();
  await loadSpaces();
  await loadBrands();
  await loadVehicleTypes();
  await loadTariffs();
  await loadTicket();
});

watch(() => form.value.vehicles_plate, async (newValue) => {
  if (newValue === '') {
    form.value.start_time = '';
    form.value.garage_number = '';
    form.value.vehicles_id = '';
    form.value.vehicleTypeName = '';
    form.value.brandName = '';
    form.value.users_id = '';
    form.value.tariff_price = '';
    userName.value = '';
    errorMessage.value = '';
  } else {
    try {
      const vehicle = await VehicleService.getVehicleByPlate(newValue);
      form.value.vehicles_type_id = vehicle.vehicles_type_id;
      form.value.brands_id = vehicle.brands_id;
      form.value.users_id = vehicle.users_id;
      form.value.vehicles_id = vehicle.id;
      userName.value = vehicle.user.full_name || '';
      form.value.start_time = getCurrentDateTime();
      errorMessage.value = '';

      const brand = brands.value.find(b => b.id === vehicle.brands_id);
      const type = vehicleTypes.value.find(t => t.id === vehicle.vehicles_type_id);

      form.value.brandName = brand ? brand.name : '';
      form.value.vehicleTypeName = type ? type.type_name : '';

      const vehiclePlate = form.value.vehicles_plate;
      const existingTicket = tickets.value.find(ticket => 
      ticket.vehicles_plate === vehiclePlate && 
      ticket.status !== 'paid' );

      if (existingTicket) {
      addToast('Veículo no pátio.', 'error');
      isVehicleParked.value = true;  // Desabilitar seleção de vaga
    } else {
      isVehicleParked.value = false; // Habilitar seleção de vaga
    }
    await loadSpaces();
    } catch (error) {
      errorMessage.value = 'Placa inexistente';
      form.value.vehicles_type_id = '';
      form.value.brandName = '';
      form.value.vehicleTypeName = '';
      form.value.tariff_price = '';
      userName.value = '';
      form.value.start_time = '';
      form.value.garage_number = '';
    }
  }
});

watch(() => form.value.vehicles_type_id, (newValue) => {
  if (newValue) {
    const tariff = tariffs.value.find(tariff => tariff.vehicles_type_id === parseInt(newValue));
    if (tariff) {
      form.value.tariffs_id = tariff.id;
      form.value.tariff_price = formatCurrency(tariff.price);
    } else {
      form.value.tariffs_id = '';
      form.value.tariff_price = '';
    }
  }
});

async function loadUser() {
  const token = localStorage.getItem('userToken');
  if (token) {
    const userId = JSON.parse(atob(token.split('.')[1])).id;
    try {
      user.value = await UserService.getUser(userId);
      tickets.value = await TicketService.getTickets();
    } catch (error) {
      addToast('Error fetching user or tickets:', 'error');
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
    vehicleTypes.value = await VehicleTypeService.getAllVehiclesType();
  } catch (error) {
    addToast('Erro ao carregar tipos de veículos:', 'error');
  }
}

async function loadSpaces() {
  try {
     const capacities = await CapacityService.getCapacityByVehicleType(form.value.car_parks_id);
    const selectedVehicleType = form.value.vehicleTypeName;
    if (!selectedVehicleType) {
      console.warn("Tipo de veículo não selecionado.");
      return;
    }
    const capacityForVehicleType = capacities.find(capacity => capacity.vehicle_type_name === selectedVehicleType);
    if (!capacityForVehicleType) {
      console.warn(`Capacidade não encontrada para o tipo de veículo: ${selectedVehicleType}`);
      return;
    }
    const totalSpacesForVehicle = parseInt(capacityForVehicleType.total_spaces, 10);
    spaces.value = Array.from({ length: totalSpacesForVehicle }, (_, i) => i + 1);
    tickets.value = await TicketService.getTickets();
    capacityArray.value = spaces.value.filter(spaceNumber => {
      const isOccupied = tickets.value.some(ticket => 
        ticket.garage_number === spaceNumber && 
        ticket.status !== 'paid' && 
        ticket.vehicleType.type_name === selectedVehicleType
      );
      return !isOccupied;
    });
    console.log(`Vagas disponíveis para ${selectedVehicleType}:`, capacityArray.value);
  } catch (error) {
    addToast('Erro ao carregar vagas:', 'error');
  }
}

async function loadTariffs() {
  try {
    tariffs.value = await TariffService.getAllTariffs();
  } catch (error) {
    addToast('Erro ao carregar tarifas:', 'error');
  }
}

async function loadTicket() {
  try {
    const Allticket = await TicketService.getTickets();
  } catch (error) {
    addToast('Error fetching ticket:', 'error');
  }
}

async function saveTicket() {  
  const formData = {
    ...form.value,
    vehicles_id: form.value.vehicles_id,
    garage_number: Number(form.value.garage_number),
    brands_id: Number(form.value.brands_id),
    vehicles_type_id: Number(form.value.vehicles_type_id),
    tariffs_id: Number(form.value.tariffs_id),
    client_id: Number(form.value.users_id),
    start_time: form.value.start_time
  };
  try {
    await TicketService.createTicket(formData);
    router.push('/registro-de-saida');
  } catch (error) {
    addToast('Error saving ticket:', 'error');
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
}
</script>

<template>
  <div class="h-screen">
    <NavBar label="Registrar entrada" />
    <div class="container mx-auto">
      <div class="w-full h-12 flex items-center bg-blue-800 px-4">
        <p class="text-lg text-white">Dados do ticket</p>
      </div>
      <div class="border border-blue-800 p-5">
        <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0">
          <BaseInput label="Placa*" v-model="form.vehicles_plate" :uppercase="true" name="plate" placeholder="ABC1234" />
          <BaseInput label="Marca*" v-model="form.brandName" name="brand" placeholder="Marca" disabled/>
          <BaseInput label="Cliente*" v-model="userName" name="client" placeholder="Nome do cliente" disabled />
          <BaseInput label="Categoria*" v-model="form.vehicleTypeName" name="type" placeholder="Categoria do veículo" disabled />
          <BaseInput label="Valor hora*" v-model="form.tariff_price" name="tariff_price" placeholder="R$ 0,00" disabled />
          <BaseSelect label="Número da vaga*" v-model="form.garage_number" name="garage_number" :options="capacityArray.map(space => ({ value: space, label: space }))" :disabled="form.vehicles_plate == '' || errorMessage !== '' || isVehicleParked" />
          <BaseInput label="Horário da entrada*" v-model="form.start_time" name="start_time" placeholder="Horário da entrada" disabled/>
        </div>
        <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0 mt-8 lg:mt-0">
          <div class="lg:col-start-2 xl:col-start-3 lg:flex gap-3">
            <div v-if="errorMessage" class="w-full h-12 flex justify-center items-center xl:col-span-2 text-red-500 mb-5 lg:mb-0 px-4">
              {{ errorMessage }}
            </div>
            <BaseButton type="submit" label="Registrar Ticket" :class="isFormComplete" :disabled="!isFormComplete" @click="saveTicket" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer></Footer>
</template>
