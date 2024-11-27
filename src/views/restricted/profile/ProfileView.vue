<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import store from '../../../store/index'
import UserService from './../../../services/user.service';
import AddressService from './../../../services/address.service';
import VehicleService from './../../../services/vehicles.service';
import SearchCepService from "../../../services/search-cep.service";
import { useValidators } from '@/composables/useValidators';
import NavBar from '../../../components/NavBar.vue';
import BaseInput from '../../../components/BaseInput.vue';
import BaseButton from '../../../components/BaseButton.vue';
import Footer from '../../../components/Footer.vue';
import { useToast } from '../../../composables/useToast';
import Modal from '../../../components/Modal.vue';
import Tooltip from '../../../components/Tooltip.vue';

const { addToast } = useToast();

const originalFormData = ref({});
const originalAddress = ref({});
const isLoggedIn = store.getters.getUserData;
const showModal = ref(false);
const user = ref(null);
const isEditingProfile = ref(false);
const isEditingAddress = ref(false);
const isCepValid = ref(false);
const formData = ref({ phone: '', password: '', copyPassword: '' });
const address = ref({ id: '', zip_code: '', street: '', number: '', complement: '', state: '', city: '', district: '' });
const vehicle = ref({ id: '', plate: '', vehicles_type_id: '', brands_id: '' });
const showPassword = ref(false);
const showCopyPassword = ref(false);
let isCancelling = false;

const {
  phoneError,
  validatePhone,
  passwordError,
  copyPasswordError,
  validatePassword,
  hasUpperCase,
  hasLowerCase,
  hasNumber,
  hasSpecialChar,
} = useValidators(formData.value);

const isValid = computed(() => {
  return formData.value.phone && !phoneError.value
});

const isPasswordValid = computed(() => {
  const password = formData.value.password || '';
  const copyPassword = formData.value.copyPassword || '';
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  const isPasswordValid = password.trim() !== '' && passwordRegex.test(password);
  const isCopyPasswordValid = copyPassword === password;
  return isPasswordValid && isCopyPasswordValid;
});

watch(() => formData.value.password, validatePassword);
watch(() => formData.value.copyPassword, validatePassword);
watch(() => formData.value.phone, () => { if (!isCancelling) validatePhone(); });
watch(() => address.value.complement, () => {});

onMounted(async () => {
  await loadUser();
  if (user.value) {
    formData.value.phone = user.value.phone;
  }
});

async function loadUser() {
  if (isLoggedIn) {
    try {
      user.value = await UserService.getUser(isLoggedIn.id);
      user.value.birth = formatDateBefore(user.value.birth);
      const addressResponse = await AddressService.getAddressByUserId(isLoggedIn.id);
      if (addressResponse) {
      address.value = addressResponse;
    } else {
      address.value = { id: '', street: '', number: '', complement: '', state: '', city: '', district: '' };
    }
      const vehicleResponse = await VehicleService.getVehicleByUserId(isLoggedIn.id);
      if (vehicleResponse && vehicleResponse[0]) {
        vehicle.value = vehicleResponse[0];
      } else {
        vehicle.value = { id: '', plate: '', vehicles_type_id: '', brands_id: '' };
      }
    } catch (error) {
      console.error('Error fetching user or address:', error);
    }
  } else {
    console.error('Token JWT não encontrado no localStorage');
  }
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

function editarAddress() {
  isEditingAddress.value = true;
  originalAddress.value = { ...address.value };
}

function cancelEditAddress() {
  isEditingAddress.value = false;
  address.value = { ...originalAddress.value };
}

async function updateProfile() {
  if (isValid.value) {
    isEditingProfile.value = false;
    try {
      user.value.phone = formData.value.phone;
      await UserService.updateUser(isLoggedIn.id, user.value);
      addToast('Perfil atualizado com sucesso!', 'success');
    } catch (error) {
      addToast('Erro ao atualizar o perfil.', 'error');
    }
  }
}

async function updateUserPassword() {
  if (isValid.value) {
    isEditingProfile.value = false;
    try {
      user.value.password = formData.value.password;
      await UserService.updateUserPassword(isLoggedIn.id, user.value);
      closeModal()
      addToast('Senha atualizada com sucesso!', 'success');
    } catch (error) {
      addToast('Erro ao atualizar a senha.', 'error');
    }
  }
}

async function searchCep() {
  if (address.value.zip_code) {
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

async function saveAddrees() {
  isEditingAddress.value = false;
  try {
    await UserService.createAddress(isLoggedIn.id, address.value);
    addToast('Endereço cadastrado com sucesso!', 'success');
    await loadUser();
  } catch (error) {
    addToast('Erro ao cadastrar o endereço.', 'error');
  }
}

async function updateAddrees() {
  isEditingAddress.value = false;
  try {
    await UserService.updateAddress(isLoggedIn.id, address.value);
    addToast('Endereço atualizado com sucesso!', 'success');
  } catch (error) {
    addToast('Erro ao atualizar o endereço.', 'error');
  }
}

const formatDateBefore = (date) => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

async function openModal() {
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

const togglePasswordVisibility = (type) => {
  if (type === 'password') {
    showPassword.value = !showPassword.value;
  } else if (type === 'copyPassword') {
    showCopyPassword.value = !showCopyPassword.value;
  }
};

</script>

<template>
  <div class="sm:h-screen">
    <NavBar label="Perfil" />
    <div v-if="user" class="container mx-auto pb-28">
      <div class="w-full h-12 flex items-center bg-blue-800 gap-2 px-4">
        <p class="text-lg text-white">Dados do usuário</p>
        <Tooltip text="Caso precise corrigir alguma informação bloqueada, procure nossos canais de atendimento." position="right">
          <template #icon>
            <PhQuestion :size="24" class="text-white cursor-pointer" />
          </template>
        </Tooltip>
      </div>
      <div class="border border-blue-800 p-5 mb-8">
        <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0">
          <BaseInput label="Nome*" v-model="user.full_name" name="name" placeholder="Informe seu nome" required
            :disabled="true" />
          <BaseInput label="Data de nascimento*" v-model="user.birth" maska="date" name="birth" placeholder="00/00/0000"
            required :disabled="true" />
          <BaseInput label="CPF*" v-model="user.cpf" name="cpf" maska="cpf" placeholder="000.000.000-00" required
            :disabled="true" />
          <BaseInput label="E-mail*" v-model="user.email" placeholder="Informe seu e-mail" name="email"
            :disabled="true" />
          <BaseInput label="Telefone*" v-model="formData.phone" maska="phone" name="phone" @blur="validatePhone"
            placeholder="(00) 00000-0000" :errorMessage="phoneError" required :disabled="!isEditingProfile" />
          <BaseButton btnClass="secondary" class="mt-8 lg:mt-6" icon="PhLockKey" label="Alterar senha minha senha"
            @click="openModal(item)" />
          <div class="lg:col-start-2 xl:col-start-3 lg:flex gap-5 mt-5 lg:mt-0">
            <BaseButton v-if="!isEditingProfile" btnClass="secondary" label="Editar Dados" icon="PhPencilSimpleLine"
              @click="editProfile" />
            <BaseButton v-if="isEditingProfile" btnClass="cancel" label="Cancelar" class="mb-5 lg:mb-0"
              @click="cancelEditProfile" />
            <BaseButton v-if="isEditingProfile" label="Atualizar" icon="PhFloppyDisk" @click="updateProfile"
              :disabled="!isValid" />
          </div>
        </div>
      </div>
      <div class="w-full h-12 flex items-center bg-blue-800 px-4">
        <p class="text-lg text-white">Endereço</p>
      </div>
      <div class="border border-blue-800 p-5 mb-8">
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
            <BaseButton v-if="!isEditingAddress" type="button" name="editar" btnClass="secondary" label="Editar Dados"
              icon="PhPencilSimpleLine" @click="editarAddress" />
            <BaseButton v-if="isEditingAddress" type="button" name="cancelar" btnClass="cancel" label="Cancelar"
              class="mb-5 lg:mb-0" @click="cancelEditAddress" />
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
      <div v-if="vehicle && vehicle.plate" class="border border-blue-800 p-5">
        <div class="grid lg:grid-cols-2 xl:grid-cols-3 gap-5 gap-y-0">
          <BaseInput label="Placa*" v-model="vehicle.plate" name="plate" placeholder="ABC1C34" :disabled="true" />
          <BaseInput label="Categoria*" v-model="vehicle.type.type_name" name="vehicles_type"
            placeholder="Categoria do veículo" :disabled="true" />
          <BaseInput label="Marca*" v-model="vehicle.brand.name" name="brand" placeholder="Marca do veículo"
            :disabled="true" />
        </div>
      </div>
      <div v-else class="md:flex justify-center items-center gap-5 border border-blue-800 p-5">
        <div>
          <img src="../../../assets/img/image-001.jpg" alt="" class="w-80 mx-auto mb-5">
        </div>
        <div>
          <p class="text-gray-900">O cadastro do veículo será realizado no primeiro atendimento, <br />para agilizar esse processo realise o
            cadastro do endereço <br />e mantenha os dados atualizados</p><br />
          <p><strong>Equipe:</strong> System Car Park</p>
        </div>
      </div>
    </div>
    <Modal :show="showModal" title="Defina uma senha" @close="closeModal">
      <form class="w-full max-w-sm" @submit.prevent="updateUserPassword">
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
          <BaseInput label="Senha*" v-model="formData.password" :type="showPassword ? 'text' : 'password'"
            name="password" class="mb-0" placeholder="Digite sua senha" @blur="validatePassword"
            :errorMessage="passwordError" required />
          <span @click="togglePasswordVisibility('password')"
            class="absolute top-9 right-0 flex items-center pr-3 cursor-pointer">
            <component :is="showPassword ? 'PhEye' : 'PhEyeSlash'" :size="24" class="text-blue-800" />
          </span>
        </div>
        <div class="relative mb-4">
          <BaseInput label="Repita a senha*" v-model="formData.copyPassword"
            :type="showCopyPassword ? 'text' : 'password'" name="copyPassword" class="mb-0" @blur="validatePassword"
            placeholder="Digite sua senha novamente" :errorMessage="copyPasswordError" required />
          <span @click="togglePasswordVisibility('copyPassword')"
            class="absolute top-9 right-0 flex items-center pr-3 cursor-pointer">
            <component :is="showCopyPassword ? 'PhEye' : 'PhEyeSlash'" :size="24" class="text-blue-800" />
          </span>
        </div>
        <div class="flex justify-between gap-4 mt-8">
          <BaseButton label="Cancelar" type="button" btnClass="cancel" @click="closeModal" />
          <BaseButton type="submit" label="Salvar" :class="isPasswordValid" :disabled="!isPasswordValid" />
        </div>
      </form>
    </Modal>
  </div>
  <Footer></Footer>
</template>
