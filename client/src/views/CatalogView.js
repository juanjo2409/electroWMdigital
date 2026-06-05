import { apiFetchProducts, apiPatchProduct, BASE_URL } from '../services/api.js';
import { getCurrentUser } from '../guards/auth.js';
import { formatCurrency } from '../utils/helpers.js';
import { showToast } from '../components/Toast.js';

let currentFilterCategory = 'All';
let currentSearchQuery = '';

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // If running on local dev server but json-server is not serving images,
  // we can also fallback or try serving it. Prepending BASE_URL (http://localhost:3001)
  // is standard since json-server is the source of truth for the API.
  return `${BASE_URL}${url}`;
};

/**
 * Renderiza la vista del catálogo de productos.
 */
export async function renderCatalog(container) {
  // Inicializar esqueleto de carga
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Catálogo de Productos</h2>
          <p class="text-sm text-slate-500 font-medium">Encuentra los mejores electrodomésticos para tu hogar</p>
        </div>
      </div>
      <div class="flex items-center justify-center min-h-[300px]">
        <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    </div>
  `;

  await loadCatalogContent(container);
}

async function loadCatalogContent(container) {
  try {
    const products = await apiFetchProducts();
    const user = getCurrentUser();

    // Obtener lista única de categorías para los filtros
    const categories = ['All', ...new Set(products.map(p => p.category))];

    // Función interna para refrescar el render de la cuadrícula de productos
    const filterAndRender = () => {
      const filtered = products.filter(p => {
        const matchesCategory = currentFilterCategory === 'All' || p.category === currentFilterCategory;
        const matchesSearch = p.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
                             p.description.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
                             p.brand.toLowerCase().includes(currentSearchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      const gridContainer = container.querySelector('#catalog-grid');
      if (!gridContainer) return;

      if (filtered.length === 0) {
        gridContainer.innerHTML = `
          <div class="col-span-full py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <svg class="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"></path></svg>
            <p class="font-bold text-slate-600">No se encontraron productos</p>
            <p class="text-xs text-slate-500">Prueba ajustando tus criterios de búsqueda o categoría.</p>
          </div>
        `;
        return;
      }

      gridContainer.innerHTML = filtered.map(p => {
        let statusBadgeHTML = '';
        let buttonHTML = '';

        if (p.status === 'disponible') {
          statusBadgeHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>Disponible
          </span>`;
          buttonHTML = `<button data-id="${p.id}" data-action="buy" class="w-full inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wide transition-all duration-200 shadow hover:shadow-md cursor-pointer">
            Comprar Ahora
          </button>`;
        } else if (p.status === 'solicitado') {
          const isOwnRequest = p.buyerId === user.id;
          statusBadgeHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>Solicitado ${isOwnRequest ? '(Tuyo)' : ''}
          </span>`;
          buttonHTML = `<button disabled class="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs tracking-wide cursor-not-allowed border border-slate-200">
            En Proceso de Venta
          </button>`;
        } else if (p.status === 'vendido') {
          statusBadgeHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>Vendido
          </span>`;
          buttonHTML = `<button disabled class="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs tracking-wide cursor-not-allowed border border-slate-200">
            Producto Vendido
          </button>`;
        }

        return `
          <div class="bg-white rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            <!-- Imagen / Icono de Categoría Decorativo -->
            <div class="relative h-44 bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-hidden">
              ${p.imageUrl 
                ? `<img src="${getFullImageUrl(p.imageUrl)}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">` 
                : getCategoryIconSVG(p.category)
              }
              <div class="absolute top-4 left-4">
                ${statusBadgeHTML}
              </div>
              <div class="absolute top-4 right-4">
                <span class="px-2.5 py-0.5 bg-slate-900/10 text-slate-800 rounded-md text-[10px] font-bold uppercase backdrop-blur-sm">
                  ${p.brand}
                </span>
              </div>
            </div>

            <!-- Información del producto -->
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
              <div class="space-y-1.5">
                <span class="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">${p.category}</span>
                <h3 class="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">${p.name}</h3>
                <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">${p.description}</p>
              </div>

              <div class="space-y-3 pt-2">
                <div class="flex items-baseline justify-between">
                  <span class="text-xs font-semibold text-slate-400">Precio de Lista:</span>
                  <span class="text-lg font-extrabold text-slate-950">${formatCurrency(p.price)}</span>
                </div>
                ${buttonHTML}
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    // Renderizar layout principal de controles
    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado de la página -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Catálogo de Productos</h2>
            <p class="text-sm text-slate-500 font-medium">Examina y solicita la compra de electrodomésticos en stock</p>
          </div>
        </div>

        <!-- Controles de búsqueda y filtros -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Categorías Filtro Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none" id="categories-filter-container">
            ${categories.map(cat => `
              <button data-cat="${cat}" class="category-pill shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                currentFilterCategory === cat 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }">
                ${cat === 'All' ? 'Todos' : cat}
              </button>
            `).join('')}
          </div>

          <!-- Input de búsqueda -->
          <div class="relative w-full lg:max-w-xs shrink-0">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input id="catalog-search" type="text" value="${currentSearchQuery}" class="block w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none" placeholder="Buscar electrodoméstico...">
          </div>
        </div>

        <!-- Cuadrícula de Productos -->
        <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      </div>
    `;

    // Renderizado inicial
    filterAndRender();

    // Eventos para pills de categorías
    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentFilterCategory = e.currentTarget.getAttribute('data-cat');
        // Actualizar estados visuales de los botones de categorías
        container.querySelectorAll('.category-pill').forEach(b => {
          const cat = b.getAttribute('data-cat');
          if (cat === currentFilterCategory) {
            b.className = 'category-pill shrink-0 px-4 py-2 rounded-xl text-xs font-bold border bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10 cursor-pointer';
          } else {
            b.className = 'category-pill shrink-0 px-4 py-2 rounded-xl text-xs font-bold border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer';
          }
        });
        filterAndRender();
      });
    });

    // Eventos para el input de búsqueda
    const searchInput = container.querySelector('#catalog-search');
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      filterAndRender();
    });

    // Acción delegada de comprar
    container.querySelector('#catalog-grid').addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action="buy"]');
      if (!btn) return;

      const id = Number(btn.getAttribute('data-id'));
      const product = products.find(p => Number(p.id) === id);

      if (!product) return;

      // Confirmar compra con SweetAlert2
      Swal.fire({
        title: 'Confirmar Solicitud de Compra',
        html: `¿Estás seguro de que deseas comprar el producto <br><strong>${product.name}</strong> por <strong>${formatCurrency(product.price)}</strong>? Enviaremos la solicitud al administrador.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, Solicitar Compra',
        cancelButtonText: 'Cancelar',
        background: '#ffffff',
        customClass: {
          popup: 'rounded-2xl border border-slate-100 shadow-xl'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await apiPatchProduct(product.id, {
              status: 'solicitado',
              buyerId: user.id,
              buyerName: user.name,
              requestedAt: new Date().toISOString()
            });

            showToast('Solicitud de compra enviada con éxito.');
            loadCatalogContent(container);
          } catch (err) {
            showToast('Error al intentar solicitar la compra.', 'error');
            console.error(err);
          }
        }
      });
    });

  } catch (err) {
    showToast('Error al cargar la información del catálogo.', 'error');
    console.error(err);
  }
}

/**
 * Devuelve un icono SVG vistoso según la categoría para mejorar la estética.
 */
function getCategoryIconSVG(category) {
  const normalized = category.toLowerCase();
  
  if (normalized.includes('refrigeraci') || normalized.includes('nevera')) {
    // Icono Nevera / Refrigerador
    return `<svg class="w-16 h-16 text-indigo-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 4h-14a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-12a2 2 0 00-2-2zM3 10h18M9 5v3M9 13v4" />
    </svg>`;
  } else if (normalized.includes('limpieza') || normalized.includes('lavadora') || normalized.includes('aspiradora')) {
    // Icono Lavadora
    return `<svg class="w-16 h-16 text-indigo-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="2" />
      <path d="M7 6h2M15 6h2" />
    </svg>`;
  } else if (normalized.includes('cocina') || normalized.includes('licuadora') || normalized.includes('microondas')) {
    // Icono Olla / Cocina / Horno
    return `<svg class="w-16 h-16 text-indigo-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>`;
  } else if (normalized.includes('climatizaci') || normalized.includes('aire') || normalized.includes('ventilador')) {
    // Icono Viento / Aire
    return `<svg class="w-16 h-16 text-indigo-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20 7H4M20 12H7M20 17H10M4 17a2 2 0 110-4h16M4 12a2 2 0 110-4h16" />
    </svg>`;
  } else {
    // Icono Rayo genérico (Electrodomésticos)
    return `<svg class="w-16 h-16 text-indigo-500 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>`;
  }
}
