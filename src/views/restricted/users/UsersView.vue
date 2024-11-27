<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import store from '../../../store/index'
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import UserService from './../../../services/user.service';
import AddressService from './../../../services/address.service';
import VehicleService from './../../../services/vehicles.service';
import VehicleTypeService from './../../../services/vehicles-type.service';
import SearchCepService from "../../../services/search-cep.service";
import BrandService from './../../../services/brand.service';
import NavBar from '../../../components/NavBar.vue';
import Modal from '../../../components/Modal.vue';
import BaseButton from '../../../components/BaseButton.vue';
import BaseSelect from '../../../components/BaseSelect.vue';
import { useValidators } from '@/composables/useValidators';
import BaseInput from '../../../components/BaseInput.vue';
import Tooltip from '../../../components/Tooltip.vue';
import { useToast } from '../../../composables/useToast';
import Footer from '../../../components/Footer.vue';

const user = ref(null);
const users = ref([]);
const vehicleTypes = ref([]);
const brands = ref([]);
const searchTerm = ref('');
const showModal = ref(false);
const showPasswordModal = ref(false);
const selectedUser = ref(null);
const address = ref({ id: '', street: '', number: '', complement: '', state: '', city: '', district: '' });
let vehicle = ref({ id: '', plate: '', vehicles_type_id: '', brands_id: '' });
const selectedFilter = ref('');
const { addToast } = useToast();
const formDataPassword = ref({ password: '', copyPassword: '' });
const formData = ref({ phone: '', password: '', copyPassword: '' });
const originalFormData = ref({});
const originalAddress = ref({});
const originalVehicle = ref({});
const showPassword = ref(false);
const showEditModal = ref(false);
const isEditingProfile = ref(false);
const isEditingAddress = ref(false);
const isEditingVehicle = ref(false);
const isCepValid = ref(false);
const plateError = ref('');
const vehicleTypeError = ref('');
const brandError = ref('');
const errorMessage = ref('');
const showCopyPassword = ref(false);
let isCancelling = false;
const {
  validateEmail,
  validatePhone,
  validateCPF,
  emailError,
  phoneError,
  cpfError,
  passwordError,
  copyPasswordError,
  validatePassword,
  hasUpperCase,
  hasLowerCase,
  hasNumber,
  hasSpecialChar,
} = useValidators(formData);
const isValid = computed(() => {
  return formData.value.phone && 
    formData.value.email &&
    formData.value.cpf &&
    !phoneError.value &&
    !emailError.value &&
    !cpfError.value;
});
const isVehicleValid = computed(() => {
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
      user.email.toLowerCase().includes(term) ||
      user.phone.toLowerCase().includes(term) ||
      user.birth.toLowerCase().includes(term)
    );
  });
});
const formatDateBefore = (date) => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

onMounted(async () => {
  await loadUser();
  await loadVehicleTypes();
  await loadBrands();
});

watch(() => formData.password, validatePassword);
watch(() => formData.copyPassword, validatePassword);

watch(() => formData.value.cpf, validateCPF);
watch(() => formData.value.email, validateEmail);
watch(() => formData.value.phone, () => { if (!isCancelling) validatePhone(); });
watch(() => address.complement, () => {});
watch(() => vehicle.vehicles_type_id, (newVal) => {
  console.log('Novo veículo:', newVal);
});
watch(() => vehicle.brands_id, (newVal) => {
  console.log('Marca selecionada:', newVal);
});

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
    { header: 'Placa do Veículo', key: 'full_name', width: 60 },
    { header: 'Telefone', key: 'phone', width: 30 },
    { header: 'E-mail', key: 'email', width: 60 },
    { header: 'Aniversário', key: 'birth', width: 30 }
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
  filteredUsers.value.forEach(item => {
    const row = worksheet.addRow({
      id: item.id,
      full_name: item.full_name,
      phone: item.phone,
      email: item.email,
      birth: item.birth
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
  const lastRow = filteredUsers.value.length + 1;
  worksheet.views = [{ state: 'normal', showGridLines: false }];
  worksheet.pageSetup.printArea = `A1:E${lastRow}`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'usuarios_system_park_car.xlsx');
}

async function loadUser() {
  const token = localStorage.getItem('userToken');
  if (token) {
    const tokenParts = token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.id;
    try {
      user.value = await UserService.getUser(userId);
      user.value.birth = formatDateBefore(user.value.birth);
      const usersResponse = await UserService.getAllUsers();
      if (usersResponse) {
        users.value = usersResponse.data;
        sortUsersById()
      }
    } catch (error) {
      console.log('Erro ao carregar os usuários:', 'error');
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
      address.value = { id: '', street: '', number: '', complement: '', state: '', city: '', district: '' };
    }
  } catch (error) {
    console.log('Endereço não cadastrado', 'error');
    address.value = { id: '', street: '', number: '', complement: '', state: '', city: '', district: '' };
  }
}

async function loadVehicle(userId) {
  try {
    const vehicleResponse = await VehicleService.getVehicleByUserId(userId);
    if (vehicleResponse && vehicleResponse.length > 0) {
      vehicle.value = vehicleResponse[0];
    } else {
      vehicle = { id: '', plate: '', vehicles_type_id: '', brands_id: '' };
    }
  } catch (error) {
    console.log('Veículo não cadastrado:', 'error');
    vehicle = { id: '', plate: '', vehicles_type_id: '', brands_id: '' };
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

async function openModal(item) {
  selectedUser.value = item;
  selectedUser.birth = 
  address.value = null;
  vehicle.value = null;
  try {
    await Promise.all([
      loadAddress(item.id),
      loadVehicle(item.id)
    ]);
  } catch (error) {
    console.log('Erro ao carregar dados:', 'error');
  }
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedUser.value = null;
  address.value = null;
  vehicle.value = null;
}

async function openPasswordModal(item) {
  showPasswordModal.value = true;
  formDataPassword.value = { ...item };
  formDataPassword.value.password = '';
  console.log("Usuário selecionado para modal:", formDataPassword.value);

}

function closePasswordModal() {
  showPasswordModal.value = false;
}

const togglePasswordVisibility = (type) => {
  if (type === 'password') {
    showPassword.value = !showPassword.value;
  } else if (type === 'copyPassword') {
    showCopyPassword.value = !showCopyPassword.value;
  }
};

async function updateUserPassword() {
  console.log(formDataPassword.value)
  try {
    await UserService.updateUserPassword(formDataPassword.value.id, formDataPassword.value);
    closePasswordModal()
    addToast('Senha atualizada com sucesso!', 'success');
  } catch (error) {
    addToast('Erro ao atualizar a senha.', 'error');
  }
}

async function promoteUser() {
  if (!selectedUser.value) return;
  const newRoleId = selectedUser.value.roles_id === 1 ? 2 : 1;
  try {
    await UserService.updateUser(selectedUser.value.id, { roles_id: newRoleId });
    await loadUser();
    closeModal();
  } catch (error) {
    addToast('Erro ao atualizar a função do usuário:', 'error');
  }
}

function formatDateTime(dateTime) {
  return dayjs(dateTime).format('DD/MM/YYYY' + ' ' + '-' + ' ' + 'HH:mm:ss');
}

function formatDate(date) {
  return dayjs(date).format('DD/MM/YYYY');
}

async function loadBrands() {
  try {
    brands.value = await BrandService.getAllBrands();
  } catch (error) {
    addToast('Erro ao carregar marcas:', 'error');
  }
}

async function openEditModal(user) {
  user.birth = formatDate(user.birth);
  selectedUser.value = user;
  formData.value = user;
  address.value = null;
  vehicle.value = null;
  try {
    await Promise.all([
      loadAddress(user.id),
      loadVehicle(user.id)
    ]);
  } catch (error) {
    console('Erro ao carregar dados:', 'error');
  }
  try {
    const vehicleResponse = await VehicleService.getVehicleByUserId(user.id);
    vehicle.value = (vehicleResponse && vehicleResponse[0]) || { id: '', plate: '', vehicles_type_id: '', brands_id: '' };
  } catch (error) {
    addToast('Erro ao carregar o veículo:', 'error');
  }
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  formData.value = null;
  address.value = null;
  vehicle.value = null;
  loadUser()
}

function editProfile() {
  isEditingProfile.value = true;
  originalFormData.value = { ...formData.value };
}

function cancelEditProfile() {
  isCancelling = true;
  isEditingProfile.value = false;
  formData.value = { ...originalFormData.value };
  phoneError.value = null;
  setTimeout(() => isCancelling = false, 0);
}

async function updateProfile() {
  if (isValid.value) {
    isEditingProfile.value = false;
    try {
      await UserService.updateUser(selectedUser.value.id, formData.value);
      loadUser()
      addToast('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      addToast('Erro ao atualizar o perfil.', 'error');
    }
  }
}

async function searchCep() {
  if(address.value.zip_code) {
    let cep = address.value.zip_code.replace('-', '');
    if (cep.length === 8) {
      try {
        const data = await SearchCepService.find(cep);
        if (data.erro) {
          addToast("CEP inválido", 'error');
          address.value = {};
          isCepValid.value = false;
        } else {
          address.value.street = data.logradouro || '';
          address.value.number = data.number || '';
          address.value.complement = data.complement || '';
          address.value.district = data.bairro || '';
          address.value.state = data.uf || '';
          address.value.city = data.localidade || '';
          isCepValid.value = true || '';
        }
      } catch (error) {
        addToast('Erro ao buscar CEP:', 'error');
        isCepValid.value = false;
      }
    } else {
      addToast("CEP inválido", 'error');
      isCepValid.value = false;
    }
  }
}

function editAddress() {
  isEditingAddress.value = true;
  originalAddress.value = { ...address.value };
}

function cancelEditAddress() {
  isEditingAddress.value = false;
  address.value = { ...originalAddress.value };
}

async function saveAddrees() {
  isEditingAddress.value = false;
  selectedUser.value;
  try {
    await UserService.createAddress(selectedUser.value.id, address.value);
    addToast('Endereço cadastrado com sucesso!', 'success');
  } catch (error) {
    addToast('Erro ao cadastrar o endereço.', 'error');
  }
}

async function updateAddrees() {
  isEditingAddress.value = false;
  selectedUser.value;
  try {
    await UserService.updateAddress(selectedUser.value.id, address.value);
    addToast('Endereço atualizado com sucesso!', 'success');
  } catch (error) {
    addToast('Erro ao atualizar o endereço.', 'error');
  }
}

function editVehicle() {
  isEditingVehicle.value = true;
  originalVehicle.value = JSON.parse(JSON.stringify(vehicle.value));
}

function cancelEditVehicle() {
  isEditingVehicle.value = false;
  vehicle.value = JSON.parse(JSON.stringify(originalVehicle.value));
  plateError.value = null;
}

function validatePlate() {
  const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
  if (!vehicle.value.plate) {
    plateError.value = 'Por favor, informe a placa do veículo.';
  } else if (!plateRegex.test(vehicle.value.plate.toUpperCase())) {
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

async function saveVehicle() {
  validatePlate();
  validateVehicleType();
  validateBrand();
  if (!isVehicleValid.value) {
    return;
  }
  try {
    await UserService.createVehicle(selectedUser.value.id, vehicle.value);
    addToast('Veículo cadastrado com sucesso!', 'success');
    await loadUser();
    isEditingVehicle.value = false;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      addToast('Placa já cadastrada. informe outra placa.', 'error');
    } else if (error.response && error.response.status === 404) {
      addToast('Usuário não encontrado.', 'error');
    } else {
      addToast('Erro ao cadastrar o veículo:', 'error');
    }
  }
}

async function updateVehicle() {
  validatePlate();
  validateVehicleType();
  validateBrand();
  if (!isVehicleValid.value) {
    return;
  }
  try {
    await UserService.updateVehicle(selectedUser.value.id, vehicle.value);
    addToast('Veículo atualizado com sucesso!');
    isEditingVehicle.value = false;
    await loadUser();
  } catch (error) {
    addToast('Erro ao atualizar o veículo', 'error');
    errorMessage.value = 'Placa já cadastrada';
  }
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

let isDragging = false;
let startX = 0;
let scrollLeft = 0;

</script>

<template>
  <div class="h-screen">
    <NavBar label="Clientes" />
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
        <div class="w-3xl lg:w-full">
          <div class="w-full h-12 flex justify-between items-center bg-blue-800 px-3">
            <div class="w-14 shrink-0">
              <p class="text-white">Código</p>
            </div>
            <div class="w-52 shrink-0">
              <p class="text-white">Nome</p>
            </div>
            <div class="w-40">
              <p class="text-white">Telefone</p>
            </div>
            <div class="hidden xl:flex w-64 shrink-0">
              <p class="text-white">E-mail</p>
            </div>
            <div class="w-24 shrink-0">
              <p class="text-white">Aniversário</p>
            </div>
            <div class="w-60 shrink-0">
              <p class="text-white">Detalhes</p>
            </div>
          </div>
          <div v-if="filteredUsers && filteredUsers.length" class="w-full">
            <div v-for="user in filteredUsers" :key="user.id">
              <div class="flex justify-between items-center bg-white px-3 border-b">
                <div class="w-14 h-12 flex items-center shrink-0">
                  <p class="text-gray-900">{{ user.id }}</p>
                </div>
                <div class="w-52 h-10 flex items-center shrink-0">
                  <p class="text-gray-900 truncate">{{ user.full_name }}</p>
                </div>
                <div class="w-40 h-10 flex items-center">
                  <p class="text-gray-900">{{ user.phone }}</p>
                </div>
                <div class="hidden xl:flex w-64 h-10 items-center shrink-0">
                  <p class="text-gray-900 truncate">{{ user.email }}</p>
                </div>
                <div class="w-24 h-10 flex items-center shrink-0">
                  <p class="text-gray-900">{{ formatDate(user.birth) }}</p>
                </div>
                <div class="w-60 h-10 flex items-center shrink-0">
                  <BaseButton label="Editar" btnClass="link" icon="PhPencilSimpleLine" class="!text-orange-700" @click="openEditModal(user)" />
                  <BaseButton label="Detalhes" btnClass="link" icon="PhAddressBook" class="!text-blue-700" @click="openModal(user)" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="h-12 flex justify-center items-center px-3 border-b">
            <div class="h-10 flex justify-center items-center px-3">
              <p class="text-lg text-gray-700">
                Nenhum usuário encontrado.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Modal :show="showEditModal" class="h-4/5 max-w-screen-xl" title="Cadastro do cliente" @close="closeEditModal">
        <div v-if="formData">
          <div class="w-full h-12 flex items-center bg-blue-800 gap-2 px-4">
            <p class="text-lg text-white">Dados do usuário</p>
          </div>
          <div class="border border-blue-800 p-5 mb-8">
            <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0">
              <BaseInput 
                label="Nome*"
                v-model="formData.full_name"
                name="name"
                placeholder="Informe seu nome"
                :disabled="!isEditingProfile"
              />
              <BaseInput 
                label="Data de nascimento*"
                v-model="formData.birth"
                maska="date"
                name="birth"
                placeholder="00/00/0000"
                :disabled="!isEditingProfile"
              />
              <BaseInput 
                label="CPF*"
                v-model="formData.cpf"
                name="cpf"
                maska="cpf"
                @blur="validateCPF"
                placeholder="000.000.000-00"
                :disabled="!isEditingProfile"
                :errorMessage="cpfError"
              />
              <BaseInput 
                label="E-mail*"
                v-model="formData.email"
                name="email"
                type="email"
                @input="validateEmail"
                placeholder="Informe seu e-mail"
                :disabled="!isEditingProfile"
                :errorMessage="emailError"
              />
              <BaseInput 
                label="Telefone*"
                v-model="formData.phone"
                maska="phone"
                name="phone"
                @input="validatePhone"
                placeholder="(00) 00000-0000"
                :errorMessage="phoneError"
                required
                :disabled="!isEditingProfile"
              />
              <BaseButton btnClass="secondary" class="mt-8 lg:mt-6" icon="PhLockKey" label="Alterar senha minha senha" @click="openPasswordModal(formDataPassword = formData)" />
              <div class="lg:col-start-2 xl:col-start-3 lg:flex gap-5 mt-5 lg:mt-0">
                <BaseButton v-if="!isEditingProfile" btnClass="secondary" label="Editar Dados" icon="PhPencilSimpleLine" @click="editProfile" />
                <BaseButton v-if="isEditingProfile" btnClass="cancel" label="Cancelar" class="mb-5 lg:mb-0" @click="cancelEditProfile" />
                <BaseButton v-if="isEditingProfile" label="Atualizar" icon="PhFloppyDisk" @click="updateProfile" :disabled="!isValid" />
              </div>
            </div>
          </div>
          <div class="w-full h-12 flex items-center bg-blue-800 px-4">
            <p class="text-lg text-white">Endereço</p>
          </div>
          <div v-if="address" class="border border-blue-800 p-5 mb-8">
            <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0">
              <BaseInput label="CEP*" v-model="address.zip_code" maska="cep" name="zip_code" @blur="searchCep" placeholder="00000-000" required :disabled="!isEditingAddress" />
              <BaseInput label="Logradouro*" v-model="address.street" name="street" placeholder="Avenida Paulista" :disabled="true" />
              <BaseInput label="Número*" v-model="address.number" name="number" placeholder="000" required :disabled="!isEditingAddress" />
              <BaseInput label="Complemento" v-model="address.complement" name="complement" placeholder="BLOCO 07 - APTO 303" :disabled="!isEditingAddress" />
              <BaseInput label="Estado*" v-model="address.state" name="state" placeholder="SP" :disabled="true" />
              <BaseInput label="Cidade*" v-model="address.city" name="city" placeholder="São Paulo" :disabled="true" />
              <BaseInput label="Bairro*" v-model="address.district" name="district" placeholder="Jardim Paulista" :disabled="true" />
            </div>
            <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0 mt-8 lg:mt-0">
              <div class="lg:col-start-2 xl:col-start-3 lg:flex gap-3">
                <BaseButton v-if="!isEditingAddress" type="button" name="editar" btnClass="secondary" label="Editar Dados" icon="PhPencilSimpleLine" @click="editAddress" />
                <BaseButton v-if="isEditingAddress" type="button" name="cancelar" btnClass="cancel" label="Cancelar" class="mb-5 lg:mb-0" @click="cancelEditAddress" />
                <BaseButton v-if="!address.id && isEditingAddress" type="button" name="Cadastrar Endereço" label="Salvar"
              icon="PhFloppyDisk" @click="saveAddrees" :disabled="!isEditingAddress || (address.zip_code == '' || address.number == '') " />
            <BaseButton v-if="address.id && isEditingAddress" type="button" name="Atualizar Endereço" label="Atualizar"
              icon="PhFloppyDisk" @click="updateAddrees" :disabled="!isEditingAddress || (address.zip_code == '' || address.number == '') " />
              </div>
            </div>
          </div>
          <div class="w-full h-12 flex items-center bg-blue-800 px-4">
            <p class="text-lg text-white">Dados do veículo</p>
          </div>
          <div v-if="vehicle" class="border border-blue-800 p-5">
            <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0">
              <BaseInput 
                label="Placa*"
                v-model="vehicle.plate"
                name="plate"
                :uppercase="true"
                placeholder="ABC1C34"
                @input="validatePlate"
                :errorMessage="plateError"
                :disabled="!isEditingVehicle"
              />
              <BaseSelect 
                label="Categoria*" 
                :options="vehicleTypes.map(type => ({ value: type.id, label: type.type_name }))" 
                v-model="vehicle.vehicles_type_id" 
                name="vehicles_type_id"
                @change="validateVehicleType"
                :errorMessage="vehicleTypeError"
                :disabled="!isEditingVehicle"
              />
              <BaseSelect 
                label="Marca*" 
                :options="brands.map(brand => ({ value: brand.id, label: brand.name }))" 
                v-model="vehicle.brands_id" 
                name="brands_id"
                @change="validateBrand"
                :errorMessage="brandError"
                :disabled="!isEditingVehicle"
              />
            </div>
            <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0 mt-8 lg:mt-0">
              <div class="lg:col-start-2 xl:col-start-3 lg:flex gap-3">
                <BaseButton v-if="!isEditingVehicle" btnClass="secondary" label="Editar Dados" icon="PhPencilSimpleLine" @click="editVehicle" />
                <BaseButton v-if="isEditingVehicle" btnClass="cancel" label="Cancelar" class="mb-5 lg:mb-0" @click="cancelEditVehicle" />
                <BaseButton v-if="!vehicle.users_id && isEditingVehicle" type="button" name="Cadastrar Veículo" label="Salvar" icon="PhFloppyDisk" @click="saveVehicle" :disabled="!isVehicleValid || !isEditingVehicle" />
                <BaseButton v-if="vehicle.users_id && isEditingVehicle" type="button" name="Atualizar Veículo" label="Atualizar" icon="PhFloppyDisk" @click="updateVehicle" :disabled="!isVehicleValid || !isEditingVehicle" />
              </div>
            </div>
          </div>
        </div>
      </Modal>
      <Modal :show="showModal" :title="selectedUser?.roles_id === 1 ? 'Cadastro do cliente' : 'Cadastro do Operador'" @close="closeModal">
        <div v-if="selectedUser">
          <div class="border-b border-gray-200 pb-4">
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Código do cliente:</span> {{ selectedUser.id }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Nome:</span> {{ selectedUser.full_name }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Data de nascimento:</span> {{ selectedUser.birth }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">CPF:</span> {{ selectedUser.cpf }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">E-mail:</span> {{ selectedUser.email }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Telefone:</span> {{ selectedUser.phone }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Data de cadastro:</span> {{ formatDateTime(selectedUser.created_at) }}</p>
          </div>
          <div v-if="address.zip_code" class="border-b border-gray-200 pt-4 pb-4">
            <h3 class="text-lg font-semibold text-blue-900 mb-1">Endereço</h3>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Rua:</span> {{ address.street }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Número:</span> {{ address.number }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Complemento:</span> {{ address.complement }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Bairro:</span> {{ address.district }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Cidade:</span> {{ address.city }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Estado:</span> {{ address.state }}</p>
          </div>
          <div v-else class="border-b border-gray-200 pb-4 pt-4 mb-4">
            <h3 class="text-lg font-semibold text-blue-900 mb-1">Endereço</h3>
            <p>Endereço não cadastrado</p>
          </div>
          <div v-if="vehicle" class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-blue-900 mb-1">Veículo</h3>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Placa:</span> {{ vehicle.plate }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Categoria:</span> {{ vehicle.type.type_name }}</p>
            <p class="text-gray-700"><span class="font-semibold text-gray-900">Marca:</span> {{ vehicle.brand.name }}</p>
          </div>
          <div v-else class="pt-4 mb-4">
            <h3 class="text-lg font-semibold text-blue-900 mb-1">Veículo</h3>
            <p>Veículo não cadastrado</p>
          </div>
        </div>
        <div class="flex flex-col gap-5 mt-8">
          <BaseButton
            label="Fechar" 
            btnClass="cancel"
            @click="closeModal"
          />
          <BaseButton v-if="selectedUser.roles_id != 3"
            :label="selectedUser?.roles_id === 1 ? 'Promover a funcionário' : 'Promover a cliente'"
            @click="promoteUser"
          />
        </div>
      </Modal>
      <Modal :show="showPasswordModal" title="Defina uma senha" @close="closePasswordModal">
        <form class="w-full max-w-sm" @submit.prevent="updateUserPassword">
          <p class="text-3xl font-semibold text-blue-800 mb-8">Defina uma senha</p>
          <div class="mb-4">
            <p class="text-gray-900">A senha deve conter no mínimo 6 caracteres e atender os itens abaixo:</p>
          </div>
          <div class="flex justify-between mb-8">
            <div>
              <p class="text-xl text-center" :class="hasUpperCase ? 'text-green-600' : 'text-gray-500'">A-Z</p>
              <p class="text-sm text-center" :class="hasUpperCase ? 'text-green-600' : 'text-gray-500'">Maiúscula</p>
            </div>
            <div>
              <p class="text-xl text-center" :class="hasLowerCase ? 'text-green-600' : 'text-gray-500'">a-z</p>
              <p class="text-sm text-center" :class="hasLowerCase ? 'text-green-600' : 'text-gray-500'">Minúscula</p>
            </div>
            <div>
              <p class="text-xl text-center" :class="hasNumber ? 'text-green-600' : 'text-gray-500'">0-9</p>
              <p class="text-sm text-center" :class="hasNumber ? 'text-green-600' : 'text-gray-500'">Números</p>
            </div>
            <div>
              <p class="text-xl text-center" :class="hasSpecialChar ? 'text-green-600' : 'text-gray-500'">@</p>
              <p class="text-sm text-center" :class="hasSpecialChar ? 'text-green-600' : 'text-gray-500'">Especial</p>
            </div>
          </div>
          <div class="relative mb-4">
            <BaseInput 
              label="Senha*"
              v-model="formDataPassword.password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              class="mb-0"
              placeholder="Digite sua senha"
              @blur="validatePassword"
              :errorMessage="passwordError"
              required
            />
            <span @click="togglePasswordVisibility('password')" class="absolute top-9 right-0 flex items-center pr-3 cursor-pointer">
              <component :is="showPassword ? 'PhEye' : 'PhEyeSlash'" :size="24" class="text-blue-800" />
            </span>
          </div>
          <div class="relative mb-4">
            <BaseInput 
              label="Senha*" 
              v-model="formDataPassword.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="Digite sua senha" 
              @blur="validatePassword" 
              :errorMessage="passwordError || ''"
            />
            <span @click="togglePasswordVisibility('copyPassword')" class="absolute top-9 right-0 flex items-center pr-3 cursor-pointer">
              <component :is="showCopyPassword ? 'PhEye' : 'PhEyeSlash'" :size="24" class="text-blue-800" />
            </span>
          </div>
          <div class="flex justify-between gap-4 mt-8">
            <BaseButton 
              label="Cancelar" 
              type="button" 
              btnClass="secondary" 
              @click="closePasswordModal"
            />
            <BaseButton 
              type="submit" 
              label="Salvar" 
              :class="isValid" 
              :disabled="!isValid" 
            />
          </div>
          <div class="w-full max-w-[400px] flex justify-between">
          </div>
        </form>
      </Modal>
    </div>
  </div>
  <Footer></Footer>
</template>
