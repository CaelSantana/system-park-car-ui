<script setup>
import { onMounted, ref } from 'vue';
import UserService from '../../../services/user.service';
import TicketService from '../../../services/tickets.service';
import CapacityService from './../../../services/space-park.service';
import NavBar from '../../../components/NavBar.vue';
import Footer from '../../../components/Footer.vue';
import { useToast } from '../../../composables/useToast';

const { addToast } = useToast();
const user = ref(null);
const tickets = ref([]);
const capacities = ref([]);
const totalCapacity = ref(0);
const occupiedSpaces = ref(0);
const freeSpaces = ref(0);
const todayPaidTickets = ref(0);
const todayOpenTickets = ref(0);
const capacityMap = ref({});

onMounted(async () => {
  await loadUser();
  await loadSpaces();
  await loadCapacities();
  await calculateTotalCapacity();
  await calculateOccupiedSpaces();
  await calculateFreeSpaces();
  await calculateTodayTickets();
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


function isSpaceOccupied(spaceNumber, vehicleTypeId) {
  return tickets.value.some(ticket => ticket.garage_number === spaceNumber && ticket.vehicles_type_id === vehicleTypeId && ticket.status !== 'paid');
}

const loadCapacities = async () => {
  capacities.value = await CapacityService.getAllCapacities();
};

const calculateTotalCapacity = () => {
  totalCapacity.value = capacities.value.reduce((total, capacity) => total + capacity.capacity, 0);
};

const calculateOccupiedSpaces = () => {
  occupiedSpaces.value = tickets.value.filter(ticket => ticket.status !== 'paid').length;
};

const calculateFreeSpaces = () => {
  freeSpaces.value = totalCapacity.value - occupiedSpaces.value;
};

const calculateTodayTickets = () => {
  const today = new Date().toISOString().slice(0, 10);
  todayPaidTickets.value = tickets.value.filter(ticket => ticket.status === 'paid' && ticket.start_time.slice(0, 10) === today).length;
  todayOpenTickets.value = tickets.value.filter(ticket => ticket.status !== 'paid' && ticket.start_time.slice(0, 10) === today).length;
};
</script>

<template>
  <div class="sm:h-screen">
    <NavBar label="Dashboard"/>
    <div class="container mx-auto pb-28">
      <div class="flex flex-col md:flex-row md:gap-4 mb-8">
        <div class="w-full bg-white shadow-md m-auto">
          <div class="w-full h-12 flex justify-center items-center bg-blue-800">
            <p class="text-xl text-white">Total de vagas</p>
          </div>
          <div class="flex justify-between items-center p-5">
            <div class="h-7 flex items-center rounded bg-gray-100 px-4 mr-2">
              <p class="text-xl font-semibold mr-2">{{ occupiedSpaces }}</p>
              <p>Ocupadas</p>
            </div>
            <p class="text-4xl font-semibold text-[#444] text-center">{{ totalCapacity }}</p>
            <div class="h-7 flex items-center rounded bg-gray-100 px-4">
              <p class="text-xl font-semibold mr-2">{{ freeSpaces }}</p>
              <p>Livres</p>
            </div>
          </div>
        </div>
        <div class="w-full bg-white shadow-md m-auto">
          <div class="w-full h-12 flex justify-center items-center bg-blue-800">
            <p class="text-xl text-white">Rotatividade</p>
          </div>
          <div class="flex justify-between items-center p-5">
            <div class="h-7 flex items-center rounded bg-gray-100 px-4 mr-2">
              <p class="text-xl font-semibold mr-2">{{ todayOpenTickets }}</p>
              <p>Entradas</p>
            </div>
            <p class="text-4xl font-semibold text-[#444] text-center">{{ todayPaidTickets + todayOpenTickets }}</p>
            <div class="h-7 flex items-center rounded bg-gray-100 px-4">
              <p class="text-xl font-semibold mr-2">{{ todayPaidTickets }}</p>
              <p>Saídas</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="w-full h-12 flex justify-center items-center bg-blue-800 px-4 mb-8">
          <p class="text-2xl font-medium text-white">Status do pátio</p>
        </div>
        <div class="flex-col sm:grid lg:grid-cols-2 xl:grid-cols-4 gap-3">
          <div class="w-full flex-col justify-between items-start bg-white shadow-md mx-auto mb-5">
            <div class="h-12 flex justify-center items-center gap-5 bg-yellow-500 mb-4">
              <div class="flex justify-center items-center rounded">
                <img src="../../../assets/icons/bike.svg" alt="Icone branco de uma bicicleta com um fundo amarelo">
              </div>
              <p class="text-xl font-semibold text-white">Bike</p>
            </div>
            <div class="flex flex-wrap gap-2 p-3">
              <div v-for="n in capacityMap[1]" :key="n">
                <div class="w-10 h-10 flex justify-center items-center rounded" 
                  :class="isSpaceOccupied(n, 1) ? 'bg-red-500' : 'bg-yellow-500'">
                  <p class="text-white">{{ n }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="w-full flex-col justify-between items-start bg-white shadow-md mx-auto mb-5">
            <div class="h-12 flex justify-center items-center gap-5 bg-green-400 mb-4">
              <div class="flex justify-center items-center rounded">
                <img src="../../../assets/icons/motorcycle.svg" alt="Icone branco de uma moto em um fundo verde">
              </div>
              <p class="text-xl font-semibold text-white">Moto</p>
            </div>
            <div class="flex flex-wrap gap-2 p-3">
              <div v-for="n in capacityMap[2]" :key="n">
                <div class="w-10 h-10 flex justify-center items-center rounded"
                  :class="isSpaceOccupied(n, 2) ? 'bg-red-500' : 'bg-green-400'">
                  <p class="text-white">{{ n }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="w-full flex-col justify-between items-start bg-white shadow-md mx-auto mb-5">
            <div class="h-12 flex justify-center items-center gap-5 bg-blue-500 mb-4">
              <div class="flex justify-center items-center rounded">
                <img src="../../../assets/icons/small-car.svg" alt="Icone branco de um carro em um fundo roxo">
              </div>
              <p class="text-xl font-semibold text-white">Carro pequeno</p>
            </div>
            <div class="flex flex-wrap gap-2 p-3">
              <div v-for="n in capacityMap[3]" :key="n">
                <div class="w-10 h-10 flex justify-center items-center rounded"
                  :class="isSpaceOccupied(n, 3) ? 'bg-red-500' : 'bg-blue-500'">
                  <p class="text-white">{{ n }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="w-full flex-col justify-between items-start bg-white shadow-md mx-auto mb-5">
            <div class="h-12 flex justify-center items-center gap-5 bg-purple-500 mb-4">
              <div class="flex justify-center items-center rounded">
                <img src="../../../assets/icons/big-car.svg" alt="Icone branco de um caminhão com fundo azul">
              </div>
              <p class="text-xl font-semibold text-white">Carro grande</p>
            </div>
            <div class="flex flex-wrap gap-2 p-3">
              <div v-for="n in capacityMap[4]" :key="n">
                <div class="w-10 h-10 flex justify-center items-center rounded"
                :class="isSpaceOccupied(n, 4) ? 'bg-red-500' : 'bg-purple-500'">
                  <p class="text-white">{{ n }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer></Footer>
</template>