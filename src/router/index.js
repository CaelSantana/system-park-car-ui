import { createRouter, createWebHistory } from 'vue-router'
import AuthService from '../services/auth.service';
import store from '../store'
import PasswordView from '../views/public/password/PasswordView.vue'
import SigninView from '../views/public/signin/SigninView.vue'
import SignupView from '../views/public/signup/SignupView.vue'
import HistoricView from '../views/restricted/historic/HistoricView.vue'
import ProfileView from '../views/restricted/profile/ProfileView.vue'
import VehicleView from '../views/restricted/vehicle/VehicleView.vue'
import DashboardView from '../views/restricted/dashboard/DashboardView.vue'
import ParkingSpaceManagementView from '../views/restricted/parkingSpaceManagement/ParkingSpaceManagementView.vue'
import ParkSpacesView from '../views/restricted/parkSpaces/ParkSpacesView.vue'
import RegisterTicketView from '../views/restricted/registerTicket/RegisterTicketView.vue'
import FinanceView from '../views/restricted/finance/FinanceView.vue'
import UsersView from '../views/restricted/users/UsersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'signin',
      component: SigninView
    },
    {
      path: '/criar-conta',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/password',
      name: 'password',
      component: PasswordView
    },
    {
      path: '/perfil',
      name: 'profile',
      component: ProfileView,
      meta: { requiredRole: ['ROLE_USER', 'ROLE_EMPLOYEE', 'ROLE_MASTER'] }
    },
    {
      path: '/historico',
      name: 'historic',
      component: HistoricView,
      meta: { requiredRole: ['ROLE_USER', 'ROLE_EMPLOYEE', 'ROLE_MASTER'] }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiredRole: ['ROLE_EMPLOYEE', 'ROLE_MASTER'] }
    },
    {
      path: '/cadastro-de-veiculo',
      name: 'car',
      component: VehicleView,
      meta: { requiredRole: ['ROLE_EMPLOYEE', 'ROLE_MASTER'] }
    },
    {
      path: '/registro-de-entrada',
      name: 'registerTicket',
      component: RegisterTicketView,
      meta: { requiredRole: ['ROLE_EMPLOYEE', 'ROLE_MASTER'] }
    },
    {
      path: '/registro-de-saida',
      name: 'parkingSpaceManagement',
      component: ParkingSpaceManagementView,
      meta: { requiredRole: ['ROLE_EMPLOYEE', 'ROLE_MASTER'] }
    },
    {
      path: '/patio',
      name: 'parkSpaces',
      component: ParkSpacesView,
      meta: { requiredRole: 'ROLE_MASTER' }
    },
    {
      path: '/financeiro',
      name: 'finance',
      component: FinanceView,
      meta: { requiredRole: 'ROLE_MASTER' }
    },
    {
      path: '/usuarios',
      name: 'users',
      component: UsersView,
      meta: { requiredRole: ['ROLE_USER', 'ROLE_EMPLOYEE', 'ROLE_MASTER'] }
    },
    {
      path: '/acesso-negado',
      name: 'accessDenied',
      component: () => import('../views/public/AccessDeniedView.vue')
    }
  ]
});

router.beforeEach((to, from, next) => {
  const requiredRole = to.meta.requiredRole;
  const token = store.getters.getUserToken;
  if (requiredRole) {
    const userRole = store.getters.getUserRole;
    if (!userRole || AuthService.isTokenExpired(token)) {
      store.dispatch('logout');
      return next({ path: '/' });
    }
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!requiredRoles.includes(userRole)) {
      store.dispatch('logout');
      return next({ path: '/acesso-negado' });
    }
  }
  next();
});


export default router
