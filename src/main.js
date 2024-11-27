import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'
import vue3GoogleLogin from 'vue3-google-login';
import PhosphorIcons from "@phosphor-icons/vue"
import Toast from './components/Toast.vue';

const app = createApp(App)

app.use(router)
app.use(store)
app.use(PhosphorIcons)
app.component('Toast', Toast);

app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
});

app.mount('#app')
