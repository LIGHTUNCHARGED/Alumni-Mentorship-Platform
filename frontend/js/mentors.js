document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const domainSelect = document.getElementById('domain-select');
    const expInput = document.getElementById('exp-input');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    const loader = document.getElementById('mentor-loader');
    const noMentorsView = document.getElementById('no-mentors-view');
    const cardsContainer = document.getElementById('mentor-cards-container');
    
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');

    // State Variables
    let currentPage = 1;
    let limit = 10;
    let queryParams = {
        q: '',
        domain: '',
        min_exp: ''
    };

    // Load Mentors
    async function loadMentors() {
        loader.classList.remove('hidden');
        cardsContainer.innerHTML = '';
        noMentorsView.classList.add('hidden');
        
        try {
            const params = {
                page: currentPage,
                limit: limit,
                ...queryParams
            };
            
            const mentors = await api.get('/mentors', params);
            
            if (!mentors || mentors.length === 0) {
                noMentorsView.classList.remove('hidden');
                pageInfo.textContent = `Page ${currentPage} of ${currentPage}`;
                nextPageBtn.disabled = true;
                prevPageBtn.disabled = currentPage === 1;
                return;
            }

            renderMentors(mentors);
            
            // Simplified pagination checking (since SQLite counts aren't in this simple REST response directly)
            // If we receive less than the limit, we know it's the last page.
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = mentors.length < limit;
            pageInfo.textContent = `Page ${currentPage}`;
            
        } catch (error) {
            utils.showToast(error.message || 'Failed to fetch mentors', 'error');
        } finally {
            loader.classList.add('hidden');
        }
    }

    // Render Cards
    function renderMentors(mentors) {
        cardsContainer.innerHTML = '';
        
        mentors.forEach(mentor => {
            const initials = mentor.user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
            
            // Parse tags
            let tagsHtml = '';
            if (mentor.tags) {
                const tagsList = mentor.tags.split(',').map(t => t.trim());
                tagsHtml = tagsList.slice(0, 3).map(tag => 
                    `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">${tag}</span>`
                ).join(' ');
                
                if (tagsList.length > 3) {
                    tagsHtml += ` <span class="text-xs text-slate-400 font-medium">+${tagsList.length - 3} more</span>`;
                }
            }

            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between';
            
            card.innerHTML = `
                <div>
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-lg">
                                ${initials}
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-900">${mentor.user.full_name}</h3>
                                <p class="text-xs text-slate-500 font-medium">${mentor.domain}</p>
                            </div>
                        </div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ${mentor.years_experience} yrs exp
                        </span>
                    </div>

                    <p class="text-sm text-slate-600 mt-4 line-clamp-3 leading-relaxed font-light">
                        ${mentor.bio}
                    </p>

                    <div class="flex flex-wrap gap-1.5 mt-4">
                        ${tagsHtml}
                    </div>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div class="text-xs text-slate-500">
                        <span class="font-semibold text-slate-700">Available:</span> ${mentor.availability || 'Upon Request'}
                    </div>
                    <a href="mentor-detail.html?id=${mentor.user_id}" class="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition flex items-center gap-1">
                        View Profile 
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </a>
                </div>
            `;
            
            cardsContainer.appendChild(card);
        });
    }

    // Event Listeners for Filters
    const debouncedSearch = utils.debounce(() => {
        queryParams.q = searchInput.value;
        currentPage = 1;
        loadMentors();
    }, 300);

    const debouncedExp = utils.debounce(() => {
        queryParams.min_exp = expInput.value;
        currentPage = 1;
        loadMentors();
    }, 300);

    if (searchInput) searchInput.addEventListener('input', debouncedSearch);
    if (expInput) expInput.addEventListener('input', debouncedExp);
    
    if (domainSelect) {
        domainSelect.addEventListener('change', () => {
            queryParams.domain = domainSelect.value;
            currentPage = 1;
            loadMentors();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            domainSelect.value = '';
            expInput.value = '';
            
            queryParams = { q: '', domain: '', min_exp: '' };
            currentPage = 1;
            loadMentors();
        });
    }

    // Pagination Listeners
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadMentors();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            loadMentors();
        });
    }

    // Initial load
    loadMentors();
});
