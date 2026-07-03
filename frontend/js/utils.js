const utils = {
    escapeHtml(value = '') {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    },

    renderRichText(value = '') {
        return this.escapeHtml(value)
            .replace(/```([\s\S]*?)```/g, '<pre class="rich-code"><code>$1</code></pre>')
            .replace(/^### (.*)$/gm, '<h3>$1</h3>')
            .replace(/^## (.*)$/gm, '<h2>$1</h2>')
            .replace(/^# (.*)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\n/g, '<br>');
    },

    ensureStylesheet() {
        if (!document.querySelector('link[href="css/styles.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/styles.css';
            document.head.appendChild(link);
        }
    },

    applyTheme(theme = localStorage.getItem('theme') || 'light') {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('theme', theme);
    },

    toggleTheme() {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
    },

    showToast(message, type = 'success') {
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'toast-notification fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg transition-opacity duration-300 transform translate-y-0 text-white font-medium flex items-center gap-2';

        if (type === 'success') {
            toast.classList.add('bg-emerald-600');
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${this.escapeHtml(message)}`;
        } else if (type === 'error') {
            toast.classList.add('bg-rose-600');
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> ${this.escapeHtml(message)}`;
        } else {
            toast.classList.add('bg-indigo-600');
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${this.escapeHtml(message)}`;
        }

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getUrlParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    },

    renderNavbar() {
        this.ensureStylesheet();
        this.applyTheme();

        const container = document.getElementById('navbar-container');
        if (!container) return;

        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        const theme = document.documentElement.dataset.theme || 'light';
        const roleClass = user?.role === 'admin' ? 'bg-rose-100 text-rose-800' : user?.role === 'alumni' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800';

        container.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <a href="index.html" class="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AlumniConnect</a>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <a href="mentors.html" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Find Mentors</a>
                            <a href="forum.html" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Discussion Forum</a>
                            ${token ? `<a href="dashboard.html" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Dashboard</a>` : ''}
                            ${user?.role === 'admin' ? `<a href="admin.html" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Admin</a>` : ''}
                        </div>
                    </div>
                    <div class="hidden sm:ml-6 sm:flex sm:items-center gap-4">
                        <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle dark mode">${theme === 'dark' ? 'Light' : 'Dark'}</button>
                        ${token && user ? `
                            <div class="flex items-center gap-3">
                                <a href="profile.html?id=${user.id}" class="text-sm text-gray-700 hover:text-indigo-600">Hello, <span class="font-semibold text-gray-900">${this.escapeHtml(user.full_name)}</span></a>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleClass} capitalize">${user.role}</span>
                                <button id="logout-btn" class="ml-2 inline-flex items-center px-3.5 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition">Logout</button>
                            </div>` : `
                            <a href="login.html" class="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-2 rounded-md">Sign In</a>
                            <a href="register.html" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition">Register</a>`}
                    </div>
                    <div class="flex items-center sm:hidden">
                        <button id="mobile-menu-toggle" type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100" aria-expanded="false">
                            <span class="sr-only">Open main menu</span>
                            <svg class="h-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="sm:hidden hidden" id="mobile-menu">
                <div class="pt-2 pb-3 space-y-1">
                    <a href="mentors.html" class="block px-4 py-2 text-base font-medium text-gray-500">Find Mentors</a>
                    <a href="forum.html" class="block px-4 py-2 text-base font-medium text-gray-500">Discussion Forum</a>
                    ${token ? `<a href="dashboard.html" class="block px-4 py-2 text-base font-medium text-gray-500">Dashboard</a>` : ''}
                    ${user?.role === 'admin' ? `<a href="admin.html" class="block px-4 py-2 text-base font-medium text-gray-500">Admin</a>` : ''}
                    ${token && user ? `<a href="profile.html?id=${user.id}" class="block px-4 py-2 text-base font-medium text-gray-500">Profile</a>` : ''}
                    <button id="theme-toggle-mobile" class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500">${theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
                </div>
                <div class="pt-4 pb-3 border-t border-gray-200">
                    ${token && user ? `<button id="logout-btn-mobile" class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500">Sign out</button>` : `<a href="login.html" class="block px-4 py-2 text-base font-medium text-gray-500">Sign In</a><a href="register.html" class="block px-4 py-2 text-base font-medium text-gray-500">Register</a>`}
                </div>
            </div>`;

        const currentPath = window.location.pathname;
        container.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href.split('?')[0])) {
                link.classList.remove('border-transparent', 'text-gray-500');
                link.classList.add('border-indigo-500', 'text-gray-900');
            }
        });

        const logoutHandler = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            utils.showToast('Logged out successfully', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 500);
        };
        document.getElementById('logout-btn')?.addEventListener('click', logoutHandler);
        document.getElementById('logout-btn-mobile')?.addEventListener('click', logoutHandler);
        document.getElementById('theme-toggle')?.addEventListener('click', () => { utils.toggleTheme(); utils.renderNavbar(); });
        document.getElementById('theme-toggle-mobile')?.addEventListener('click', () => { utils.toggleTheme(); utils.renderNavbar(); });
        document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.toggle('hidden'));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    utils.renderNavbar();
});
