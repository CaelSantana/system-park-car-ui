import { ref } from 'vue';

const toasts = ref([]);

export function useToast() {
  const addToast = (message, type = 'success', duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter(toast => toast.id !== id);
    }, duration);
  };

  return { toasts, addToast };
}
