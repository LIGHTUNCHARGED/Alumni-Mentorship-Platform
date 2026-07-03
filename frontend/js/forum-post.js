document.addEventListener('DOMContentLoaded', () => {
    const postId = utils.getUrlParam('id');
    if (!postId) {
        window.location.href = 'forum.html';
        return;
    }

    const threadLoader = document.getElementById('thread-loader');
    const postCard = document.getElementById('forum-post-detail-card');
    const postAuthorAvatar = document.getElementById('post-author-avatar');
    const postAuthorName = document.getElementById('post-author-name');
    const postAuthorRole = document.getElementById('post-author-role');
    const postDate = document.getElementById('post-date');
    const postTitle = document.getElementById('post-title');
    const postBody = document.getElementById('post-body');
    const postUpvoteBtn = document.getElementById('post-upvote-btn');
    const postUpvoteCount = document.getElementById('post-upvote-count');
    const repliesCount = document.getElementById('replies-count');
    const repliesContainer = document.getElementById('replies-container');
    const replyFormSection = document.getElementById('reply-form-section');

    let activeReplyParent = null;

    async function loadPostDetail() {
        try {
            const post = await api.get(`/forum/posts/${postId}`);
            renderPost(post);
            renderReplies(post.replies || []);
            setupReplyForm();
        } catch (error) {
            utils.showToast(error.message || 'Failed to load thread details', 'error');
        } finally {
            threadLoader.classList.add('hidden');
            postCard.classList.remove('hidden');
        }
    }

    function flattenReplies(replies) {
        return replies.reduce((all, reply) => all.concat(reply, flattenReplies(reply.children || [])), []);
    }

    function renderPost(post) {
        const initials = post.author.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
        postAuthorAvatar.textContent = initials;
        postAuthorName.innerHTML = `<a href="profile.html?id=${post.author.id}" class="hover:text-indigo-600">${utils.escapeHtml(post.author.full_name)}</a>`;
        postDate.textContent = utils.formatDate(post.created_at);
        postTitle.textContent = post.title;
        postBody.classList.add('rich-body');
        postBody.innerHTML = utils.renderRichText(post.body);
        postUpvoteCount.textContent = post.upvotes;
        postAuthorRole.textContent = post.author.role;
        postAuthorRole.className = `inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ml-1.5 ${post.author.role === 'alumni' ? 'bg-indigo-100 text-indigo-800' : post.author.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-green-100 text-green-800'}`;

        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const adminActions = document.getElementById('post-admin-actions');
        adminActions.innerHTML = '';
        if (user && (user.id === post.author_id || user.role === 'admin')) {
            adminActions.innerHTML = `<button id="delete-post-btn" class="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition">Delete Topic</button>`;
            document.getElementById('delete-post-btn').addEventListener('click', async () => {
                if (!confirm('Delete this topic?')) return;
                try {
                    await api.delete(user.role === 'admin' ? `/admin/posts/${post.id}` : `/forum/posts/${post.id}`);
                    utils.showToast('Topic deleted successfully!', 'success');
                    setTimeout(() => { window.location.href = 'forum.html'; }, 700);
                } catch (err) {
                    utils.showToast(err.message || 'Failed to delete topic', 'error');
                }
            });
        }
    }

    function renderReplies(replies) {
        repliesCount.textContent = flattenReplies(replies).length;
        repliesContainer.innerHTML = replies.length ? replies.map(reply => renderReply(reply, 0)).join('') : `
            <div class="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 font-light text-sm">No replies yet. Start the conversation below!</div>
        `;
    }

    function renderReply(reply, depth) {
        const initials = reply.author.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
        const nested = (reply.children || []).map(child => renderReply(child, depth + 1)).join('');
        const maxDepth = Math.min(depth, 5);
        return `
            <article class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm" style="margin-left:${maxDepth * 1.25}rem" data-reply-id="${reply.id}">
                <div class="flex items-center gap-3 text-xs text-slate-500 mb-3 border-b border-slate-50 pb-2">
                    <a href="profile.html?id=${reply.author.id}" class="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">${utils.escapeHtml(initials)}</a>
                    <div>
                        <a href="profile.html?id=${reply.author.id}" class="font-semibold text-slate-800 hover:text-indigo-600">${utils.escapeHtml(reply.author.full_name)}</a>
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ml-1.5 ${reply.author.role === 'alumni' ? 'bg-indigo-100 text-indigo-800' : reply.author.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-green-100 text-green-800'}">${reply.author.role}</span>
                        <span class="mx-1.5">•</span><span>${utils.formatDate(reply.created_at)}</span>
                    </div>
                </div>
                <div class="rich-body text-sm text-slate-600 leading-relaxed font-light mb-3">${utils.renderRichText(reply.body)}</div>
                <div class="flex items-center gap-3 pt-2 text-sm font-medium">
                    <button class="reply-upvote-btn flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition px-2.5 py-1 rounded-xl hover:bg-slate-50 border border-slate-100" data-reply-id="${reply.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                        <span class="reply-upvote-count">${reply.upvotes}</span>
                    </button>
                    ${localStorage.getItem('token') ? `<button class="reply-to-btn text-slate-500 hover:text-indigo-600" data-reply-id="${reply.id}" data-name="${utils.escapeHtml(reply.author.full_name)}">Reply</button>` : ''}
                </div>
            </article>
            ${nested}`;
    }

    function setupReplyForm() {
        const token = localStorage.getItem('token');
        if (!token) {
            replyFormSection.innerHTML = `<div class="text-center py-4"><p class="text-sm text-slate-600 mb-3">Sign in to publish a reply to this thread.</p><a href="login.html" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition">Sign In to Reply</a></div>`;
            return;
        }
        replyFormSection.innerHTML = `
            <form id="reply-form" class="space-y-4">
                <div id="reply-parent-note" class="hidden rounded-xl bg-indigo-50 text-indigo-700 px-3 py-2 text-sm"></div>
                <div>
                    <label for="reply-body" class="block text-sm font-semibold text-slate-900">Your Reply</label>
                    <textarea id="reply-body" rows="4" required class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 mt-2" placeholder="Write a supportive, detailed comment..."></textarea>
                </div>
                <div class="flex justify-between gap-3">
                    <button type="button" id="clear-reply-parent" class="hidden text-sm font-semibold text-slate-500">Reply to thread instead</button>
                    <button type="submit" class="ml-auto inline-flex justify-center items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition">Publish Reply</button>
                </div>
            </form>`;

        document.getElementById('clear-reply-parent').addEventListener('click', () => setReplyParent(null));
        document.getElementById('reply-form').addEventListener('submit', submitReply);
    }

    function setReplyParent(replyId, name = '') {
        activeReplyParent = replyId;
        const note = document.getElementById('reply-parent-note');
        const clear = document.getElementById('clear-reply-parent');
        if (!note || !clear) return;
        note.classList.toggle('hidden', !replyId);
        clear.classList.toggle('hidden', !replyId);
        if (replyId) {
            note.textContent = `Replying to ${name}`;
            document.getElementById('reply-body').focus();
        }
    }

    async function submitReply(e) {
        e.preventDefault();
        const body = document.getElementById('reply-body').value.trim();
        if (!body) {
            utils.showToast('Please type a reply body', 'error');
            return;
        }
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        try {
            await api.post(`/forum/posts/${postId}/replies`, { body, parent_id: activeReplyParent });
            utils.showToast('Reply published successfully!', 'success');
            e.target.reset();
            activeReplyParent = null;
            loadPostDetail();
        } catch (error) {
            utils.showToast(error.message || 'Failed to submit reply', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publish Reply';
        }
    }

    postUpvoteBtn?.addEventListener('click', async () => {
        if (!localStorage.getItem('token')) {
            utils.showToast('Please sign in to upvote', 'error');
            return;
        }
        try {
            const result = await api.post('/forum/upvote', { target_type: 'post', target_id: parseInt(postId) });
            postUpvoteCount.textContent = result.upvotes;
            postUpvoteBtn.classList.toggle('text-indigo-600', result.upvoted);
            postUpvoteBtn.classList.toggle('bg-indigo-50/50', result.upvoted);
        } catch (error) {
            utils.showToast(error.message || 'Upvote failed', 'error');
        }
    });

    repliesContainer?.addEventListener('click', async (e) => {
        const replyTo = e.target.closest('.reply-to-btn');
        if (replyTo) {
            setReplyParent(parseInt(replyTo.dataset.replyId), replyTo.dataset.name);
            return;
        }

        const btn = e.target.closest('.reply-upvote-btn');
        if (!btn) return;
        if (!localStorage.getItem('token')) {
            utils.showToast('Please sign in to upvote replies', 'error');
            return;
        }
        try {
            const result = await api.post('/forum/upvote', { target_type: 'reply', target_id: parseInt(btn.dataset.replyId) });
            btn.querySelector('.reply-upvote-count').textContent = result.upvotes;
            btn.classList.toggle('text-indigo-600', result.upvoted);
            btn.classList.toggle('bg-indigo-50/50', result.upvoted);
        } catch (error) {
            utils.showToast(error.message || 'Upvote failed', 'error');
        }
    });

    loadPostDetail();
});
