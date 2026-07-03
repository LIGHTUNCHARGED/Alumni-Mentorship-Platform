document.addEventListener('DOMContentLoaded', async () => {
    const id = utils.getUrlParam('id');
    const card = document.getElementById('profile-card');
    const loader = document.getElementById('profile-loader');

    if (!id) {
        window.location.href = 'forum.html';
        return;
    }

    try {
        const profile = await api.get(`/users/${id}`);
        const initials = profile.full_name.split(' ').map(part => part[0]).join('').slice(0, 2);
        const mentor = profile.mentor_profile;
        card.innerHTML = `
            <div class="flex flex-col sm:flex-row gap-6 sm:items-center border-b border-slate-100 pb-6">
                <div class="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold">${utils.escapeHtml(initials)}</div>
                <div class="flex-1">
                    <h1 class="text-3xl font-bold text-slate-900">${utils.escapeHtml(profile.full_name)}</h1>
                    <div class="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-600">
                        <span class="capitalize font-semibold">${profile.role}</span>
                        <span>${utils.escapeHtml(profile.email)}</span>
                        ${profile.is_banned ? '<span class="text-rose-600 font-semibold">Banned</span>' : '<span class="text-emerald-600 font-semibold">Active</span>'}
                    </div>
                </div>
            </div>
            ${mentor ? `
                <div class="grid sm:grid-cols-3 gap-4 mt-6">
                    <div><div class="text-xs font-semibold text-slate-500 uppercase">Domain</div><div class="font-bold text-slate-900">${utils.escapeHtml(mentor.domain)}</div></div>
                    <div><div class="text-xs font-semibold text-slate-500 uppercase">Experience</div><div class="font-bold text-slate-900">${mentor.years_experience} years</div></div>
                    <div><div class="text-xs font-semibold text-slate-500 uppercase">Availability</div><div class="font-bold text-slate-900">${utils.escapeHtml(mentor.availability || 'Not listed')}</div></div>
                </div>
                <div class="mt-6">
                    <h2 class="text-lg font-bold text-slate-900">About</h2>
                    <p class="text-sm text-slate-600 leading-relaxed mt-2">${utils.escapeHtml(mentor.bio)}</p>
                </div>
                <div class="mt-5 text-sm text-slate-600"><span class="font-semibold">Tags:</span> ${utils.escapeHtml(mentor.tags || 'None')}</div>
            ` : `
                <div class="mt-6">
                    <h2 class="text-lg font-bold text-slate-900">Community Member</h2>
                    <p class="text-sm text-slate-600 mt-2">This user participates in mentorship discussions and forum conversations.</p>
                </div>
            `}
        `;
        card.classList.remove('hidden');
    } catch (error) {
        utils.showToast(error.message || 'Failed to load profile', 'error');
    } finally {
        loader.classList.add('hidden');
    }
});
