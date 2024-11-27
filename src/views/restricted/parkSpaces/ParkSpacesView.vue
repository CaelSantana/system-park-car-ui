<script setup>
import { ref, onMounted } from 'vue';
import CapacityService from './../../../services/space-park.service';
import CapacityForm from './../../../components/CapacityForm.vue';
import NavBar from '../../../components/NavBar.vue';
import BaseButton from '../../../components/BaseButton.vue';
import Footer from '../../../components/Footer.vue';

const capacities = ref([]);
const showForm = ref(false);
const selectedCapacity = ref({capacity: ''});

const loadCapacities = async () => {
  capacities.value = await CapacityService.getAllCapacities();
};

const showCreateForm = () => {
  selectedCapacity.value = null;
  showForm.value = true;
};

const handleFormSubmit = async () => {
  showForm.value = false;
  await loadCapacities();
};

const editCapacity = (capacity) => {
  selectedCapacity.value = capacity ? { ...capacity } : { capacity: '' };
  showForm.value = true;
};

const deleteCapacityHandler = async (id) => {
  await CapacityService.deleteCapacity(id);
  await loadCapacities();
};

onMounted(async () => {
  loadCapacities()
});

</script>

<template>
  <div class="h-screen">
    <NavBar label="Pátio" />
    <div class="container mx-auto">
      <div v-if="capacities.length < 4" class="lg:flex gap-5 justify-end items-baseline">
        <BaseButton v-if="!showForm"  label="Nova Capacidade" type="submit" btnClass="primary" class="xl:max-w-[180px] mb-5" @click="showCreateForm" />
      </div>
      <CapacityForm v-if="showForm" @formSubmit="handleFormSubmit" :capacity="selectedCapacity" />
    </div>
    <div class="container mx-auto overflow-x-auto mb-28">
      <div class="w-full h-12 flex justify-between items-center bg-blue-800 px-3">
        <div class="w-32 shrink-0">
          <p class="text-white">Código</p>
        </div>
        <div class="w-56 shrink-0">
          <p class="text-white">Unidade</p>
        </div>
        <div class="w-56 shrink-0">
          <p class="text-white">Tipo de veículo</p>
        </div>
        <div class="w-36 shrink-0">
          <p class="text-white">Capacidade</p>
        </div>
        <div class="w-52 pl-4">
          <p class="text-white">Ações</p>
        </div>
      </div>
      <div class="w-full">
        <div v-for="capacity in capacities" :key="capacity.id">
          <div class="flex justify-between items-center bg-white px-3 border-b">
            <div class="w-32 h-12 flex items-center shrink-0">
              <p class="text-gray-900">{{ capacity.car_parks_id }}</p>
            </div>
            <div class="w-56 h-12 flex items-center shrink-0">
              <p class="text-gray-900">{{ capacity.car_park.name }}</p>
            </div>
            <div class="w-56 h-10 flex items-center shrink-0">
              <p class="text-gray-900">{{ capacity.vehicle_type.type_name }}</p>
            </div>
            <div class="w-36 h-10 flex items-center shrink-0">
              <p class="text-gray-900">{{ capacity.capacity }}</p>
            </div>
            <div class="w-52 h-10 flex items-center">
              <BaseButton label="Editar" btnClass="link" icon="PhPencilSimpleLine" class="!text-orange-700" @click="editCapacity(capacity)" />
              <BaseButton v-if="capacities.length > 1" label="Excluir" btnClass="link" icon="PhTrash" class="!text-red-500" 
                @click="deleteCapacityHandler(capacity.vehicle_type.type_name === 'Bicicleta' ? 1 : capacity.vehicle_type.type_name === 'Moto' ? 2 : capacity.vehicle_type.type_name === 'Carro pequeno' ? 3 : capacity.vehicle_type.type_name === 'Carro grande' ? 4 : null)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer></Footer>
</template>
