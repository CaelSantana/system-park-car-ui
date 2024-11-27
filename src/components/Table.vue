<script setup>
const props = defineProps({
  columns: Array, // Lista de colunas [{ label: 'Nome da Coluna', key: 'chaveNoObjeto', width: 'w-48' }]
  data: Array     // Dados da tabela [{ id: 1, nome: 'Exemplo', ... }]
});

// Função para obter o valor da chave no objeto de dados
function getValue(row, key) {
  return row[key] || 'N/A'; // Caso o valor não exista, retorna 'N/A'
}
</script>

<!-- GenericTable.vue -->
<template>
  <div class="container overflow-x-auto mx-auto">
    <div class="bg-white mb-8">
      <!-- Cabeçalho da tabela -->
      <div class="w-full h-12 flex justify-between items-center bg-blue-800 pl-3">
        <div v-for="column in columns" :key="column.key" :class="column.width" class="shrink-0">
          <p class="text-white">{{ column.label }}</p>
        </div>
      </div>

      <!-- Corpo da tabela -->
      <div v-if="data && data.length" class="w-full">
        <div v-for="row in data" :key="row.id" class="flex justify-between items-center pl-3 border-b">
          <div v-for="column in columns" :key="column.key" :class="column.width" class="h-12 flex items-center shrink-0">
            <p class="text-gray-900">{{ getValue(row, column.key) }}</p>
          </div>
        </div>
      </div>

      <!-- Caso não haja dados -->
      <div v-else class="h-14 flex justify-center items-center">
        <p class="text-center">Nenhum dado encontrado.</p>
      </div>
    </div>
  </div>
</template>
