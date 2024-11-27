<script setup>
import { RouterView } from 'vue-router';
</script>

<template >
    <main class="min-h-screen flex justify-center items-center">
      <div class="w-full">
        <Toast />
        <RouterView />
      </div>
    </main>
</template>

<style>
  @import './assets/main.css';
</style>
