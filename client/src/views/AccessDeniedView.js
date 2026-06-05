import { getCurrentUser } from '../guards/auth.js';

export function renderAccessDenied(container) {
  const user = getCurrentUser();
  const targetRedirect = user ? '/dashboard' : '/login';

  container.innerHTML = `
    <div class="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-8 text-center space-y-6 animate-fade-in">
      <div class="inline-flex bg-rose-600/20 p-4 rounded-full text-rose-500 mb-2">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      </div>
      
      <div class="space-y-2">
        <h2 class="text-2xl font-extrabold text-white tracking-tight">Acceso Denegado</h2>
        <p class="text-slate-400 text-sm font-medium px-4">
          No tienes privilegios suficientes para ingresar a este panel de administración.
        </p>
      </div>

      <div class="pt-2">
        <a href="#${targetRedirect}" class="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-900/30 transition-all duration-200">
          Volver a un lugar seguro
        </a>
      </div>
    </div>
  `;
}
