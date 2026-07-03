document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const denied = document.getElementById('admin-denied');
    const content = document.getElementById('admin-content');
    const stats = document.getElementById('admin-stats');

    if (!user || user.role !== 'admin') {
        denied.classList.remove('hidden');
        return;
    }

    content.classList.remove('hidden');

    async function loadAdmin() {
        try {
            const [statData, users, posts, replies, bookings] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/posts'),
                api.get('/admin/replies'),
                api.get('/admin/bookings')
            ]);
            renderStats(statData);
            renderUsers(users || []);
            renderPosts(posts || []);
            renderReplies(replies || []);
            renderBookings(bookings || []);
        } catch (error) {
            utils.showToast(error.message || 'Failed to load admin panel', 'error');
        }
    }

    function renderStats(data) {
        stats.innerHTML = Object.entries(data).map(([label, value]) => `
            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</div>
                <div class="text-2xl font-bold text-slate-900 mt-1">${value}</div>
            </div>
        `).join('');
    }

    function renderUsers(users) {
        document.getElementById('admin-users').innerHTML = users.map(item => `
            <tr>
                <td><a class="font-semibold text-indigo-600" href="profile.html?id=${item.id}">${utils.escapeHtml(item.full_name)}</a></td>
                <td>${utils.escapeHtml(item.email)}</td>
                <td class="capitalize">${item.role}</td>
                <td>${item.is_banned ? '<span class="text-rose-600 font-semibold">Banned</span>' : '<span class="text-emerald-600 font-semibold">Active</span>'}</td>
                <td>${item.role === 'admin' ? 'Protected' : `<button class="ban-toggle text-indigo-600 font-semibold" data-id="${item.id}" data-banned="${item.is_banned}">${item.is_banned ? 'Unban' : 'Ban'}</button>`}</td>
            </tr>
        `).join('');
    }

    function renderPosts(posts) {
        document.getElementById('admin-posts').innerHTML = posts.map(post => `
            <tr>
                <td><a class="font-semibold text-indigo-600" href="forum-post.html?id=${post.id}">${utils.escapeHtml(post.title)}</a></td>
                <td>${utils.escapeHtml(post.author.full_name)}</td>
                <td>${post.is_deleted ? '<span class="text-rose-600 font-semibold">Deleted</span>' : 'Visible'}</td>
                <td>${post.is_deleted ? '' : `<button class="delete-post text-rose-600 font-semibold" data-id="${post.id}">Delete</button>`}</td>
            </tr>
        `).join('');
    }

    function renderReplies(replies) {
        document.getElementById('admin-replies').innerHTML = replies.map(reply => `
            <tr>
                <td>${utils.escapeHtml(reply.body).slice(0, 120)}</td>
                <td>${utils.escapeHtml(reply.author.full_name)}</td>
                <td><a class="text-indigo-600" href="forum-post.html?id=${reply.post_id}">#${reply.post_id}</a></td>
                <td>${reply.is_deleted ? '<span class="text-rose-600 font-semibold">Deleted</span>' : 'Visible'}</td>
                <td>${reply.is_deleted ? '' : `<button class="delete-reply text-rose-600 font-semibold" data-id="${reply.id}">Delete</button>`}</td>
            </tr>
        `).join('');
    }

    function renderBookings(bookings) {
        document.getElementById('admin-bookings').innerHTML = bookings.map(booking => `
            <tr>
                <td>${utils.escapeHtml(booking.topic)}</td>
                <td>${utils.escapeHtml(booking.student.full_name)}</td>
                <td>${utils.escapeHtml(booking.mentor.full_name)}</td>
                <td class="capitalize">${booking.status}</td>
                <td>${utils.formatDate(booking.created_at)}</td>
            </tr>
        `).join('');
    }

    content.addEventListener('click', async (event) => {
        const banBtn = event.target.closest('.ban-toggle');
        const postBtn = event.target.closest('.delete-post');
        const replyBtn = event.target.closest('.delete-reply');

        try {
            if (banBtn) {
                const action = banBtn.dataset.banned === 'true' ? 'unban' : 'ban';
                await api.patch(`/admin/users/${banBtn.dataset.id}/${action}`);
                utils.showToast(`User ${action === 'ban' ? 'banned' : 'unbanned'}`, 'success');
                loadAdmin();
            }
            if (postBtn && confirm('Delete this forum post?')) {
                await api.delete(`/admin/posts/${postBtn.dataset.id}`);
                utils.showToast('Post deleted', 'success');
                loadAdmin();
            }
            if (replyBtn && confirm('Delete this reply?')) {
                await api.delete(`/admin/replies/${replyBtn.dataset.id}`);
                utils.showToast('Reply deleted', 'success');
                loadAdmin();
            }
        } catch (error) {
            utils.showToast(error.message || 'Admin action failed', 'error');
        }
    });

    loadAdmin();
});
