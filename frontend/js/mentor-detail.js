document.addEventListener('DOMContentLoaded', () => {
    const mentorId = utils.getUrlParam('id');
    if (!mentorId) {
        window.location.href = 'mentors.html';
        return;
    }

    // DOM Elements
    const detailLoader = document.getElementById('detail-loader');
    const profileCard = document.getElementById('mentor-profile-card');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileDomain = document.getElementById('profile-domain');
    const profileExp = document.getElementById('profile-exp');
    const profileBio = document.getElementById('profile-bio');
    const profileTags = document.getElementById('profile-tags');
    const profileAvailText = document.getElementById('profile-avail-text');
    const bookingActionSection = document.getElementById('booking-action-section');

    // Modal Elements
    const bookingModal = document.getElementById('booking-modal');
    const closeModalsBtns = [
        document.getElementById('close-modal-btn'),
        document.getElementById('cancel-booking-btn')
    ];
    const bookingForm = document.getElementById('booking-form');

    let mentorUser = null;

    // Load Profile Data
    async function loadProfile() {
        try {
            const profile = await api.get(`/mentors/${mentorId}`);
            if (!profile) {
                utils.showToast('Mentor profile not found', 'error');
                setTimeout(() => { window.location.href = 'mentors.html'; }, 2000);
                return;
            }

            mentorUser = profile.user;
            renderProfile(profile);
            setupBookingSection();
        } catch (error) {
            utils.showToast(error.message || 'Failed to fetch mentor profile', 'error');
        } finally {
            detailLoader.classList.add('hidden');
            profileCard.classList.remove('hidden');
        }
    }

    // Render Data
    function renderProfile(profile) {
        const initials = profile.user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
        profileAvatar.textContent = initials;
        profileName.textContent = profile.user.full_name;
        profileDomain.textContent = profile.domain;
        profileExp.textContent = `${profile.years_experience} Years Experience`;
        profileBio.textContent = profile.bio;
        profileAvailText.textContent = profile.availability || 'Upon Request';

        // Render Tags
        profileTags.innerHTML = '';
        if (profile.tags) {
            profile.tags.split(',').forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm';
                tagSpan.textContent = tag.trim();
                profileTags.appendChild(tagSpan);
            });
        } else {
            profileTags.innerHTML = '<span class="text-sm text-slate-400 font-light">No custom tags listed</span>';
        }
    }

    // Setup Booking Panel Actions Based on Auth
    function setupBookingSection() {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;

        bookingActionSection.innerHTML = '';

        if (!token || !user) {
            bookingActionSection.innerHTML = `
                <p class="text-xs text-slate-500 mb-3 text-center">Please sign in to request a 1-on-1 mentorship session.</p>
                <a href="login.html" class="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition shadow-sm">
                    Sign In to Book
                </a>
            `;
            return;
        }

        if (user.role === 'student') {
            bookingActionSection.innerHTML = `
                <button id="open-booking-btn" class="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition shadow-lg shadow-indigo-600/20">
                    Book a Session
                </button>
            `;

            // Setup Modal Opening
            document.getElementById('open-booking-btn').addEventListener('click', () => {
                bookingModal.classList.remove('hidden');
                // Set default minimum date to today
                const today = new Date().toISOString().slice(0, 16);
                document.getElementById('booking-datetime').min = today;
            });
        } else {
            // Logged in as alumni (mentor)
            bookingActionSection.innerHTML = `
                <p class="text-xs text-slate-500 mb-3 text-center">Logged in as Alumni. Mentors cannot book sessions with other mentors.</p>
                <button disabled class="w-full inline-flex justify-center items-center px-4 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-400 bg-slate-100 cursor-not-allowed">
                    Booking Unavailable
                </button>
            `;
        }
    }

    // Modal Closing Handlers
    closeModalsBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                bookingModal.classList.add('hidden');
            });
        }
    });

    // Close modal on clicking backdrop overlay
    const backdrop = bookingModal.querySelector('.fixed.inset-0.bg-slate-900\\/60');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            bookingModal.classList.add('hidden');
        });
    }

    // Handle Form Submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const topic = document.getElementById('booking-topic').value;
            const datetime = document.getElementById('booking-datetime').value;
            const message = document.getElementById('booking-message').value;

            if (!topic || !datetime) {
                utils.showToast('Please specify a topic and datetime', 'error');
                return;
            }

            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Submitting...';

            try {
                const response = await api.post('/bookings', {
                    mentor_id: parseInt(mentorId),
                    preferred_datetime: datetime,
                    topic,
                    message
                });

                if (response) {
                    utils.showToast('Booking request submitted successfully!', 'success');
                    bookingModal.classList.add('hidden');
                    bookingForm.reset();
                }
            } catch (error) {
                utils.showToast(error.message || 'Failed to submit booking request', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Initial load
    loadProfile();
});
