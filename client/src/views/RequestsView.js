import { apiFetchProducts, apiPatchProduct } from '../services/api.js';
import { getCurrentUser } from '../guards/auth.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';
import { showToast } from '../components/Toast.js';

let activeTab = 'pending'; // 'pending' | 'sold'

/**
 * Renderiza el gestor de solicitudes de compra (pedidos).
 */
export async function renderRequests(container) {
  const user = getCurrentUser();
  if (!user) return;

  await loadRequestsContent(container, user);
}

async function loadRequestsContent(container, user) {
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    const products = await apiFetchProducts();
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      renderAdminRequests(container, products);
    } else {
      renderClientRequests(container, products, user);
    }
  } catch (err) {
    showToast('Error al cargar las solicitudes de compra.', 'error');
    console.error(err);
  }
}

/**
 * Renderizado para el Administrador
 */
function renderAdminRequests(container, products) {
  const pendingRequests = products.filter(p => p.status === 'solicitado');
  const soldHistory = products.filter(p => p.status === 'vendido');

  const activeList = activeTab === 'pending' ? pendingRequests : soldHistory;

  const tabsHTML = `
    <div class="border-b border-slate-200">
      <nav class="-mb-px flex space-x-6" aria-label="Tabs">
        <button id="tab-pending" class="px-1 py-4 border-b-2 font-bold text-sm cursor-pointer whitespace-nowrap transition-colors ${
          activeTab === 'pending'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }">
          Solicitudes Pendientes
          <span class="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full ${
            activeTab === 'pending' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }">${pendingRequests.length}</span>
        </button>
        <button id="tab-sold" class="px-1 py-4 border-b-2 font-bold text-sm cursor-pointer whitespace-nowrap transition-colors ${
          activeTab === 'sold'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }">
          Historial de Ventas
          <span class="ml-2 py-0.5 px-2 text-xs font-semibold rounded-full ${
            activeTab === 'sold' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }">${soldHistory.length}</span>
        </button>
      </nav>
    </div>
  `;

  let tableRowsHTML = '';
  if (activeList.length === 0) {
    tableRowsHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-slate-400">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            <p class="font-bold text-slate-600">No hay registros para mostrar</p>
            <p class="text-xs text-slate-500">${
              activeTab === 'pending' 
                ? 'No tienes solicitudes de compra por el momento.' 
                : 'Aún no se ha concretado ninguna venta en la tienda.'
            }</p>
          </div>
        </td>
      </tr>
    `;
  } else {
    tableRowsHTML = activeList.map(p => {
      const buyerInfo = `<div class="font-bold text-slate-800">${p.buyerName || 'Cliente'}</div><div class="text-[10px] text-slate-400 font-mono">ID: ${p.buyerId}</div>`;
      const dateInfo = activeTab === 'pending' 
        ? formatDate(p.requestedAt) 
        : formatDate(p.soldAt);

      const actionButtons = activeTab === 'pending' 
        ? `
          <button data-id="${p.id}" data-action="confirm" class="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer" title="Confirmar Venta / Entregar">
            Confirmar Venta
          </button>
          <button data-id="${p.id}" data-action="reject" class="inline-flex items-center px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer" title="Rechazar y liberar producto">
            Rechazar
          </button>
        ` 
        : `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <svg class="w-3.5 h-3.5 text-emerald-500 mr-1" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
            Entregado
          </span>
        `;

      return `
        <tr class="hover:bg-slate-50/40 transition-colors">
          <td class="px-6 py-4 font-bold text-slate-800">
            <div>${p.name}</div>
            <div class="text-[10px] text-indigo-600 font-extrabold uppercase mt-0.5">${p.category} • ${p.brand}</div>
          </td>
          <td class="px-6 py-4 text-slate-800 font-extrabold">${formatCurrency(p.price)}</td>
          <td class="px-6 py-4">${buyerInfo}</td>
          <td class="px-6 py-4 text-slate-500 font-medium">${dateInfo}</td>
          <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
            ${actionButtons}
          </td>
        </tr>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado de la página -->
      <div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Pedidos y Solicitudes</h2>
        <p class="text-sm text-slate-500 font-medium">Revisa las compras solicitadas por tus clientes y confirma la entrega de los electrodomésticos</p>
      </div>

      <!-- Barra de Pestañas (Tabs) -->
      ${tabsHTML}

      <!-- Tabla de Solicitudes -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th class="px-6 py-4">Electrodoméstico</th>
                <th class="px-6 py-4">Monto</th>
                <th class="px-6 py-4">Comprador</th>
                <th class="px-6 py-4">${activeTab === 'pending' ? 'Solicitado El' : 'Vendido El'}</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              ${tableRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Cambiar de pestañas
  container.querySelector('#tab-pending').addEventListener('click', () => {
    activeTab = 'pending';
    loadRequestsContent(container, getCurrentUser());
  });

  container.querySelector('#tab-sold').addEventListener('click', () => {
    activeTab = 'sold';
    loadRequestsContent(container, getCurrentUser());
  });

  // Delegar eventos de acciones del administrador
  if (activeTab === 'pending' && activeList.length > 0) {
    container.querySelector('tbody').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      const product = pendingRequests.find(p => p.id === id);

      if (!product) return;

      if (action === 'confirm') {
        Swal.fire({
          title: 'Confirmar Venta del Producto',
          html: `¿Estás seguro de que deseas marcar como <strong>vendido</strong> el producto <strong>${product.name}</strong> solicitado por <strong>${product.buyerName}</strong>?<br><br>Esta acción descontará el producto del inventario disponible.`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Sí, Confirmar Venta',
          cancelButtonText: 'Cancelar',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-2xl border border-slate-100 shadow-xl'
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await apiPatchProduct(product.id, {
                status: 'vendido',
                soldAt: new Date().toISOString()
              });

              showToast('¡Venta registrada con éxito!');
              loadRequestsContent(container, getCurrentUser());
            } catch (err) {
              showToast('Error al registrar la venta.', 'error');
              console.error(err);
            }
          }
        });
      } else if (action === 'reject') {
        Swal.fire({
          title: 'Rechazar Solicitud de Compra',
          html: `¿Deseas rechazar la solicitud de <strong>${product.buyerName}</strong>? El producto <strong>${product.name}</strong> volverá a estar <strong>disponible</strong> en el catálogo.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Sí, Rechazar Solicitud',
          cancelButtonText: 'Cancelar',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-2xl border border-slate-100 shadow-xl'
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await apiPatchProduct(product.id, {
                status: 'disponible',
                buyerId: null,
                buyerName: null,
                requestedAt: null,
                soldAt: null
              });

              showToast('Solicitud rechazada. Producto liberado.');
              loadRequestsContent(container, getCurrentUser());
            } catch (err) {
              showToast('Error al procesar el rechazo de la solicitud.', 'error');
              console.error(err);
            }
          }
        });
      }
    });
  }
}

/**
 * Renderizado para el Cliente
 */
function renderClientRequests(container, products, user) {
  const myRequests = products.filter(p => p.buyerId === user.id);

  let tableRowsHTML = '';
  if (myRequests.length === 0) {
    tableRowsHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-slate-400">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <p class="font-bold text-slate-600">No has realizado pedidos</p>
            <p class="text-xs text-slate-500">Navega por el Catálogo para comprar tus electrodomésticos.</p>
          </div>
        </td>
      </tr>
    `;
  } else {
    tableRowsHTML = myRequests.map(p => {
      let badgeHTML = '';
      let dateLabel = 'Solicitado el';
      let dateValue = formatDate(p.requestedAt);

      if (p.status === 'solicitado') {
        badgeHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">Pendiente de Venta</span>`;
      } else if (p.status === 'vendido') {
        badgeHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Compra Concretada</span>`;
        dateLabel = 'Vendido el';
        dateValue = formatDate(p.soldAt);
      }

      return `
        <tr class="hover:bg-slate-50/40 transition-colors">
          <td class="px-6 py-4 font-bold text-slate-800">
            <div>${p.name}</div>
            <div class="text-[10px] text-slate-400 font-medium mt-0.5">${p.brand} • ${p.category}</div>
          </td>
          <td class="px-6 py-4 text-slate-800 font-extrabold">${formatCurrency(p.price)}</td>
          <td class="px-6 py-4">${badgeHTML}</td>
          <td class="px-6 py-4 text-slate-500 font-medium">
            <div class="text-xs font-semibold text-slate-400 uppercase">${dateLabel}</div>
            <div class="mt-0.5 text-slate-700">${dateValue}</div>
          </td>
        </tr>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <!-- Encabezado de la página -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Mis Compras</h2>
          <p class="text-sm text-slate-500 font-medium">Historial y estado de tus compras solicitadas en ElectroShop</p>
        </div>
        <a href="#/catalog" class="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md transition-all duration-200">
          Comprar Más
        </a>
      </div>

      <!-- Tabla de Compras -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead>
              <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th class="px-6 py-4">Electrodoméstico</th>
                <th class="px-6 py-4">Precio</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4">Detalle de Fecha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              ${tableRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
