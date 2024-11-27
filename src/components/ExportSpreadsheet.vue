<script setup>
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  filename: {
    type: String,
    default: 'dados.xlsx'
  },
  columns: {
    type: Array,
    required: true
  }
});

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Dados');

  // Definindo as colunas
  worksheet.columns = props.columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15
  }));

  // Adicionando os dados
  props.data.forEach(item => {
    worksheet.addRow(item);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), props.filename);
};

</script>

<template>
  <button @click="exportToExcel" type="button" class="w-56 h-12 flex justify-center items-center gap-3 bg-green-800 text-white">
    <PhMicrosoftExcelLogo :size="24" /> Exportar Excel
  </button>
</template>
