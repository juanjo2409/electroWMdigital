import { checkRouteAccess, isAuthenticated, getCurrentUser } from '../guards/auth.js';
import { renderSidebar, updateActiveSidebarLink } from '../components/Sidebar.js';

// Importación directa de las funciones de renderizado de las vistas
import { renderLogin } from '../views/LoginView.js';
import { renderDashboard } from '../views/DashboardView.js';
import { renderCatalog } from '../views/CatalogView.js';
import { renderRequests } from '../views/RequestsView.js';
import { renderProducts } from '../views/ProductsView.js';
import { renderAccessDenied } from '../views/AccessDeniedView.js';

// Mapa de rutas a sus respectivas funciones de renderizado
const routes = {
  '/login': renderLogin,
  '/dashboard': renderDashboard,
  '/catalog': renderCatalog,
  '/requests': renderRequests,
  '/products': renderProducts,
  '/access-denied': renderAccessDenied
};

/**
 * Resuelve y carga la vista correspondiente según el hash actual en la URL.
 */
async function resolveRoute() {
  const hash = window.location.hash || '#/';
  let path = hash.substring(1).split('?')[0] || '/';
  
  // Redirección de la ruta raíz según el estado de la sesión
  if (path === '/') {
    const user = getCurrentUser();
    if (user) {
      path = '/dashboard';
      window.location.hash = path;
      return;
    } else {
      path = '/login';
      window.location.hash = path;
      return;
    }
  }

  // Verificación de guardias de acceso
  const guard = checkRouteAccess(path);
  if (!guard.allowed && guard.redirect) {
    window.location.hash = guard.redirect;
    return;
  }

  const renderView = routes[path];
  if (!renderView) {
    // Redirección por defecto en caso de rutas desconocidas (404)
    const user = getCurrentUser();
    window.location.hash = user ? '/dashboard' : '/login';
    return;
  }

  const appRoot = document.getElementById('app');
  // Determinar si la página requiere la envoltura de la app (barra lateral)
  const isLayoutRequired = path !== '/login' && path !== '/access-denied' && isAuthenticated();

  if (isLayoutRequired) {
    // Si requiere barra lateral, estructurar el contenedor si no está ya creado
    let contentArea = document.getElementById('main-content-area');
    if (!contentArea) {
      appRoot.innerHTML = `
        <div class="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800 w-full">
          <aside id="sidebar-container" class="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800 flex flex-col"></aside>
          <main class="flex-grow p-4 md:p-8 overflow-y-auto max-w-full">
            <div id="main-content-area" class="max-w-7xl mx-auto space-y-6"></div>
          </main>
        </div>
      `;
      contentArea = document.getElementById('main-content-area');
    }
    
    // Inyectar o actualizar barra lateral
    renderSidebar(document.getElementById('sidebar-container'));
    
    // Resaltar enlace activo
    updateActiveSidebarLink(path);
    
    // Ejecutar función de renderizado en el área de contenidos
    await renderView(contentArea);
  } else {
    // Layouts de pantalla completa (Login, Access Denied)
    appRoot.innerHTML = `<div id="fullscreen-content-area" class="min-h-screen flex items-center justify-center bg-slate-900 p-4"></div>`;
    const fullscreenArea = document.getElementById('fullscreen-content-area');
    await renderView(fullscreenArea);
  }
}

export const router = {
  init() {
    window.addEventListener('hashchange', resolveRoute);
    window.addEventListener('DOMContentLoaded', resolveRoute);
    resolveRoute();
  }
};
