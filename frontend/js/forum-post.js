document.addEventListener('DOMContentLoaded', () => {
    const postId = utils.getUrlParam('id');
    if (!postId) {
        window.location.href = 'forum.html';
        return;
    }

    // DOM Elements
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

    let currentPost = null;

    // Load Post Detail
    async function loadPostDetail() {
        try {
            const post = await api.get(`/forum/posts/${postId}`);
            if (!post) {
                utils.showToast('Post not found', 'error');
                setTimeout(() => { window.location.href = 'forum.html'; }, 2000);
                return;
            }

            currentPost = post;
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

    // Render Post Info
    function renderPost(post) {
        const initials = post.author.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
        postAuthorAvatar.textContent = initials;
        postAuthorName.textContent = post.author.full_name;
        postDate.textContent = utils.formatDate(post.created_at);
        postTitle.textContent = post.title;
        postBody.textContent = post.body;
        postUpvoteCount.textContent = post.upvotes;

        // Author Role Badge Styling
        postAuthorRole.textContent = post.author.role;
        postAuthorRole.className = `inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ml-1.5 ${post.author.role === 'alumni' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`;
    }

    // Render Replies List
    function renderReplies(replies) {
        repliesCount.textContent = replies.length;
        repliesContainer.innerHTML = '';

        if (replies.length === 0) {
            repliesContainer.innerHTML = `
                <div class="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 font-light text-sm">
                    No replies yet. Start the conversation below!
                </div>
            `;
            return;
        }

        replies.forEach(reply => {
            const initials = reply.author.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
            const dateStr = utils.formatDate(reply.created_at);

            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between';
            
            card.innerHTML = `
                <div>
                    <div class="flex items-center gap-3 text-xs text-slate-500 mb-3 border-b border-slate-50 pb-2">
                        <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                            ${initials}
                        </div>
                        <div>
                            <span class="font-semibold text-slate-800">${reply.author.full_name}</span>
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ml-1.5 ${reply.author.role === 'alumni' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}">
                                ${reply.author.role}
                            </span>
                            <span class="mx-1.5">•</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>

                    <p class="text-sm text-slate-600 leading-relaxed font-light whitespace-pre-line mb-3">
                        ${reply.body}
                    </p>
                </div>

                <div class="flex items-center gap-4 pt-2 text-sm font-medium">
                    <!-- Reply Upvote Button -->
                    <button class="reply-upvote-btn flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition px-2.5 py-1 rounded-xl hover:bg-slate-50 border border-slate-100" data-reply-id="${reply.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                        <span class="reply-upvote-count">${reply.upvotes}</span>
                    </button>
                </div>
            `;

            repliesContainer.appendChild(card);
        });
    }

    // Setup Reply Form
    function setupReplyForm() {
        const token = localStorage.getItem('token');
        replyFormSection.innerHTML = '';

        if (!token) {
            replyFormSection.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-sm text-slate-600 mb-3">Sign in to publish a reply to this thread.</p>
                    <a href="login.html" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:outline-none transition">
                        Sign In to Reply
                    </a>
                </div>
            `;
            return;
        }

        replyFormSection.innerHTML = `
            <form id="reply-form" class="space-y-4">
                <div>
                    <label for="reply-body" class="block text-sm font-semibold text-slate-900">Your Reply</label>
                    <textarea id="reply-body" rows="4" required class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 mt-2" placeholder="Write a supportive, detailed comment..."></textarea>
                </div>
                <div class="flex justify-end">
                    <button type="submit" class="inline-flex justify-center items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 focus:outline-none transition">
                        Publish Reply
                    </button>
                </div>
            </form>
        `;

        // Handle Reply Form submit
        const form = document.getElementById('reply-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = document.getElementById('reply-body').value;

            if (!body) {
                utils.showToast('Please type a reply body', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Submitting...';

            try {
                const response = await api.post(`/forum/posts/${postId}/replies`, { body });
                if (response) {
                    utils.showToast('Reply published successfully!', 'success');
                    form.reset();
                    loadPostDetail();
                }
            } catch (error) {
                utils.showToast(error.message || 'Failed to submit reply', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Upvote Handlers
    // 1. Post Upvote
    if (postUpvoteBtn) {
        postUpvoteBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                utils.showToast('Please sign in to upvote', 'error');
                return;
            }

            try {
                const result = await api.post('/forum/upvote', {
                    target_type: 'post',
                    target_id: parseInt(postId)
                });

                if (result) {
                    postUpvoteCount.textContent = result.upvotes;
                    if (result.upvoted) {
                        postUpvoteBtn.classList.add('text-indigo-600', 'bg-indigo-50/50');
                        utils.showToast('Post upvoted!', 'success');
                    } else {
                        postUpvoteBtn.classList.remove('text-indigo-600', 'bg-indigo-50/50');
                    }
                }
            } catch (error) {
                utils.showToast(error.message || 'Upvote failed', 'error');
            }
        });
    }

    // 2. Reply Upvote (using delegation on replies container)
    if (repliesContainer) {
        repliesContainer.addEventListener('click', async (e) => {
            const btn = e.target.closest('.reply-upvote-btn');
            if (!btn) return;

            const replyId = btn.dataset.replyId;
            const token = localStorage.getItem('token');
            if (!token) {
                utils.showToast('Please sign in to upvote replies', 'error');
                return;
            }

            try {
                const result = await api.post('/forum/upvote', {
                    target_type: 'reply',
                    target_id: parseInt(replyId)
                });

                if (result) {
                    const countSpan = btn.querySelector('.reply-upvote-count');
                    countSpan.textContent = result.upvotes;
                    
                    if (result.upvoted) {
                        btn.classList.add('text-indigo-600', 'bg-indigo-50/50');
                        utils.showToast('Reply upvoted!', 'success');
                    } else {
                        btn.classList.remove('text-indigo-600', 'bg-indigo-50/50');
                    }
                }
            } catch (error) {
                utils.showToast(error.message || 'Upvote failed', 'error');
            }
        });
    }

    // Init
    loadPostDetail();
});
