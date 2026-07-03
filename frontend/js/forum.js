document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const actionContainer = document.getElementById('create-post-action-container');
    const searchInput = document.getElementById('forum-search-input');
    const sortSelect = document.getElementById('forum-sort-select');
    
    const loader = document.getElementById('forum-loader');
    const noPostsView = document.getElementById('no-posts-view');
    const postsContainer = document.getElementById('forum-posts-container');
    
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');

    // Modal Elements
    const createPostModal = document.getElementById('create-post-modal');
    const closeBtns = [
        document.getElementById('close-post-modal-btn'),
        document.getElementById('cancel-post-btn')
    ];
    const createPostForm = document.getElementById('create-post-form');

    // State
    let currentPage = 1;
    let limit = 10;
    let queryParams = {
        q: '',
        sort: 'recent'
    };

    // Render Action Button based on Auth
    function setupAuthActions() {
        const token = localStorage.getItem('token');
        if (!token) {
            actionContainer.innerHTML = `
                <a href="login.html" class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none transition">
                    Sign In to Ask
                </a>
            `;
        } else {
            actionContainer.innerHTML = `
                <button id="open-post-modal-btn" class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 focus:outline-none transition">
                    Ask a Question
                </button>
            `;
            
            document.getElementById('open-post-modal-btn').addEventListener('click', () => {
                createPostModal.classList.remove('hidden');
            });
        }
    }

    // Load Posts
    async function loadPosts() {
        loader.classList.remove('hidden');
        postsContainer.innerHTML = '';
        noPostsView.classList.add('hidden');

        try {
            const params = {
                page: currentPage,
                limit: limit,
                ...queryParams
            };
            
            const posts = await api.get('/forum/posts', params);
            
            if (!posts || posts.length === 0) {
                noPostsView.classList.remove('hidden');
                pageInfo.textContent = `Page ${currentPage}`;
                nextPageBtn.disabled = true;
                prevPageBtn.disabled = currentPage === 1;
                return;
            }

            renderPosts(posts);
            
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = posts.length < limit;
            pageInfo.textContent = `Page ${currentPage}`;
        } catch (error) {
            utils.showToast(error.message || 'Failed to load posts', 'error');
        } finally {
            loader.classList.add('hidden');
        }
    }

    // Render Posts
    function renderPosts(posts) {
        postsContainer.innerHTML = '';

        posts.forEach(post => {
            const initials = post.author.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
            
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between';
            card.dataset.id = post.id;

            // Simplified date
            const dateStr = utils.formatDate(post.created_at);

            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            ${initials}
                        </div>
                        <div>
                            <span class="font-semibold text-slate-800">${post.author.full_name}</span>
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${post.author.role === 'alumni' ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'} capitalize ml-1.5">
                                ${post.author.role}
                            </span>
                            <span class="mx-1.5">•</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>

                    <h3 class="text-lg font-bold text-slate-900 mb-2 hover:text-indigo-600 transition">
                        <a href="forum-post.html?id=${post.id}">${post.title}</a>
                    </h3>

                    <p class="text-sm text-slate-600 line-clamp-3 leading-relaxed font-light mb-4 whitespace-pre-line">
                        ${post.body}
                    </p>
                </div>

                <div class="flex items-center gap-4 pt-4 border-t border-slate-100 text-sm font-medium">
                    <!-- Upvote Button -->
                    <button class="upvote-btn flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition px-3 py-1.5 rounded-xl hover:bg-slate-50" data-post-id="${post.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                        <span class="upvote-count">${post.upvotes}</span>
                    </button>

                    <!-- Reply Link -->
                    <a href="forum-post.html?id=${post.id}" class="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition px-3 py-1.5 rounded-xl hover:bg-slate-50">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        <span>${post.replies ? post.replies.length : 0} Replies</span>
                    </a>
                </div>
            `;

            postsContainer.appendChild(card);
        });
    }

    // Modal Closing Handlers
    closeBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                createPostModal.classList.add('hidden');
            });
        }
    });

    const backdrop = createPostModal.querySelector('.fixed.inset-0.bg-slate-900\\/60');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            createPostModal.classList.add('hidden');
        });
    }

    // Create Post submission
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('post-title').value;
            const body = document.getElementById('post-body').value;

            if (!title || !body) {
                utils.showToast('Please fill in all fields', 'error');
                return;
            }

            const submitBtn = createPostForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Publishing...';

            try {
                const response = await api.post('/forum/posts', { title, body });
                if (response) {
                    utils.showToast('Post created successfully!', 'success');
                    createPostModal.classList.add('hidden');
                    createPostForm.reset();
                    currentPage = 1;
                    loadPosts();
                }
            } catch (error) {
                utils.showToast(error.message || 'Failed to create post', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Upvote Toggle Delegation Handler
    if (postsContainer) {
        postsContainer.addEventListener('click', async (e) => {
            const upvoteBtn = e.target.closest('.upvote-btn');
            if (!upvoteBtn) return;

            const postId = upvoteBtn.dataset.postId;
            const token = localStorage.getItem('token');
            if (!token) {
                utils.showToast('Please sign in to upvote posts', 'error');
                return;
            }

            try {
                const result = await api.post('/forum/upvote', {
                    target_type: 'post',
                    target_id: parseInt(postId)
                });
                
                if (result) {
                    const countSpan = upvoteBtn.querySelector('.upvote-count');
                    countSpan.textContent = result.upvotes;
                    
                    if (result.upvoted) {
                        upvoteBtn.classList.add('text-indigo-600', 'bg-indigo-50/50');
                        utils.showToast('Post upvoted!', 'success');
                    } else {
                        upvoteBtn.classList.remove('text-indigo-600', 'bg-indigo-50/50');
                    }
                }
            } catch (error) {
                utils.showToast(error.message || 'Upvote failed', 'error');
            }
        });
    }

    // Search and Sort inputs
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce(() => {
            queryParams.q = searchInput.value;
            currentPage = 1;
            loadPosts();
        }, 300));
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            queryParams.sort = sortSelect.value;
            currentPage = 1;
            loadPosts();
        });
    }

    // Pagination
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadPosts();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            loadPosts();
        });
    }

    // Init
    setupAuthActions();
    loadPosts();
});
