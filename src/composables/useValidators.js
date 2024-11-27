import { ref, computed } from 'vue';
import UserService from '@/services/user.service';

export function useValidators(formData) {
  const nameError = ref('');
  const dateError = ref('');
  const phoneError = ref('');
  const emailError = ref('');
  const cpfError = ref('');
  const passwordError = ref('');
  const copyPasswordError = ref('');
  const isEmailUnique = ref(false);
  const isCPFUnique = ref(false);
  const hasUpperCase = computed(() => /[A-Z]/.test(formData.password || ''));
  const hasLowerCase = computed(() => /[a-z]/.test(formData.password || ''));
  const hasNumber = computed(() => /\d/.test(formData.password || ''));
  const hasSpecialChar = computed(() => /[@$!%*?&]/.test(formData.password || ''));
  const validateName = () => {
    const parts = (formData.full_name).trim().split(' ');
    if (parts.length < 2 || parts.some(part => part === '')) {
      nameError.value = 'Por favor, informe seu nome completo.';
    } else {
      nameError.value = '';
    }
  };
  
  const validateDate = () => {
    const [day, month, year] = formData.birth.split('/');
    const birthDate = new Date(`${year}-${month}-${day}`);
    const currentDate = new Date();
    const minAgeDate = new Date(currentDate.getFullYear() - 18, currentDate.getMonth(), currentDate.getDate());
    if (isNaN(birthDate) || birthDate >= currentDate) {
      dateError.value = 'Por favor, informe uma data de nascimento válida.';
    } else if (birthDate > minAgeDate) {
      dateError.value = 'A idade mínima para criar uma conta é de 18 anos.';
    } else {
      dateError.value = '';
    }
  };

  const isCPFFormatValid = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  };

  const validateCPF = async () => {
    const formattedCPF = (formData.cpf || formData.value.cpf).replace(/\D/g, '');
    if (!isCPFFormatValid(formattedCPF)) {
      cpfError.value = 'Formato de CPF inválido';
      isCPFUnique.value = false;
    } else {
      cpfError.value = '';
      await checkCPF();
    }
  };

  const checkCPF = async () => {
    if (formData.cpf) {
      try {
        const response = await UserService.getUserByCPF(formData.cpf);
        if (response.exists) {
          cpfError.value = 'CPF já está em uso';
          isCPFUnique.value = false;
        } else {
          cpfError.value = '';
          isCPFUnique.value = true;
        }
      } catch (error) {
        cpfError.value = 'Erro ao verificar o CPF';
        isCPFUnique.value = false;
      }
    }
  };

  const isEmailFormatValid = computed(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email || formData.value.email);
  });

  const validateEmailLogin = async () => {
    if (!isEmailFormatValid.value) {
      emailError.value = 'Formato de email inválido';
      isEmailUnique.value = false;
    } else {
      emailError.value = '';
    }
  };

  const validateEmail = async () => {
    if (!isEmailFormatValid.value) {
      emailError.value = 'Formato de email inválido';
      isEmailUnique.value = false;
    } else {
      emailError.value = '';
      await checkEmail();
    }
  };

  const checkEmail = async () => {
    if (formData.email) {
      try {
        const response = await UserService.getUserByEmail(formData.email);
        if (response.exists) {
          emailError.value = 'Email já está em uso';
          isEmailUnique.value = false;
        } else {
          emailError.value = '';
          isEmailUnique.value = true;
        }
      } catch (error) {
        emailError.value = 'Erro ao verificar o email';
        isEmailUnique.value = false;
      }
    }
  };

  const validatePhone = () => {
    const phoneDigits = (formData.phone || formData.value.phone || '').replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      phoneError.value = 'Por favor, informe um número de telefone válido.';
    } else {
      phoneError.value = '';
    }
  };

  const validatePassword = () => {
    const password = formData.password || '';
  
    if (!hasUpperCase.value) {
      passwordError.value = 'A senha precisa conter pelo menos uma letra maiúscula.';
    } else if (!hasLowerCase.value) {
      passwordError.value = 'A senha precisa conter pelo menos uma letra minúscula.';
    } else if (!hasNumber.value) {
      passwordError.value = 'A senha precisa conter pelo menos um número.';
    } else if (!hasSpecialChar.value) {
      passwordError.value = 'A senha precisa conter pelo menos um caractere especial.';
    } else if (!isPasswordFormatValid(password)) {
      passwordError.value = 'A senha não atende os requisitos mínimos.';
    } else {
      passwordError.value = '';
    }
  
    validatePasswordsMatch();
  };
  

  const isPasswordFormatValid = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  };

  // const validatePassword = () => {
  //   if (!isPasswordFormatValid(formData.password)) {
  //     passwordError.value = 'Formato de senha inválido';
  //   } else {
  //     passwordError.value = '';
  //   }

  //   validatePasswordsMatch();
  // };

  const validatePasswordsMatch = () => {
    if (formData.password !== formData.copyPassword) {
      copyPasswordError.value = 'As senhas não coincidem.';
    } else {
      copyPasswordError.value = '';
    }
  };

  const togglePasswordVisibility = (type) => {
    if (type === 'password') {
      showPassword.value = !showPassword.value;
    } else if (type === 'copyPassword') {
      showCopyPassword.value = !showCopyPassword.value;
    }
  };

  function validatePlate() {
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/; // Aceita ambos os formatos
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

  return {
    nameError,
    dateError,
    phoneError,
    emailError,
    cpfError,
    isEmailUnique,
    isCPFUnique,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    passwordError,
    copyPasswordError,
    validateName,
    validateDate,
    validateCPF,
    validateEmail,
    validateEmailLogin,
    validatePhone,
    validatePassword,
    validatePasswordsMatch,
    togglePasswordVisibility,
    validatePlate,
    validateVehicleType,
    validateBrand
  };
}
