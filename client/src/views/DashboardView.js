import { apiFetchProducts } from '../services/api.js';
import { getCurrentUser } from '../guards/auth.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';
import { showToast } from '../components/Toast.js';

/**
 * Renderiza el panel de inicio / control correspondiente según el rol del usuario.
 */
export async function renderDashboard(container) {
  const user = getCurrentUser();
  if (!user) return;

  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    const products = await apiFetchProducts();
    
    if (user.role === 'admin') {
      renderAdminDashboard(container, products, user);
    } else {
      renderClientDashboard(container, products, user);
    }
  } catch (err) {
    showToast('Error al cargar la información del panel.', 'error');
    console.error(err);
  }
}

/**
 * Vista de Dashboard para Administradores
 */
function renderAdminDashboard(container, products, user) {
  // Cálculos estadísticos
  const totalProducts = products.length;
  const requestedProducts = products.filter(p => p.status === 'solicitado');
  const soldProducts = products.filter(p => p.status === 'vendido');
  const availableProducts = products.filter(p => p.status === 'disponible');

  const totalRevenue = soldProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const potentialRevenue = requestedProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  // Agrupamiento por categorías
  const categoriesCount = {};
  products.forEach(p => {
    categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
  });

  const categoryBadgesHTML = Object.entries(categoriesCount).map(([cat, count]) => `
    <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-all duration-200">
      <span class="text-sm font-semibold text-slate-700">${cat}</span>
      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">${count} u.</span>
    </div>
  `).join('');

  // Últimas ventas hechas
  const recentSalesHTML = soldProducts.slice(-3).reverse().map(p => `
    <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
      <div class="overflow-hidden pr-2">
        <h5 class="text-xs font-bold text-slate-800 truncate">${p.name}</h5>
        <p class="text-[10px] font-medium text-slate-500 truncate">Comprador: ${p.buyerName || 'Cliente'}</p>
      </div>
      <div class="text-right whitespace-nowrap">
        <span class="text-xs font-extrabold text-emerald-600">${formatCurrency(p.price)}</span>
        <p class="text-[9px] font-semibold text-slate-400 mt-0.5">${p.soldAt ? formatDate(p.soldAt).split(',')[0] : ''}</p>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Saludo e introducción -->
      <div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">¡Hola, ${user.name}!</h2>
        <p class="text-sm text-slate-500 font-medium">Bienvenido al panel administrativo de ElectroShop. Aquí tienes el estado actual del negocio.</p>
      </div>

      <!-- Tarjetas de Estadísticas Principales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Ingresos Totales -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div class="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Totales</span>
            <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">${formatCurrency(totalRevenue)}</h3>
          </div>
        </div>

        <!-- Pedidos Solicitados -->
        <a href="#/requests" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-indigo-200 transition-colors cursor-pointer group">
          <div class="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Por Confirmar</span>
            <div class="flex items-center gap-2 mt-1">
              <h3 class="text-xl md:text-2xl font-extrabold text-slate-900">${requestedProducts.length} u.</h3>
              <span class="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">Pendientes</span>
            </div>
          </div>
        </a>

        <!-- Stock Disponible -->
        <a href="#/products" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-indigo-200 transition-colors cursor-pointer group">
          <div class="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Disponibles</span>
            <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">${availableProducts.length} u.</h3>
          </div>
        </a>

        <!-- Ventas Confirmadas -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div class="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Entregadas</span>
            <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">${soldProducts.length} u.</h3>
          </div>
        </div>
      </div>

      <!-- Sección de Desglose Detallado -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Productos por Categoría -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4">
          <div>
            <h4 class="text-base font-bold text-slate-900">Inventario por Categoría</h4>
            <p class="text-xs text-slate-400">Distribución de los productos registrados en el sistema</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${categoryBadgesHTML || `<p class="text-xs text-slate-400 col-span-2">No hay productos en inventario.</p>`}
          </div>
        </div>

        <!-- Ventas Recientes -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <h4 class="text-base font-bold text-slate-900">Últimas Ventas</h4>
            <p class="text-xs text-slate-400">Últimas transacciones aprobadas</p>
          </div>
          <div class="space-y-3">
            ${recentSalesHTML || `
              <div class="text-center py-6 text-slate-400">
                <p class="text-xs font-semibold">No se han registrado ventas aún</p>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Vista de Dashboard para Clientes
 */
function renderClientDashboard(container, products, user) {
  // Estadísticas del cliente
  const clientRequests = products.filter(p => p.buyerId === user.id);
  const clientPending = clientRequests.filter(p => p.status === 'solicitado');
  const clientPurchased = clientRequests.filter(p => p.status === 'vendido');
  const totalSpent = clientPurchased.reduce((sum, p) => sum + (p.price || 0), 0);

  // Recomendación de productos disponibles (máximo 3)
  const recommendations = products.filter(p => p.status === 'disponible').slice(0, 3);
  
  const recommendationsHTML = recommendations.map(p => `
    <div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl hover:shadow-sm transition-all duration-200 flex flex-col justify-between h-full space-y-4">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase border border-indigo-100">${p.category}</span>
          <span class="text-xs font-bold text-slate-400">${p.brand}</span>
        </div>
        <h5 class="text-sm font-bold text-slate-800 line-clamp-1">${p.name}</h5>
        <p class="text-xs text-slate-500 mt-1 line-clamp-2">${p.description}</p>
      </div>
      <div class="flex items-center justify-between pt-2">
        <span class="text-base font-extrabold text-slate-950">${formatCurrency(p.price)}</span>
        <a href="#/catalog" class="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors">
          Ver Detalles
        </a>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Tarjeta de Bienvenida Principal (Vistosa, moderna) -->
      <div class="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 md:p-8 shadow-md">
        <!-- Fondo Decorativo -->
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600 rounded-full blur-3xl opacity-35"></div>
        <div class="absolute -left-10 -top-10 w-48 h-48 bg-purple-600 rounded-full blur-3xl opacity-35"></div>

        <div class="relative z-10 space-y-3 max-w-xl">
          <span class="inline-block px-3 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold tracking-wider uppercase">Panel de Cliente</span>
          <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight">¡Bienvenido a ElectroShop, ${user.name}!</h2>
          <p class="text-sm text-slate-300 font-medium leading-relaxed">
            Explora las mejores ofertas en electrodomésticos para tu hogar. Solicita tu compra con un solo clic y nosotros procesaremos tu pedido de inmediato.
          </p>
          <div class="pt-3">
            <a href="#/catalog" class="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-900/30 transition-colors">
              Explorar Catálogo de Productos
            </a>
          </div>
        </div>
      </div>

      <!-- Tarjetas de Actividad del Cliente -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Total Gastado -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div class="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Inversión Total</span>
            <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">${formatCurrency(totalSpent)}</h3>
          </div>
        </div>

        <!-- Pedidos en Proceso -->
        <a href="#/requests" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-indigo-200 transition-colors group cursor-pointer">
          <div class="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pedidos Solicitados</span>
            <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">${clientPending.length} u.</h3>
          </div>
        </a>

        <!-- Productos Adquiridos -->
        <a href="#/requests" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-indigo-200 transition-colors group cursor-pointer">
          <div class="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Productos Adquiridos</span>
            <h3 class="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">${clientPurchased.length} u.</h3>
          </div>
        </a>
      </div>

      <!-- Recomendaciones de Electrodomésticos -->
      <div class="space-y-4">
        <div>
          <h4 class="text-lg font-bold text-slate-900">Recomendaciones para ti</h4>
          <p class="text-xs text-slate-400">Productos disponibles que te pueden interesar</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${recommendationsHTML || `
            <div class="bg-white border border-slate-100 p-6 rounded-2xl text-center text-slate-400 col-span-3">
              <p class="text-sm font-semibold">No hay recomendaciones disponibles en este momento.</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
