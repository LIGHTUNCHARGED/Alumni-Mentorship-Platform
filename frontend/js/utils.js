const utils = {
    // Show toast notification
    showToast(message, type = 'success') {
        // Remove existing toasts first
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast-notification fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg transition-opacity duration-300 transform translate-y-0 text-white font-medium flex items-center gap-2`;
        
        if (type === 'success') {
            toast.classList.add('bg-emerald-600');
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${message}`;
        } else if (type === 'error') {
            toast.classList.add('bg-rose-600');
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> ${message}`;
        } else {
            toast.classList.add('bg-indigo-600');
            toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${message}`;
        }

        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Debounce function to limit rapid calls (e.g. search typing)
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

    // Format date string
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

    // Get query param from URL
    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    // Render shared header navbar dynamically
    renderNavbar() {
        const container = document.getElementById('navbar-container');
        if (!container) return;

        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;

        let navContent = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <a href="index.html" class="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                AlumniConnect
                            </a>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <a href="mentors.html" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Find Mentors
                            </a>
                            <a href="forum.html" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Discussion Forum
                            </a>
                            ${token ? `
                            <a href="dashboard.html" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Dashboard
                            </a>
                            ` : ''}
                        </div>
                    </div>
                    <div class="hidden sm:ml-6 sm:flex sm:items-center gap-4">
        `;

        if (token && user) {
            navContent += `
                <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-700">Hello, <span class="font-semibold text-gray-900">${user.full_name}</span></span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'alumni' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'} capitalize">
                        ${user.role}
                    </span>
                    <button id="logout-btn" class="ml-4 inline-flex items-center px-3.5 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
                        Logout
                    </button>
                </div>
            `;
        } else {
            navContent += `
                <a href="login.html" class="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-2 rounded-md">
                    Sign In
                </a>
                <a href="register.html" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
                    Register
                </a>
            `;
        }

        navContent += `
                    </div>
                    
                    <!-- Mobile menu button -->
                    <div class="flex items-center sm:hidden">
                        <button id="mobile-menu-toggle" type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500" aria-expanded="false">
                            <span class="sr-only">Open main menu</span>
                            <svg class="h-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Mobile menu, show/hide based on menu state. -->
            <div class="sm:hidden hidden" id="mobile-menu">
                <div class="pt-2 pb-3 space-y-1">
                    <a href="mentors.html" class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">Find Mentors</a>
                    <a href="forum.html" class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">Discussion Forum</a>
                    ${token ? `<a href="dashboard.html" class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">Dashboard</a>` : ''}
                </div>
                <div class="pt-4 pb-3 border-t border-gray-200">
        `;

        if (token && user) {
            navContent += `
                <div class="flex items-center px-4">
                    <div class="flex-shrink-0">
                        <div class="h-10 w-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg">
                            ${user.full_name.charAt(0)}
                        </div>
                    </div>
                    <div class="ml-3">
                        <div class="text-base font-medium text-gray-800">${user.full_name}</div>
                        <div class="text-sm font-medium text-gray-500">${user.email}</div>
                    </div>
                </div>
                <div class="mt-3 space-y-1">
                    <button id="logout-btn-mobile" class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                        Sign out
                    </button>
                </div>
            `;
        } else {
            navContent += `
                <div class="mt-3 space-y-1">
                    <a href="login.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">Sign In</a>
                    <a href="register.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800">Register</a>
                </div>
            `;
        }

        navContent += `
                </div>
            </div>
        `;

        container.innerHTML = navContent;

        // Highlight active link
        const currentPath = window.location.pathname;
        const links = container.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href)) {
                link.classList.remove('border-transparent', 'text-gray-500');
                link.classList.add('border-indigo-500', 'text-gray-900');
            }
        });

        // Set up logout button
        const logoutBtn = document.getElementById('logout-btn');
        const logoutBtnMobile = document.getElementById('logout-btn-mobile');
        const logoutHandler = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            utils.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        };
        if (logoutBtn) logoutBtn.addEventListener('click', logoutHandler);
        if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', logoutHandler);

        // Mobile menu toggle
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (toggleBtn && mobileMenu) {
            toggleBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
};

// Auto-run renderNavbar when script is loaded if navbar container is present
document.addEventListener('DOMContentLoaded', () => {
    utils.renderNavbar();
});
