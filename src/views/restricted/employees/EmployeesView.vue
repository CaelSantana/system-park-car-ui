<script setup>
import { onMounted, ref, computed } from 'vue';
import dayjs from 'dayjs';

import UserService from './../../../services/user.service';
import AddressService from './../../../services/address.service';
import VehicleService from './../../../services/vehicles.service';
import NavBar from '../../../components/NavBar.vue';
import Modal from '../../../components/Modal.vue';
import BaseButton from '../../../components/BaseButton.vue';
import { useToast } from '../../../composables/useToast';

const user = ref(null);
const users = ref([]);
const searchTerm = ref('');
const showModal = ref(false);
const selectedUser = ref(null);
const address = ref(null);
const vehicle = ref(null);
const { addToast } = useToast();

onMounted(async () => {
  await loadUser();
});

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
        users.value = usersResponse.data;
        sortUsersById()
      }
    } catch (error) {
      addToast('Erro ao carregar os usuários:', 'error');
    }
  } else {
    console.error('Token JWT não encontrado no localStorage');
  }
}

function sortUsersById() {
  users.value.sort((a, b) => a.id - b.id);
}

async function loadAddress(userId) {
  try {
    const addressResponse = await AddressService.getAddressByUserId(userId);
    if (addressResponse) {
      address.value = addressResponse;
    } else {
      address.value = null;
    }
  } catch (error) {
    addToast('Erro ao carregar o endereço:', 'error');
    address.value = null; // Assegura que o estado seja limpo em caso de erro
  }
}

async function loadVehicle(userId) {
  try {
    const vehicleResponse = await VehicleService.getVehicleByUserId(userId);
    if (vehicleResponse && vehicleResponse.length > 0) {
      vehicle.value = vehicleResponse[0];
    } else {
      vehicle.value = null;
    }
  } catch (error) {
    addToast('Erro ao carregar o veículo:',' erro');
    vehicle.value = null; // Assegura que o estado seja limpo em caso de erro
  }
}

async function openModal(item) {
  selectedUser.value = item;
  address.value = null;
  vehicle.value = null;

  try {
    await Promise.all([
      loadAddress(item.id),
      loadVehicle(item.id)
    ]);
  } catch (error) {
    addToast('Erro ao carregar dados:', 'error');
  }

  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedUser.value = null;
  address.value = null;
  vehicle.value = null;
}

async function promoteToClient() {
  if (selectedUser.value) {
    try {
      const response = await UserService.updateUser(selectedUser.value.id, { roles_id: 1 });
      await loadUser();
      closeModal();
    } catch (error) {
      addToast('Erro ao atualizar a função do usuário:', 'error');
    }
  }
}

// Computed property to filter users
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const term = searchTerm.value.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phone.toLowerCase().includes(term) ||
      user.birth.toLowerCase().includes(term)
    );
  });
});

function formatDateTime(dateTime) {
  return dayjs(dateTime).format('DD/MM/YYYY' + ' ' + '-' + ' ' + 'HH:mm:ss');
}

function formatDate(date) {
  return dayjs(date).format('DD/MM/YYYY');
}

</script>

<template>
  <div class="h-screen">
    <NavBar label="Funcionários" />
    <div class="container mx-auto">
      <div class="mb-8">
        <input v-model="searchTerm" class="w-full h-12 border border-blue-800 px-4 mb-3 lg:mb-0 lg:mr-5" name="search" placeholder="Pesquisar" />
      </div>
    </div>

    <div class="container overflow-x-auto pb-12 mx-auto">
      <div class="w-full h-12 flex justify-between items-center bg-blue-800 px-3">
        <div class="w-14 shrink-0">
          <p class="text-white">Código</p>
        </div>
        <div class="w-52 shrink-0">
          <p class="text-white">Nome</p>
        </div>
        <div class="w-36">
          <p class="text-white">Telefone</p>
        </div>
        <div class="w-52 shrink-0">
          <p class="text-white">E-mail</p>
        </div>
        <div class="w-28 shrink-0">
          <p class="text-white">Aniversário</p>
        </div>
        <div class="w-44 shrink-0">
          <p class="text-white">Cadastro</p>
        </div>
        <div class="w-20 shrink-0">
          <p class="text-white">Detalhes</p>
        </div>
      </div>

      <div class="w-full">
        <div v-for="item in filteredUsers" :key="item.id">
          <div v-if="item.roles_id == 2" class="flex justify-between items-center bg-white px-3 border-b">
            <div class="w-14 h-12 flex items-center shrink-0">
              <p class="text-gray-900">{{ item.id }}</p>
            </div>
            <div class="w-52 h-10 flex items-center shrink-0">
              <p class="text-gray-900 truncate">{{ item.full_name }}</p>
            </div>
            <div class="w-36 h-10 flex items-center shrink-0">
              <p class="text-gray-900">{{ item.phone }}</p>
            </div>
            <div class="w-52 h-10 flex items-center shrink-0">
              <p class="text-gray-900 truncate">{{ item.email }}</p>
            </div>
            <div class="w-28 h-10 flex items-center shrink-0">
              <p class="text-gray-900">{{ formatDate(item.birth) }}</p>
            </div>
            <div class="w-44 h-10 flex items-center shrink-0">
              <p class="text-gray-900">{{ formatDateTime(item.created_at) }}</p>
            </div>
            <div class="w-20 h-10 flex items-center shrink-0">
              <p class="text-gray-900 cursor-pointer" @click="openModal(item)">Detalhes</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal :show="showModal" title="Cadastro do funcionário" @close="closeModal">
      <div v-if="selectedUser">
          <p><strong>Código do cliente:</strong> {{ selectedUser.id }}</p>
          <p><strong>Nome:</strong> {{ selectedUser.full_name }}</p>
          <p><strong>Data de nascimento:</strong> {{ selectedUser.birth }}</p>
          <p><strong>CPF:</strong> {{ selectedUser.cpf }}</p>
          <p><strong>E-mail:</strong> {{ selectedUser.email }}</p>
          <p><strong>Telefone:</strong> {{ selectedUser.phone }}</p>
          <p><strong>Data de cadastro:</strong> {{ formatDateTime(selectedUser.created_at) }}</p>
          <div v-if="address">
            <h3 class="text-xl font-bold mt-4">Endereço</h3>
            <p><strong>Rua:</strong> {{ address.street }}</p>
            <p><strong>Número:</strong> {{ address.number }}</p>
            <p><strong>Complemento:</strong> {{ address.complement }}</p>
            <p><strong>Bairro:</strong> {{ address.district }}</p>
            <p><strong>Cidade:</strong> {{ address.city }}</p>
            <p><strong>Estado:</strong> {{ address.state }}</p>
          </div>
          <div v-else class="mb-4">
            <h3 class="text-xl font-bold mt-4">Endereço</h3>
            <p>Endereço não cadastrado</p>
          </div>
          <div v-if="vehicle">
            <h3 class="text-xl font-bold mt-4">Veículo</h3>
            <p><strong>Placa:</strong> {{ vehicle.plate }}</p>
            <p><strong>Categoria:</strong> {{ vehicle.type.type_name }}</p>
            <p><strong>Marca:</strong> {{ vehicle.brand.name }}</p>
          </div>
          <div v-else class="mb-4">
            <h3 class="text-xl font-bold mt-4">Veículo</h3>
            <p>Veículo não cadastrado</p>
          </div>
      </div>
      <div class="lg:flex gap-5">
        <BaseButton
          label="Fechar" 
          btnClass="cancel"
          @click="closeModal"
        />
        <BaseButton
          label="Promover a cliente"
          @click="promoteToClient"
        />
      </div>
    </Modal>
    </div>
</template>
