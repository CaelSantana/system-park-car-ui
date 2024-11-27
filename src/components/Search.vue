<script setup>
import { ref, computed } from 'vue';

// Props recebidas
const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  filterKeys: {
    type: Array,
    required: true
  }
});

// Termo de busca local
const searchTerm = ref('');

// Computed property para filtrar os itens
const filteredItems = computed(() => {
  return props.items.filter(item => {
    const term = searchTerm.value.toLowerCase();
    return props.filterKeys.some(key => item[key]?.toLowerCase().includes(term));
  });
});
</script>


<template>
  <div class="search-container">
    <!-- Campo de pesquisa -->
    <div class="mb-8">
      <input
        v-model="searchTerm"
        class="w-full h-12 border border-blue-800 px-4 mb-3 lg:mb-0 lg:mr-5"
        name="search"
        placeholder="Pesquisar"
      />
    </div>

    <!-- Cabeçalhos e Linhas (slots) -->
    <div class="container mx-auto overflow-x-auto pb-12">
      <div class="w-full">
        <!-- Slot para os cabeçalhos -->
        <div class="flex justify-between bg-blue-800 text-white px-4 py-2">
          <slot name="table-headers"></slot>
        </div>

        <!-- Lista filtrada de itens -->
        <div v-for="item in filteredItems" :key="item.id" class="flex justify-between items-center bg-white px-4 py-2 border-b">
          <slot name="table-rows" :item="item"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

