document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    // DOM Elements
    const dashWelcome = document.getElementById('dash-welcome');
    const dashRoleSubtitle = document.getElementById('dash-role-subtitle');
    const dashLoader = document.getElementById('dash-loader');
    
    // View sections
    const studentView = document.getElementById('student-view');
    const alumniView = document.getElementById('alumni-view');

    // Student DOM
    const studentBookingsContainer = document.getElementById('student-bookings-container');
    const studentForumContainer = document.getElementById('student-forum-container');

    // Alumni DOM
    const pendingBookingsContainer = document.getElementById('pending-bookings-container');
    const acceptedBookingsContainer = document.getElementById('accepted-bookings-container');
    const mentorProfileStatus = document.getElementById('mentor-profile-status');
    const mentorProfileForm = document.getElementById('mentor-profile-form');
    
    // Mentor Form Inputs
    const formAction = document.getElementById('form-action');
    const formDomain = document.getElementById('form-domain');
    const formExp = document.getElementById('form-exp');
    const formBio = document.getElementById('form-bio');
    const formAvail = document.getElementById('form-avail');
    const formTags = document.getElementById('form-tags');
    const cancelProfileEditBtn = document.getElementById('cancel-profile-edit');

    // State
    let mentorProfileData = null;

    // Set Welcome Header
    dashWelcome.textContent = `Welcome back, ${user.full_name}`;
    dashRoleSubtitle.textContent = `You are logged in as a ${user.role}.`;

    // Fetch Dashboard Data
    async function loadDashboard() {
        try {
            const data = await api.get('/dashboard');
            
            if (user.role === 'student') {
                renderStudentDashboard(data);
            } else {
                renderAlumniDashboard(data);
                await loadMentorProfile();
            }
        } catch (error) {
            utils.showToast(error.message || 'Failed to load dashboard statistics', 'error');
        } finally {
            dashLoader.classList.add('hidden');
            if (user.role === 'student') {
                studentView.classList.remove('hidden');
            } else {
                alumniView.classList.remove('hidden');
            }
        }
    }

    // ── Student Dashboard Rendering ────────────────────

    function renderStudentDashboard(data) {
        // Bookings
        studentBookingsContainer.innerHTML = '';
        const bookings = data.my_bookings || [];
        
        if (bookings.length === 0) {
            studentBookingsContainer.innerHTML = `
                <div class="text-center py-6 text-slate-500 font-light text-sm">
                    You haven't requested any mentorship sessions yet. <br>
                    <a href="mentors.html" class="text-indigo-600 font-semibold hover:underline mt-2 block">Find a mentor now</a>
                </div>
            `;
        } else {
            bookings.forEach(booking => {
                const dateStr = utils.formatDate(booking.preferred_datetime);
                const statusStyles = getStatusStyles(booking.status);
                
                const div = document.createElement('div');
                div.className = 'border border-slate-150 p-4 rounded-xl space-y-2 relative bg-slate-50/50';
                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-bold text-slate-900">${booking.topic}</h3>
                            <p class="text-xs text-slate-500 font-medium mt-0.5">Mentor: ${booking.mentor.full_name} (${booking.mentor.email})</p>
                        </div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles}">
                            ${booking.status}
                        </span>
                    </div>
                    <div class="text-xs text-slate-600">
                        <span class="font-bold text-slate-700">Preferred Date:</span> ${dateStr}
                    </div>
                    ${booking.message ? `<p class="text-xs text-slate-500 bg-white p-2.5 rounded border border-slate-100 italic">"${booking.message}"</p>` : ''}
                `;
                studentBookingsContainer.appendChild(div);
            });
        }

        // Forum Activity
        studentForumContainer.innerHTML = '';
        const posts = data.my_posts || [];
        const replies = data.my_replies || [];

        if (posts.length === 0 && replies.length === 0) {
            studentForumContainer.innerHTML = `
                <div class="text-center py-6 text-slate-500 font-light text-sm">
                    No recent activity. Post a question to get started. <br>
                    <a href="forum.html" class="text-indigo-600 font-semibold hover:underline mt-2 block">Visit discussion board</a>
                </div>
            `;
        } else {
            // Render posts
            if (posts.length > 0) {
                const title = document.createElement('h3');
                title.className = 'text-xs font-bold text-slate-400 uppercase tracking-wider mb-2';
                title.textContent = 'Topics Created';
                studentForumContainer.appendChild(title);

                posts.slice(0, 3).forEach(post => {
                    const a = document.createElement('a');
                    a.href = `forum-post.html?id=${post.id}`;
                    a.className = 'block border-l-2 border-indigo-500 pl-3 py-1 text-sm text-slate-700 hover:text-indigo-600 font-medium truncate';
                    a.textContent = post.title;
                    studentForumContainer.appendChild(a);
                });
            }

            // Render replies
            if (replies.length > 0) {
                const title = document.createElement('h3');
                title.className = 'text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2';
                title.textContent = 'Recent Replies';
                studentForumContainer.appendChild(title);

                replies.slice(0, 3).forEach(reply => {
                    const a = document.createElement('a');
                    a.href = `forum-post.html?id=${reply.post_id}`;
                    a.className = 'block border-l-2 border-slate-300 pl-3 py-1 text-sm text-slate-600 hover:text-indigo-600 truncate';
                    a.innerHTML = `<span class="italic font-light">"Value reply..."</span>`;
                    // Fetch post title if available, otherwise general link
                    a.textContent = reply.body;
                    studentForumContainer.appendChild(a);
                });
            }
        }
    }

    // ── Alumni Dashboard Rendering ─────────────────────

    function renderAlumniDashboard(data) {
        // Pending Bookings
        pendingBookingsContainer.innerHTML = '';
        const pending = data.pending_bookings || [];

        if (pending.length === 0) {
            pendingBookingsContainer.innerHTML = `
                <div class="text-center py-6 text-slate-500 font-light text-sm">
                    No pending session requests at the moment.
                </div>
            `;
        } else {
            pending.forEach(booking => {
                const dateStr = utils.formatDate(booking.preferred_datetime);
                const div = document.createElement('div');
                div.className = 'border border-slate-200 p-5 rounded-2xl bg-slate-50/50 space-y-3';
                
                div.innerHTML = `
                    <div class="flex justify-between items-start gap-4">
                        <div>
                            <h3 class="font-bold text-slate-900 text-sm">${booking.topic}</h3>
                            <p class="text-xs text-slate-500 font-medium mt-0.5">From student: ${booking.student.full_name} (${booking.student.email})</p>
                        </div>
                        <div class="flex gap-2">
                            <button class="accept-btn px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition" data-id="${booking.id}">Accept</button>
                            <button class="decline-btn px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition" data-id="${booking.id}">Decline</button>
                        </div>
                    </div>
                    <div class="text-xs text-slate-600">
                        <span class="font-bold text-slate-700">Requested Time:</span> ${dateStr}
                    </div>
                    ${booking.message ? `<p class="text-xs text-slate-500 bg-white p-2.5 rounded border border-slate-100 italic">"${booking.message}"</p>` : ''}
                `;
                pendingBookingsContainer.appendChild(div);
            });
        }

        // Accepted Bookings
        acceptedBookingsContainer.innerHTML = '';
        const accepted = data.accepted_bookings || [];

        if (accepted.length === 0) {
            acceptedBookingsContainer.innerHTML = `
                <div class="text-center py-6 text-slate-500 font-light text-sm">
                    No approved sessions. Once you accept a request, it will appear here.
                </div>
            `;
        } else {
            accepted.forEach(booking => {
                const dateStr = utils.formatDate(booking.preferred_datetime);
                const div = document.createElement('div');
                div.className = 'border border-slate-150 p-4 rounded-xl bg-slate-50/50 flex justify-between items-center';
                
                div.innerHTML = `
                    <div>
                        <h3 class="font-bold text-slate-900 text-sm">${booking.topic}</h3>
                        <p class="text-xs text-slate-500 font-medium mt-0.5">Student: ${booking.student.full_name} • ${dateStr}</p>
                    </div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Approved
                    </span>
                `;
                acceptedBookingsContainer.appendChild(div);
            });
        }
    }

    // ── Mentor Profile Load/Edit ────────────────────────

    async function loadMentorProfile() {
        try {
            // Find current user profile from `/mentors/{current_user.id}`
            const profile = await api.get(`/mentors/${user.id}`);
            mentorProfileData = profile;
            renderMentorProfileStatus(profile);
        } catch (error) {
            // 404 indicates profile does not exist yet
            renderMentorProfileStatus(null);
        }
    }

    function renderMentorProfileStatus(profile) {
        mentorProfileStatus.innerHTML = '';

        if (!profile) {
            mentorProfileStatus.innerHTML = `
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <span class="text-2xl block mb-1">⚠️</span>
                    <h3 class="text-sm font-bold text-amber-800">Profile Incomplete</h3>
                    <p class="text-xs text-amber-600 mt-1">Students cannot find or book you until your mentor profile is set up.</p>
                    <button id="setup-profile-btn" class="mt-3 inline-flex justify-center items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition w-full">
                        Set Up Profile Now
                    </button>
                </div>
            `;

            document.getElementById('setup-profile-btn').addEventListener('click', () => {
                showMentorProfileForm('create');
            });
        } else {
            mentorProfileStatus.innerHTML = `
                <div class="space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-xs text-slate-400 font-bold uppercase">Domain</div>
                            <div class="text-sm font-bold text-slate-900">${profile.domain}</div>
                        </div>
                        <div>
                            <div class="text-xs text-slate-400 font-bold uppercase">Experience</div>
                            <div class="text-sm font-bold text-slate-900">${profile.years_experience} yrs</div>
                        </div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400 font-bold uppercase">Availability</div>
                        <div class="text-sm font-semibold text-slate-700">${profile.availability || 'Not listed'}</div>
                    </div>
                    <div>
                        <div class="text-xs text-slate-400 font-bold uppercase">Bio Snippet</div>
                        <p class="text-xs text-slate-500 font-light line-clamp-3 mt-1">"${profile.bio}"</p>
                    </div>
                    
                    <button id="edit-profile-btn" class="mt-4 w-full py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                        Edit Profile Details
                    </button>
                </div>
            `;

            document.getElementById('edit-profile-btn').addEventListener('click', () => {
                showMentorProfileForm('update', profile);
            });
        }
    }

    function showMentorProfileForm(action, profile = null) {
        mentorProfileStatus.classList.add('hidden');
        mentorProfileForm.classList.remove('hidden');
        formAction.value = action;

        if (action === 'update' && profile) {
            formDomain.value = profile.domain;
            formExp.value = profile.years_experience;
            formBio.value = profile.bio;
            formAvail.value = profile.availability || '';
            formTags.value = profile.tags || '';
        } else {
            mentorProfileForm.reset();
            formAction.value = 'create';
        }
    }

    function hideMentorProfileForm() {
        mentorProfileForm.classList.add('hidden');
        mentorProfileStatus.classList.remove('hidden');
    }

    // Cancel Profile Edit
    if (cancelProfileEditBtn) {
        cancelProfileEditBtn.addEventListener('click', hideMentorProfileForm);
    }

    // Mentor Profile Form Submit
    if (mentorProfileForm) {
        mentorProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const action = formAction.value;
            const domain = formDomain.value;
            const exp = parseInt(formExp.value);
            const bio = formBio.value;
            const avail = formAvail.value;
            const tags = formTags.value;

            // Word validation client-side
            const words = bio.trim().split(/\s+/).length;
            if (words > 200) {
                utils.showToast(`Bio exceeds 200 words (currently ${words} words)`, 'error');
                return;
            }

            const submitBtn = mentorProfileForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Saving...';

            try {
                let response;
                if (action === 'create') {
                    response = await api.post('/mentors/profile', {
                        domain, years_experience: exp, bio, availability: avail, tags
                    });
                } else {
                    response = await api.put('/mentors/profile', {
                        domain, years_experience: exp, bio, availability: avail, tags
                    });
                }

                if (response) {
                    utils.showToast('Mentor profile saved successfully!', 'success');
                    hideMentorProfileForm();
                    await loadMentorProfile();
                }
            } catch (error) {
                utils.showToast(error.message || 'Failed to save profile details', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Save Profile';
            }
        });
    }

    // Accept / Decline Booking Triggers
    if (pendingBookingsContainer) {
        pendingBookingsContainer.addEventListener('click', async (e) => {
            const acceptBtn = e.target.closest('.accept-btn');
            const declineBtn = e.target.closest('.decline-btn');
            
            if (!acceptBtn && !declineBtn) return;
            
            const btn = acceptBtn || declineBtn;
            const bookingId = btn.dataset.id;
            const isAccept = !!acceptBtn;
            
            btn.disabled = true;
            
            try {
                const endpoint = `/bookings/${bookingId}/${isAccept ? 'accept' : 'decline'}`;
                const result = await api.patch(endpoint);
                
                if (result) {
                    utils.showToast(`Session request ${isAccept ? 'accepted' : 'declined'}!`, 'success');
                    // Reload dashboard data
                    const updatedData = await api.get('/dashboard');
                    renderAlumniDashboard(updatedData);
                }
            } catch (error) {
                utils.showToast(error.message || 'Failed to update booking status', 'error');
                btn.disabled = false;
            }
        });
    }

    // ── Helper functions ──────────────────────────────

    function getStatusStyles(status) {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-800';
            case 'accepted': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            case 'declined': return 'bg-rose-100 text-rose-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    // Initial Load
    loadDashboard();
});
