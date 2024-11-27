<script setup>
import { ref, watch, onMounted } from 'vue';
import CapacityService from './../services/space-park.service';
import VehicleTypeService from './../services/vehicles-type.service';

import BaseInput from '../components/BaseInput.vue';
import BaseButton from '../components/BaseButton.vue';
import BaseSelect from '../components/BaseSelect.vue';

const vehicleTypes = ref([]);
const capacities = ref([]);
let carParkId = ref();
let carParksName = ref();

const props = defineProps({
  capacity: Object
});
const emit = defineEmits(['formSubmit']);

const form = ref({
  car_parks_id: '',
  car_parks_name: '',
  vehicles_type_id: '',
  capacity: ''
});

onMounted(() => {
  loadVehicleTypes();
  loadCapacities();
});

const loadCapacities = async () => {
  const capacitiesResponse = await CapacityService.getAllCapacities();
  console.log('Filtrado', capacitiesResponse)

  capacities.value = capacitiesResponse[0];
  carParkId.value = capacities.value.car_parks_id
  carParksName.value = capacities.value.car_park.name
  
  form.value.car_parks_id = carParkId.value;
  form.value.car_parks_name = carParksName.value;
};

async function loadVehicleTypes() {
  try {
    const response = await VehicleTypeService.getAllVehiclesType();
    vehicleTypes.value = response;

    console.log('Toda a lista',  vehicleTypes.value)

  } catch (error) {
    console.error('Erro ao carregar tipos de veículos:', error);
  }
}

watch(() => props.capacity, (newVal) => {
  if (newVal) {
    form.value = { ...newVal };
    form.value.car_parks_id = carParkId.value;
    form.value.car_parks_name = carParksName.value;
  } else {
    form.value = {
      car_parks_id: '',
      car_parks_name: '',
      vehicles_type_id: '',
      capacity: ''
    };
  }
}, { immediate: true });

const cancel = () => {
  emit('formSubmit');
};

const submitForm = async () => {
  if (props.capacity && props.capacity.id) {
    await CapacityService.updateCapacity(props.capacity.id, form.value);
  } else {
    await CapacityService.createCapacity(form.value);
  }
  emit('formSubmit');
};

</script>

<template>
  <form class="flex justify-between items-center gap-5" @submit.prevent="submitForm">

    <BaseInput label="Unidade do pátio" v-model="form.car_parks_name" name="capacity" placeholder="Informe a capacidade" :disabled="true" required />
    
    <BaseSelect  label="Categoria*" v-model="form.vehicles_type_id" :options="vehicleTypes.map(type => ({ value: type.id, label: type.type_name }))" name="vehicles_type_id" />
    
    <BaseInput label="Capacidade" v-model="form.capacity" type="number" name="capacity" placeholder="Informe a capacidade" required />

    <BaseButton class="w-full xl:max-w-[180px]" label="Cancelar" btnClass="cancel" @click="cancel" />
    <BaseButton v-if="props.capacity" class="w-full xl:max-w-[180px]" type="submit" label="Atualizar" btnClass="primary" />
    <BaseButton v-if="!props.capacity" class="w-full xl:max-w-[180px]" type="submit" label="Cadastrar" btnClass="primary" />

  </form>
</template>
