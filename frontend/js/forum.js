document.addEventListener('DOMContentLoaded', () => {
    const actionContainer = document.getElementById('create-post-action-container');
    const searchInput = document.getElementById('forum-search-input');
    const sortSelect = document.getElementById('forum-sort-select');
    const loader = document.getElementById('forum-loader');
    const noPostsView = document.getElementById('no-posts-view');
    const postsContainer = document.getElementById('forum-posts-container');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');
    const createPostModal = document.getElementById('create-post-modal');
    const createPostForm = document.getElementById('create-post-form');
    const titleInput = document.getElementById('post-title');
    const bodyInput = document.getElementById('post-body');
    const previewTitle = document.getElementById('post-preview-title');
    const previewBody = document.getElementById('post-preview-body');

    let currentPage = 1;
    const limit = 10;
    const queryParams = { q: '', sort: 'recent' };

    function setupAuthActions() {
        const token = localStorage.getItem('token');
        actionContainer.innerHTML = token ? `
            <button id="open-post-modal-btn" class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition">Ask a Question</button>
        ` : `
            <a href="login.html" class="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition">Sign In to Ask</a>
        `;
        document.getElementById('open-post-modal-btn')?.addEventListener('click', () => {
            createPostModal.classList.remove('hidden');
            titleInput.focus();
            updatePreview();
        });
    }

    function updatePreview() {
        previewTitle.textContent = titleInput.value || 'Untitled question';
        previewBody.innerHTML = bodyInput.value ? utils.renderRichText(bodyInput.value) : 'Your formatted question preview will appear here.';
    }

    function insertFormat(kind) {
        const start = bodyInput.selectionStart;
        const end = bodyInput.selectionEnd;
        const selected = bodyInput.value.slice(start, end) || 'text';
        const formats = {
            bold: `**${selected}**`,
            italic: `*${selected}*`,
            heading: `## ${selected}`,
            list: `- ${selected}`,
            code: `\`\`\`\n${selected}\n\`\`\``
        };
        const value = formats[kind] || selected;
        bodyInput.setRangeText(value, start, end, 'end');
        bodyInput.focus();
        updatePreview();
    }

    async function loadPosts() {
        loader.classList.remove('hidden');
        postsContainer.innerHTML = '';
        noPostsView.classList.add('hidden');
        try {
            const posts = await api.get('/forum/posts', { page: currentPage, limit, ...queryParams });
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

    function renderPosts(posts) {
        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const initials = post.author.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between';
            card.dataset.id = post.id;
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <a href="profile.html?id=${post.author.id}" class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">${utils.escapeHtml(initials)}</a>
                        <div>
                            <a href="profile.html?id=${post.author.id}" class="font-semibold text-slate-800 hover:text-indigo-600">${utils.escapeHtml(post.author.full_name)}</a>
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${post.author.role === 'alumni' ? 'bg-indigo-50 text-indigo-700' : post.author.role === 'admin' ? 'bg-rose-50 text-rose-700' : 'bg-green-50 text-green-700'} capitalize ml-1.5">${post.author.role}</span>
                            <span class="mx-1.5">•</span><span>${utils.formatDate(post.created_at)}</span>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 mb-2 hover:text-indigo-600 transition"><a href="forum-post.html?id=${post.id}">${utils.escapeHtml(post.title)}</a></h3>
                    <div class="rich-body text-sm text-slate-600 line-clamp-3 leading-relaxed font-light mb-4">${utils.renderRichText(post.body)}</div>
                </div>
                <div class="flex items-center gap-4 pt-4 border-t border-slate-100 text-sm font-medium">
                    <button class="upvote-btn flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition px-3 py-1.5 rounded-xl hover:bg-slate-50" data-post-id="${post.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                        <span class="upvote-count">${post.upvotes}</span>
                    </button>
                    <a href="forum-post.html?id=${post.id}" class="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition px-3 py-1.5 rounded-xl hover:bg-slate-50">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        <span>${post.replies ? post.replies.length : 0} Replies</span>
                    </a>
                </div>`;
            postsContainer.appendChild(card);
        });
    }

    document.getElementById('cancel-post-btn')?.addEventListener('click', () => createPostModal.classList.add('hidden'));
    document.querySelectorAll('.editor-toolbar button').forEach(button => button.addEventListener('click', () => insertFormat(button.dataset.format)));
    titleInput?.addEventListener('input', updatePreview);
    bodyInput?.addEventListener('input', updatePreview);

    createPostForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        if (!title || !body) {
            utils.showToast('Please fill in all fields', 'error');
            return;
        }
        const submitBtn = createPostForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing...';
        try {
            await api.post('/forum/posts', { title, body });
            utils.showToast('Post created successfully!', 'success');
            createPostModal.classList.add('hidden');
            createPostForm.reset();
            updatePreview();
            currentPage = 1;
            loadPosts();
        } catch (error) {
            utils.showToast(error.message || 'Failed to create post', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    postsContainer?.addEventListener('click', async (e) => {
        const upvoteBtn = e.target.closest('.upvote-btn');
        if (!upvoteBtn) return;
        if (!localStorage.getItem('token')) {
            utils.showToast('Please sign in to upvote posts', 'error');
            return;
        }
        try {
            const result = await api.post('/forum/upvote', { target_type: 'post', target_id: parseInt(upvoteBtn.dataset.postId) });
            upvoteBtn.querySelector('.upvote-count').textContent = result.upvotes;
            upvoteBtn.classList.toggle('text-indigo-600', result.upvoted);
            upvoteBtn.classList.toggle('bg-indigo-50/50', result.upvoted);
        } catch (error) {
            utils.showToast(error.message || 'Upvote failed', 'error');
        }
    });

    searchInput?.addEventListener('input', utils.debounce(() => { queryParams.q = searchInput.value; currentPage = 1; loadPosts(); }, 300));
    sortSelect?.addEventListener('change', () => { queryParams.sort = sortSelect.value; currentPage = 1; loadPosts(); });
    prevPageBtn?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadPosts(); } });
    nextPageBtn?.addEventListener('click', () => { currentPage++; loadPosts(); });

    setupAuthActions();
    loadPosts();
});
