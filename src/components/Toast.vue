<script setup>
import { useToast } from '../composables/useToast'; // Importe a função personalizada

const { toasts } = useToast(); // Use o toasts a partir da função personalizada
</script>

<template>
  <div class="toast-container">
    <div 
      v-for="(toast, index) in toasts" 
      :key="toast.id" 
      class="toast" 
      :class="toast.type"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}

.toast {
  background-color: #48bb78; /* Cor de fundo padrão (verde para sucesso) */
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
  /* fadeIn dura 0.5s, o toast permanece visível por 2.5s antes do fadeOut */
}

.toast.error {
  background-color: #f56565; /* Vermelho para erros */
}

.toast.success {
  background-color: #48bb78; /* Verde para sucesso */
}

.toast.warning {
  background-color: #ecc94b; /* Amarelo para avisos */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px); /* Vindo de cima */
  }
  to {
    opacity: 1;
    transform: translateY(0); /* Posição final */
  }
}

/* Animação de saída: o toast esmaece e sobe de volta */
@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0); /* Posição atual */
  }
  to {
    opacity: 0;
    transform: translateY(-20px); /* Sobe para cima enquanto esmaece */
  }
}
</style>