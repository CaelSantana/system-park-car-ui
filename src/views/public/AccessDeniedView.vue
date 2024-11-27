<template>
  <div class="access-denied">
    <h3 class="text-xl font-bold">Acesso Negado</h3>
    <h3 class="text-xl font-bold mt-4">Você não tem permissão para acessar esta página.</h3>
    <div class="w-full max-w-xl m-auto">
      <img src="../../assets/img/image-002.jpg" alt="imgame de erro">
    </div>
    <div class="w-fit border-4 border-red-400 rounded-full p-2 m-auto">
      <RouterLink to="/" class="text-lg font-bold sm:text-xl text-red-400">Voltar para a página inicial</RouterLink>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.access-denied {
  text-align: center;
}
</style>
