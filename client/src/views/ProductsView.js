import { apiFetchProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct } from '../services/api.js';
import { showToast } from '../components/Toast.js';
import { showModal, showConfirmModal } from '../components/Modal.js';
import { formatCurrency } from '../utils/helpers.js';

/**
 * Renderiza el módulo de administración de productos (inventario).
 */
export async function renderProducts(container) {
  await loadProductsTable(container);
}

async function loadProductsTable(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-[300px]">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  `;

  try {
    const products = await apiFetchProducts();

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Encabezado de la página -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Gestionar Inventario</h2>
            <p class="text-sm text-slate-500 font-medium">Agrega, edita y administra el stock de electrodomésticos de la tienda</p>
          </div>
          <button id="add-product-btn" class="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all duration-200 cursor-pointer gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path></svg>
            <span>Agregar Producto</span>
          </button>
        </div>

        <!-- Tarjeta de la Tabla de Productos -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100">
              <thead>
                <tr class="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th class="px-6 py-4">Electrodoméstico</th>
                  <th class="px-6 py-4">Marca</th>
                  <th class="px-6 py-4">Categoría</th>
                  <th class="px-6 py-4">Precio</th>
                  <th class="px-6 py-4">Estado</th>
                  <th class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                ${products.length === 0 ? `
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center justify-center">
                        <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        <p class="font-semibold text-slate-600 mb-1">No se encontraron productos</p>
                        <p class="text-xs text-slate-500">Comience agregando un nuevo electrodoméstico al catálogo.</p>
                      </div>
                    </td>
                  </tr>
                ` : products.map(p => {
                  let badgeClass = '';
                  let statusText = '';
                  
                  if (p.status === 'disponible') {
                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    statusText = 'Disponible';
                  } else if (p.status === 'solicitado') {
                    badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                    statusText = 'Solicitado';
                  } else if (p.status === 'vendido') {
                    badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                    statusText = 'Vendido';
                  }

                  return `
                    <tr class="hover:bg-slate-50/40 transition-colors">
                      <td class="px-6 py-4">
                        <div class="flex items-center space-x-3">
                          ${p.imageUrl 
                            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-10 h-10 object-cover rounded-lg border border-slate-100 flex-shrink-0">` 
                            : `<div class="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center border border-indigo-100 flex-shrink-0">
                                 <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                               </div>`
                          }
                          <div>
                            <div class="font-bold text-slate-800">${p.name}</div>
                            <div class="text-xs text-slate-400 line-clamp-1 mt-0.5">${p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-semibold">${p.brand}</td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          ${p.category}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-800 font-extrabold">${formatCurrency(p.price)}</td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border ${badgeClass}">
                          <span>${statusText}</span>
                        </span>
                      </td>
                      <td class="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                        <button data-id="${p.id}" data-action="edit" class="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Editar Producto">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button data-id="${p.id}" data-action="delete" class="inline-flex items-center justify-center p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Eliminar Producto">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Evento clic para agregar producto
    container.querySelector('#add-product-btn').addEventListener('click', () => openFormModal(null, container));

    // Manejo delegado de las acciones de la tabla
    container.querySelector('tbody').addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      const product = products.find(p => Number(p.id) === id);

      if (!product) return;

      if (action === 'edit') {
        openFormModal(product, container);
      } else if (action === 'delete') {
        let warningMsg = `¿Está seguro de que desea eliminar el producto <strong>${product.name}</strong>? Esta acción es irreversible.`;
        if (product.status === 'solicitado') {
          warningMsg = `<strong>ATENCIÓN</strong>: Este producto tiene una solicitud de compra pendiente de <strong>${product.buyerName}</strong>.<br><br>` + warningMsg;
        } else if (product.status === 'vendido') {
          warningMsg = `<strong>ATENCIÓN</strong>: Este producto ya ha sido vendido a <strong>${product.buyerName}</strong>. Eliminarlo borrará el historial de ventas del panel.<br><br>` + warningMsg;
        }

        showConfirmModal({
          title: 'Eliminar Producto del Sistema',
          message: warningMsg,
          confirmText: 'Eliminar Registro',
          onConfirm: async (modalEl, closeFn) => {
            try {
              await apiDeleteProduct(product.id);
              showToast('Producto eliminado correctamente.');
              closeFn();
              loadProductsTable(container);
            } catch (err) {
              showToast('Error al intentar eliminar el producto.', 'error');
            }
          }
        });
      }
    });

  } catch (err) {
    showToast('Error al cargar la lista de productos.', 'error');
    console.error(err);
  }
}

function openFormModal(product = null, container) {
  const isEdit = !!product;
  const title = isEdit ? 'Editar Electrodoméstico' : 'Agregar Electrodoméstico';

  const bodyHTML = `
    <form id="product-form" class="space-y-4">
      <div>
        <label for="p-name" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Electrodoméstico</label>
        <input id="p-name" type="text" required class="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. Refrigerador Smart Side by Side" value="${isEdit ? product.name : ''}">
      </div>

      <div>
        <label for="p-image" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL de la Imagen</label>
        <input id="p-image" type="text" class="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. /images/refrigerator.png o URL externa" value="${isEdit && product.imageUrl ? product.imageUrl : ''}">
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="p-brand" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Marca</label>
          <input id="p-brand" type="text" required class="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. LG, Samsung" value="${isEdit ? product.brand : ''}">
        </div>
        <div>
          <label for="p-category" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoría</label>
          <select id="p-category" required class="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none">
            <option value="Refrigeración" ${isEdit && product.category === 'Refrigeración' ? 'selected' : ''}>Refrigeración</option>
            <option value="Limpieza" ${isEdit && product.category === 'Limpieza' ? 'selected' : ''}>Limpieza</option>
            <option value="Cocina" ${isEdit && product.category === 'Cocina' ? 'selected' : ''}>Cocina</option>
            <option value="Climatización" ${isEdit && product.category === 'Climatización' ? 'selected' : ''}>Climatización</option>
            <option value="Tecnología" ${isEdit && product.category === 'Tecnología' ? 'selected' : ''}>Tecnología</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="p-price" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Precio de Lista ($)</label>
          <input id="p-price" type="number" step="0.01" min="0.01" required class="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="e.g. 599.99" value="${isEdit ? product.price : ''}">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado</label>
          <select id="p-status" required class="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none">
            <option value="disponible" ${isEdit && product.status === 'disponible' ? 'selected' : ''}>Disponible</option>
            <option value="solicitado" ${isEdit && product.status === 'solicitado' ? 'selected' : ''}>Solicitado</option>
            <option value="vendido" ${isEdit && product.status === 'vendido' ? 'selected' : ''}>Vendido</option>
          </select>
        </div>
      </div>

      <div>
        <label for="p-desc" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción del Producto</label>
        <textarea id="p-desc" required rows="3" class="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none" placeholder="Características detalladas, tamaño, funciones, etc.">${isEdit ? product.description : ''}</textarea>
      </div>

      ${isEdit && product.buyerId ? `
        <div class="p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
          <div class="font-bold text-slate-700">Información del Comprador:</div>
          <div class="text-slate-600 mt-1">Nombre: ${product.buyerName} (ID: ${product.buyerId})</div>
          ${product.requestedAt ? `<div class="text-slate-400 mt-0.5">Solicitado el: ${new Date(product.requestedAt).toLocaleString()}</div>` : ''}
          ${product.soldAt ? `<div class="text-slate-400 mt-0.5">Vendido el: ${new Date(product.soldAt).toLocaleString()}</div>` : ''}
        </div>
      ` : ''}
    </form>
  `;

  showModal({
    title,
    bodyHTML,
    confirmText: isEdit ? 'Actualizar' : 'Crear',
    onConfirm: async (modalEl, closeFn) => {
      const name = modalEl.querySelector('#p-name').value.trim();
      const brand = modalEl.querySelector('#p-brand').value.trim();
      const category = modalEl.querySelector('#p-category').value;
      const price = Number(modalEl.querySelector('#p-price').value);
      const status = modalEl.querySelector('#p-status').value;
      const description = modalEl.querySelector('#p-desc').value.trim();
      const imageUrl = modalEl.querySelector('#p-image').value.trim();

      if (!name || !brand || !price || !description) {
        showToast('Complete todos los campos del formulario.', 'warning');
        return;
      }

      // Estructura de actualización base
      const productData = { 
        name, 
        brand, 
        category, 
        price, 
        status, 
        description,
        imageUrl: imageUrl || null
      };

      // Si se crea o se vuelve disponible, limpiar comprador
      if (status === 'disponible') {
        productData.buyerId = null;
        productData.buyerName = null;
        productData.requestedAt = null;
        productData.soldAt = null;
      } else if (isEdit && status === 'vendido' && product.status !== 'vendido') {
        productData.soldAt = new Date().toISOString();
      }

      try {
        if (isEdit) {
          // Fusionar campos antiguos para no pisar buyerName/buyerId si ya existen
          const updatedProduct = { ...product, ...productData };
          await apiUpdateProduct(product.id, updatedProduct);
          showToast('Electrodoméstico actualizado.');
        } else {
          // Nuevo producto por defecto inicia limpio
          productData.buyerId = null;
          productData.buyerName = null;
          productData.requestedAt = null;
          productData.soldAt = null;
          await apiCreateProduct(productData);
          showToast('Electrodoméstico creado con éxito.');
        }
        
        closeFn();
        loadProductsTable(container);
      } catch (err) {
        showToast('Error al guardar el producto.', 'error');
      }
    }
  });
}
