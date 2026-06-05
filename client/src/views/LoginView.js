import { apiFetchUserByEmail } from '../services/api.js';
import { setCurrentUser } from '../guards/auth.js';
import { showToast } from '../components/Toast.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-8 space-y-6 animate-fade-in">
      <div class="text-center space-y-2">
        <div class="inline-flex bg-indigo-600/20 p-3 rounded-full text-indigo-400 mb-2">
          <svg class="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <h2 class="text-2xl font-extrabold text-white tracking-tight">Iniciar Sesión</h2>
        <p class="text-slate-400 text-xs font-medium">Accede a la tienda de electrodomésticos</p>
      </div>

      <form id="login-form" class="space-y-4">
        <div>
          <label for="email" class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
          <input id="email" type="email" required class="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="ejemplo@electro.com">
        </div>
        <div>
          <label for="password" class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contraseña</label>
          <input id="password" type="password" required class="block w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="••••••••">
        </div>
        
        <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input id="remember-me" type="checkbox" checked class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer h-4 w-4">
            <span>Recordarme</span>
          </label>
        </div>

        <button type="submit" class="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-900/30 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500">
          Entrar a la Tienda
        </button>
      </form>

      <div class="relative flex py-2 items-center">
        <div class="flex-grow border-t border-slate-700"></div>
        <span class="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">Demostración</span>
        <div class="flex-grow border-t border-slate-700"></div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button id="btn-demo-admin" class="flex flex-col items-center justify-center p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl transition-all duration-200 cursor-pointer">
          <span class="text-xs font-bold text-indigo-400">Administrador</span>
          <span class="text-[9px] text-slate-500 mt-1 font-mono">admin@electro.com</span>
        </button>
        <button id="btn-demo-client" class="flex flex-col items-center justify-center p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl transition-all duration-200 cursor-pointer">
          <span class="text-xs font-bold text-emerald-400">Cliente</span>
          <span class="text-[9px] text-slate-500 mt-1 font-mono">cliente@electro.com</span>
        </button>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const inputEmail = container.querySelector('#email');
  const inputPassword = container.querySelector('#password');
  const checkboxRemember = container.querySelector('#remember-me');

  // Lógica de envío del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputEmail.value.trim();
    const password = inputPassword.value;
    const rememberMe = checkboxRemember.checked;

    try {
      const user = await apiFetchUserByEmail(email);
      if (!user || user.password !== password) {
        showToast('Credenciales incorrectas.', 'error');
        return;
      }

      setCurrentUser(user, rememberMe);
      showToast(`¡Bienvenido de nuevo, ${user.name}!`);
      
      // Redireccionar al dashboard tras login exitoso
      window.location.hash = '/dashboard';
    } catch (err) {
      showToast('Ocurrió un error al intentar iniciar sesión.', 'error');
      console.error(err);
    }
  });

  // Botones de demostración rápida
  container.querySelector('#btn-demo-admin').addEventListener('click', () => {
    inputEmail.value = 'admin@electro.com';
    inputPassword.value = '123456';
  });

  container.querySelector('#btn-demo-client').addEventListener('click', () => {
    inputEmail.value = 'cliente@electro.com';
    inputPassword.value = '123456';
  });
}
