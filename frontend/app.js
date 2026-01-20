// API Configuration
// If on localhost, assume split dev servers (Frontend on 8001, Backend on 8000)
// If on production (Vercel), assume unified routing or relative path
const hostname = window.location.hostname;
if (hostname === 'localhost' || hostname === '127.0.0.1') {
    window.API_BASE = 'http://localhost:8000/api/v1';
} else {
    window.API_BASE = '/api/v1';
}

// State Management
const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    currentView: 'projects',
    projects: [],
    venues: [],
    activeProjectId: null, // Track currently active project for context
    projectVenues: [], // Venues added to the active project
    selectedVenues: new Set() // For the selection UI
};

// Selectors
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const contentArea = document.getElementById('content-area');
const viewTitle = document.getElementById('view-title');
const navItems = document.querySelectorAll('.nav-item');
const newBtn = document.getElementById('new-btn');

// Create Modal Elements
const modalOverlay = document.createElement('div');
modalOverlay.className = 'modal-overlay';
modalOverlay.innerHTML = `
    <div class="modal-content animate-fade">
        <h2 style="margin-bottom: 24px;">Create New Project</h2>
        <form id="project-form">
            <div class="form-group">
                <label>Client</label>
                <select id="p-client-select" style="width: 100%; padding: 10px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); background: white; margin-bottom: 8px;">
                    <option value="">-- Select Existing Client --</option>
                    <option value="new">+ Create New Client</option>
                </select>
                <input type="text" id="p-client-new" placeholder="Enter New Client Name" style="display: none;">
            </div>
            <div class="form-group">
                <label>Event Name</label>
                <input type="text" id="p-name" placeholder="e.g. Annual Summit 2026" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" id="p-start" required>
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" id="p-end" required>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                    <label>Attendees</label>
                    <input type="number" id="p-count" value="100" required>
                </div>
                <div class="form-group">
                    <label>Budget (EUR)</label>
                    <input type="number" id="p-budget" placeholder="e.g. 50000">
                </div>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" id="close-modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Project</button>
            </div>
        </form>
    </div>
`;
document.body.appendChild(modalOverlay);

// Handle Client Select Change
document.getElementById('p-client-select').addEventListener('change', (e) => {
    const input = document.getElementById('p-client-new');
    if (e.target.value === 'new') {
        input.style.display = 'block';
        input.required = true;
        input.focus();
    } else {
        input.style.display = 'none';
        input.required = false;
    }
});

// Initialization
function init() {
    if (state.token) {
        showDashboard();
    } else {
        showAuth();
    }
}

function showAuth() {
    authView.style.display = 'flex';
    dashboardView.style.display = 'none';
}

function showDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'grid';
    document.getElementById('user-name').textContent = state.user?.name || 'Manager';
    loadView(state.currentView);
}

// API Calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    try {
        const response = await fetch(`${window.API_BASE}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (response.status === 401) {
            handleLogout();
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API request failed');
        }

        if (method === 'DELETE') return true;
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        alert(err.message);
        return null;
    }
}

// Auth Handlers
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await apiCall('/auth/login', 'POST', { email, password });
    if (result) {
        state.token = result.access_token;
        localStorage.setItem('token', state.token);

        // Fetch user data
        const userData = await apiCall('/auth/me');
        if (userData) {
            state.user = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            showDashboard();
        }
    }
});

function handleLogout() {
    state.user = null;
    state.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showAuth();
}

logoutBtn.addEventListener('click', handleLogout);

// Modal Handling
// Modal Handling
newBtn.addEventListener('click', async () => {
    // Populate Clients Dropdown
    const select = document.getElementById('p-client-select');
    const input = document.getElementById('p-client-new');

    // Reset state
    input.style.display = 'none';
    input.value = '';
    input.required = false;
    select.value = '';

    // Fetch latest clients
    try {
        const clients = await apiCall('/clients');
        select.innerHTML = '<option value="">-- Select Existing Client --</option><option value="new">+ Create New Client</option>';

        if (clients && clients.length) {
            // Sort alphabetically
            clients.sort((a, b) => a.name.localeCompare(b.name));

            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                select.insertBefore(opt, select.lastElementChild);
            });
        }
    } catch (e) { console.error('Error fetching clients', e); }

    modalOverlay.classList.add('show');
});

document.getElementById('close-modal').addEventListener('click', () => {
    modalOverlay.classList.remove('show');
});

document.getElementById('project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const projectData = {
        client_name: document.getElementById('p-client').value,
        event_name: document.getElementById('p-name').value,
        event_date_start: document.getElementById('p-start').value,
        event_date_end: document.getElementById('p-end').value,
        attendee_count: parseInt(document.getElementById('p-count').value),
        budget: parseFloat(document.getElementById('p-budget').value) || null,
        requirements: []
    };

    const result = await apiCall('/projects', 'POST', projectData);
    if (result) {
        modalOverlay.classList.remove('show');
        document.getElementById('project-form').reset();
        loadView('projects');
    }
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (!view) return;

        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Reset project context on top-level navigation
        state.activeProjectId = null;

        loadView(view);
    });
});

function updateNavigation() {
    navItems.forEach(item => {
        const view = item.dataset.view;
        const current = state.currentView;
        let isActive = false;

        if (view === current) isActive = true;
        else if (current === 'project-details' && view === 'projects') isActive = true;
        else if (current === 'project-venues' && view === 'projects') isActive = true;
        else if (current === 'client-details' && view === 'clients') isActive = true;

        if (isActive) item.classList.add('active');
        else item.classList.remove('active');
    });
}

async function loadView(view, arg) {
    state.currentView = view;
    // Reset selection state on view change
    state.selectedVenues.clear();
    updateSelectionBar();

    // Toggle New Project button visibility
    if (view === 'projects') {
        newBtn.style.display = 'inline-flex';
    } else {
        newBtn.style.display = 'none';
    }

    contentArea.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';

    if (view === 'projects') {
        state.activeProjectId = null; // Clear active project
        viewTitle.style.display = 'block'; // Show title
        viewTitle.textContent = 'Active Projects';
        const data = await apiCall('/projects');
        if (data) state.projects = data.items;
        renderProjects();
    } else if (view === 'venues') {
        // Use the new Global Venue Gallery rendering
        // Note: activeProjectId is preserved if set (for "Add to Project" mode)
        viewTitle.style.display = 'none'; // Hide duplicate title
        await renderGlobalVenueGallery();
    } else if (view === 'project-details') {
        const projectId = arg;
        state.activeProjectId = projectId; // Set active project
        viewTitle.style.display = 'block'; // Show title
        viewTitle.textContent = 'Project Dashboard';

        // Parallel fetch for project info and its venues
        const [projects, pVenues] = await Promise.all([
            state.projects.length ? null : apiCall('/projects'), // Fetch projects if missing
            apiCall(`/projects/${projectId}/venues`)
        ]);

        if (projects) state.projects = projects.items;
        if (pVenues) state.projectVenues = pVenues;

        renderProjectDetails(projectId);
    } else if (view === 'project-venues') {
        // Use the new Project Venue Gallery rendering
        const projectId = arg;
        state.activeProjectId = projectId;
        viewTitle.style.display = 'none'; // Hide duplicate title
        await renderProjectVenueGallery(projectId);
    } else if (view === 'clients') {
        viewTitle.style.display = 'none';
        await renderClientsView();
    }
}

// Actions
async function addToProject(venueId) {
    if (!state.activeProjectId) {
        alert("Please open a project first to add venues.");
        loadView('projects');
        return;
    }

    const res = await apiCall(`/projects/${state.activeProjectId}/venues`, 'POST', { venue_id: venueId });
    if (res) {
        // Visual feedback
        const btn = document.getElementById(`add-btn-${venueId}`);
        if (btn) {
            btn.textContent = 'Added';
            btn.classList.remove('btn-primary');
            btn.classList.add('status-active'); // Reusing class for green look
            btn.disabled = true;
        }
    }
}

function toggleVenueSelection(projectVenueId) {
    if (state.selectedVenues.has(projectVenueId)) {
        state.selectedVenues.delete(projectVenueId);
    } else {
        state.selectedVenues.add(projectVenueId);
    }
    updateSelectionBar();
}

function updateSelectionBar() {
    let bar = document.getElementById('selection-bar');
    const count = state.selectedVenues.size;

    if (count > 0) {
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'selection-bar';
            bar.className = 'animate-fade';
            bar.style.cssText = `
                position: fixed; 
                bottom: 30px; 
                left: 50%; 
                transform: translateX(-50%); 
                background: var(--qed-dark-blue); 
                color: white; 
                padding: 12px 24px; 
                border-radius: 999px; 
                display: flex; 
                align-items: center; 
                gap: 24px; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
                z-index: 1000;
            `;
            document.body.appendChild(bar);
        }
        bar.innerHTML = `
           <span style="font-weight: 500;"><b>${count}</b> Venues Selected</span>
           <div style="display: flex; gap: 12px;">
              <button class="btn" style="padding: 6px 16px; font-size: 0.85rem; background: rgba(255,255,255,0.1); color: white; border: none;">Export CSV</button>
              <button class="btn" style="padding: 6px 16px; font-size: 0.85rem; background: var(--qed-green); color: white; border: none;">Compare Venues</button>
           </div>
        `;
        bar.style.display = 'flex';
    } else {
        if (bar) bar.style.display = 'none';
    }
}


// Rendering
function renderProjects() {
    if (state.projects.length === 0) {
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-dim);">
                <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>No active projects found.</p>
                <button class="btn btn-primary" id="create-first-project" style="width: auto; margin-top: 20px;">Create Your First Project</button>
            </div>
        `;
        const createBtn = document.getElementById('create-first-project');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                modalOverlay.classList.add('show');
            });
        }
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
    state.projects.forEach(p => {
        // Format dates and status
        const startDate = p.event_date_start ? new Date(p.event_date_start).toLocaleDateString() : 'TBD';
        const statusClass = (p.status === 'active' || !p.status) ? 'status-active' : 'status-pending';

        html += `
            <div class="card animate-fade" style="width: 100%;">
                <div class="card-body" style="padding: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <!-- Main Info -->
                        <div style="flex: 2;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
                                <h3 style="font-size: 1.2rem; margin: 0; cursor: pointer; color: var(--qed-dark-blue); transition: color 0.2s;" onclick="loadView('project-details', '${p.id}')" onmouseover="this.style.color='var(--qed-green)'" onmouseout="this.style.color='var(--qed-dark-blue)'">${p.event_name}</h3>
                                <span class="status-pill ${statusClass}" style="font-size: 0.75rem;">${p.status || 'Active'}</span>
                            </div>
                            <p class="text-dim" style="font-size: 0.95rem; margin: 0;">${p.client_name}</p>
                        </div>
                        
                        <!-- Details -->
                        <div style="flex: 2; display: flex; gap: 32px;">
                            <div>
                                <p class="text-dim" style="font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px;">Attendees</p>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fa-solid fa-users" style="color: var(--qed-medium-grey);"></i>
                                    <span style="font-weight: 600;">${p.attendee_count}</span>
                                </div>
                            </div>
                            <div>
                                <p class="text-dim" style="font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px;">Date</p>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fa-regular fa-calendar" style="color: var(--qed-medium-grey);"></i>
                                    <span style="font-weight: 600;">${startDate}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Action -->
                        <div style="flex: 0 0 auto;">
                            <button class="btn btn-secondary open-project-btn" data-id="${p.id}" style="padding: 8px 24px;">
                                Open Project <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    contentArea.innerHTML = html;

    // Listeners
    document.querySelectorAll('.open-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pid = e.target.getAttribute('data-id');
            loadView('project-details', pid);
        });
    });
}

function renderVenues() {
    if (state.venues.length === 0) {
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--text-dim);">
                <i class="fa-solid fa-building" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>No Venues in Gallery</h3>
                <p style="margin-bottom: 24px;">Get started by adding venues individually or uploading a CSV file.</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-primary" id="add-venue-btn" style="width: auto;">
                        <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Add Venue
                    </button>
                    <button class="btn btn-secondary" id="upload-csv-btn" style="width: auto;">
                        <i class="fa-solid fa-file-csv" style="margin-right: 8px;"></i> Upload CSV
                    </button>
                    <button class="btn btn-secondary" id="download-template-btn" style="width: auto;">
                        <i class="fa-solid fa-download" style="margin-right: 8px;"></i> Download Template
                    </button>
                </div>
            </div>
        `;
        attachVenueUploadListeners();
        return;
    }

    // Map of already added venue IDs
    const addedVenueIds = new Set(state.projectVenues.map(pv => pv.venue_id));

    // Project context data for filters
    let projectContextHtml = '';
    let backButtonHtml = '';
    let headerText = `Browsing ${state.venues.length} Global Venues`;

    if (state.activeProjectId) {
        const project = state.projects.find(p => p.id === state.activeProjectId);
        if (project) {
            headerText = `Filter found ${state.venues.length} venues`; // Simplification: we aren't actually filtering the *list* array yet, just showing all.
            backButtonHtml = `
                <button class="btn btn-secondary" onclick="loadView('project-details', '${state.activeProjectId}')" style="width: auto; padding: 8px 16px; font-size: 0.9rem; border: none; margin-bottom: 16px; display: inline-flex; align-items: center;">
                    <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back to ${project.client_name}
                </button>
            `;

            projectContextHtml = `
                <div class="card animate-fade" style="margin-bottom: 24px; background: var(--qed-bg-grey); border: 1px solid var(--qed-cold-grey);">
                    <div class="card-body" style="padding: 16px 24px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center;">
                            <div style="margin-right: 24px;">
                                <p class="text-dim" style="font-size: 0.75rem; text-transform: uppercase; margin-bottom: 4px;">Smart Filters Active</p>
                                <h4 style="color: var(--qed-dark-blue); margin: 0;">Matching criteria for ${project.client_name}</h4>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <span class="facility-tag" style="background: white; border-color: var(--qed-green);">
                                    <i class="fa-solid fa-user-group" style="margin-right: 6px; color: var(--qed-green);"></i> 
                                    Min. ${project.attendee_count}
                                </span>
                                ${project.budget ? `
                                <span class="facility-tag" style="background: white; border-color: var(--qed-green);">
                                    <i class="fa-solid fa-euro-sign" style="margin-right: 6px; color: var(--qed-green);"></i> 
                                    Budget: < ${project.budget}
                                </span>` : ''}
                            </div>
                        </div>
                        <button class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.8rem;">Adjust Filters</button>
                    </div>
                </div>
            `;
        }
    }

    let html = `
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
            ${backButtonHtml}
        </div>
        
        ${projectContextHtml}
        
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
             <p class="text-dim">${headerText}</p>
             <div style="display: flex; gap: 8px; align-items: center;">
                 ${state.activeProjectId ? `<span class="status-pill status-active">Adding to current project</span>` : ''}
                 <button class="btn btn-secondary" id="add-venue-btn" style="width: auto; padding: 8px 16px; font-size: 0.85rem;">
                     <i class="fa-solid fa-plus" style="margin-right: 6px;"></i> Add Venue
                 </button>
                 <button class="btn btn-secondary" id="upload-csv-btn" style="width: auto; padding: 8px 16px; font-size: 0.85rem;">
                     <i class="fa-solid fa-file-csv" style="margin-right: 6px;"></i> Upload CSV
                 </button>
                 <button class="btn btn-secondary" id="download-template-btn" style="width: auto; padding: 8px 16px; font-size: 0.85rem;">
                     <i class="fa-solid fa-download" style="margin-right: 6px;"></i> Template
                 </button>
             </div>
        </div>

        <div class="grid-cards">
    `;

    // ... rest of function logic specific to rendering cards matches previous blocks, 
    // so we end replacement here and re-attach the rest of the function logic in the next block's context if needed
    // But since the tool requires replacing the block, I need to include the loop or careful start/end lines.
    // I will encompass the top part of the function and the start of the loop.

    state.venues.forEach(v => {
        // ... (standard logic)
        const project = state.activeProjectId ? state.projects.find(p => p.id === state.activeProjectId) : null;

        const photo = v.photos.length > 0 ? v.photos[0].url : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80';
        const isAdded = addedVenueIds.has(v.id);
        const isSelected = state.selectedVenues.has(v.id);

        html += `
            <div class="venue-card animate-fade" style="position: relative;">
                ${state.activeProjectId && !isAdded ? `
                    <div style="position: absolute; top: 12px; left: 12px; z-index: 10;">
                        <input type="checkbox" class="venue-gallery-cb" data-id="${v.id}" ${isSelected ? 'checked' : ''} 
                        style="width: 20px; height: 20px; accent-color: var(--qed-green); cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    </div>
                ` : ''}
                
                <div class="card-img" style="background-image: url('${photo}');">
                    ${isAdded ? `
                        <div style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center;">
                            <span class="status-pill status-active" style="background: white; border: 1px solid var(--qed-green);">
                                <i class="fa-solid fa-check" style="margin-right: 6px;"></i> Added
                            </span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${v.name}</h3>
                        <span style="font-size: 0.75rem;" class="text-primary">Max ${v.capacity}</span>
                    </div>
                    <p class="text-dim" style="font-size: 0.85rem; margin-bottom: 12px;"><i class="fa-solid fa-location-dot" style="margin-right: 4px;"></i> ${v.city}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 16px;">
                        ${v.facilities.slice(0, 3).map(f => `<span class="facility-tag">${f}</span>`).join('')}
                    </div>
                    ${state.activeProjectId
                ? (isAdded
                    ? `<button class="btn btn-secondary" style="font-size: 0.85rem; opacity: 0.6;" disabled>Added to Project</button>`
                    : `<button id="add-btn-${v.id}" class="btn btn-primary add-venue-btn" data-id="${v.id}" style="font-size: 0.85rem;">Add to Project</button>`)
                : `<button class="btn btn-secondary" style="font-size: 0.85rem;" disabled>Select Project First</button>`
            }
                </div>
            </div>
        `;
    });
    html += '</div>';
    contentArea.innerHTML = html;

    // Attach Listeners
    if (state.activeProjectId) {
        // ... listeners
        document.querySelectorAll('.add-venue-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vid = e.target.getAttribute('data-id');
                addToProject(vid);
            });
        });

        // Checkboxes
        document.querySelectorAll('.venue-gallery-cb').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const vid = e.target.getAttribute('data-id');
                if (e.target.checked) {
                    state.selectedVenues.add(vid);
                } else {
                    state.selectedVenues.delete(vid);
                }
                updateSelectionBar();
            });
        });
    }

    // Attach upload/add venue listeners
    attachVenueUploadListeners();
}

async function renderProjectDetails(projectId, activeTab = 'selected') {
    const project = state.projects.find(p => p.id === projectId) || {
        event_name: 'Loading...', client_name: '', status: '', event_date_start: new Date().toISOString()
    };

    const venuesList = state.projectVenues;

    viewTitle.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; width: 100%;">
            <div style="display: flex; flex-direction: column;">
                <!-- Breadcrumbs -->
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.9rem; color: var(--qed-text-secondary);">
                    <a href="#" onclick="event.preventDefault(); loadView('projects');" style="color: var(--qed-green); text-decoration: none; font-weight: 500;">
                        Projects
                    </a>
                    <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i>
                    <span style="color: var(--qed-dark-blue); font-weight: 600;">${project.event_name}</span>
                </div>
                <span style="font-size: 1rem; color: var(--qed-blue); margin-bottom: 4px; font-weight: 600;">${project.client_name}</span>
                <span>${project.event_name}</span>
            </div>
            <button class="btn btn-primary" onclick="state.activeProjectId = '${projectId}'; loadView('venues');" style="width: auto; padding: 10px 24px;">
                <i class="fa-solid fa-plus" style="margin-right: 8px;"></i> Add More Venues
            </button>
        </div>
    `;

    // Define tab content rendering based on activeTab
    let tabContentHtml = '';

    if (activeTab === 'selected') {
        if (venuesList.length === 0) {
            tabContentHtml = `
                <div class="card animate-fade" style="min-height: 200px;">
                    <div style="text-align: center; padding: 40px;">
                        <div style="background: var(--qed-bg-grey); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                            <i class="fa-solid fa-hotel" style="color: var(--qed-medium-grey); font-size: 1.5rem;"></i>
                        </div>
                        <h3 style="margin-bottom: 8px;">No Venues Selected</h3>
                        <p class="text-dim" style="margin-bottom: 24px;">Go to the Venue Gallery to add venues to this project.</p>
                        <button class="btn btn-primary" onclick="state.activeProjectId = '${project.id}'; loadView('venues');" style="width: auto;">Browse Gallery</button>
                    </div>
                </div>`;
        } else {
            tabContentHtml = `<div class="card animate-fade" style="overflow: hidden;">`;
            venuesList.forEach(pv => {
                const v = pv.venue; // Access nested venue object
                const photo = v.photos.length > 0 ? v.photos[0].url : ''; // Fixed to use url directly
                tabContentHtml += `
                    <div style="display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--qed-cold-grey);">
                        <input type="checkbox" class="venue-select-cb" data-id="${pv.id}" style="margin-right: 20px; width: 18px; height: 18px; accent-color: var(--qed-green);">
                        
                        <div style="width: 60px; height: 40px; background-color: var(--qed-bg-grey); border-radius: 4px; background-image: url('${photo}'); background-size: cover; margin-right: 16px;"></div>
                        
                        <div style="flex: 1;">
                            <h4 style="font-size: 1rem; color: var(--qed-dark-blue);">${v.name}</h4>
                            <p class="text-dim" style="font-size: 0.8rem;">${v.city} • <i class="fa-solid fa-user-group"></i> ${v.capacity}</p>
                        </div>
                        
                        <div style="margin-right: 24px;">
                             <span class="status-pill status-${pv.outreach_status}">${pv.outreach_status}</span>
                        </div>
                        
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-secondary" onclick="aiContextPanel.open('${projectId}', '${v.id}')" style="width: auto; padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, var(--qed-green) 0%, #2a9d8f 100%); color: white; border: none;" title="AI Description Generator">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> AI
                            </button>
                            <button class="btn btn-secondary" onclick="viewVenueDetails('${v.id}')" style="width: auto; padding: 6px 12px; font-size: 0.8rem;">Details</button>
                            <button class="btn" onclick="removeVenueFromProject('${projectId}', '${v.id}')" style="width: auto; padding: 6px 12px; font-size: 0.8rem; background: transparent; border: 1px solid var(--qed-red); color: var(--qed-red);" title="Remove from project">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                 `;
            });
            tabContentHtml += `</div>`;
        }
    } else if (activeTab === 'outreach') {
        const statuses = ['draft', 'sent', 'pending', 'responded', 'declined'];

        tabContentHtml = `
            <div class="card animate-fade" style="overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--qed-bg-grey); text-align: left; font-size: 0.85rem; color: var(--text-dim);">
                            <th style="padding: 16px 24px; font-weight: 600;">Venue</th>
                            <th style="padding: 16px 24px; font-weight: 600;">Contact</th>
                            <th style="padding: 16px 24px; font-weight: 600;">Status</th>
                            <th style="padding: 16px 24px; font-weight: 600;">Last Updated</th>
                            <th style="padding: 16px 24px; font-weight: 600;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (venuesList.length === 0) {
            tabContentHtml += `<tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--text-dim);">No venues to track. Add venues first.</td></tr>`;
        } else {
            venuesList.forEach(pv => {
                const v = pv.venue;
                tabContentHtml += `
                    <tr style="border-bottom: 1px solid var(--qed-cold-grey);">
                        <td style="padding: 16px 24px;">
                            <div style="font-weight: 600; color: var(--qed-dark-blue);">${v.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-dim);">${v.city}</div>
                        </td>
                        <td style="padding: 16px 24px;">
                            ${v.contact_email ? `<div style="font-size: 0.85rem;"><i class="fa-solid fa-envelope" style="margin-right: 6px; color: var(--qed-green);"></i> <a href="mailto:${v.contact_email}">${v.contact_email}</a></div>` : '<span class="text-dim">-</span>'}
                            ${v.contact_phone ? `<div style="font-size: 0.85rem; margin-top: 4px;"><i class="fa-solid fa-phone" style="margin-right: 6px; color: var(--qed-green);"></i> ${v.contact_phone}</div>` : ''}
                        </td>
                        <td style="padding: 16px 24px;">
                            <select onchange="updateVenueStatus('${projectId}', '${v.id}', this.value)" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--qed-cold-grey); background: white; font-size: 0.9rem; cursor: pointer;">
                                ${statuses.map(s => `<option value="${s}" ${pv.outreach_status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
                            </select>
                        </td>
                        <td style="padding: 16px 24px; font-size: 0.9rem; color: var(--text-dim);">
                            ${new Date(pv.updated_at || new Date()).toLocaleDateString()}
                        </td>
                        <td style="padding: 16px 24px;">
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-secondary" onclick="aiContextPanel.open('${projectId}', '${v.id}')" style="padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, var(--qed-green) 0%, #2a9d8f 100%); color: white; border: none;" title="AI Description">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                                </button>
                                <button class="btn btn-secondary" onclick="viewVenueDetails('${v.id}')" style="padding: 6px 12px; font-size: 0.8rem;">
                                    Notes
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        tabContentHtml += `</tbody></table></div>`;
    } else if (activeTab === 'documents') {
        if (venuesList.length === 0) {
            tabContentHtml = `
                <div class="card animate-fade" style="text-align: center; padding: 60px;">
                    <i class="fa-solid fa-hotel" style="font-size: 3rem; color: var(--qed-medium-grey); margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No Venues to Include</h3>
                    <p class="text-dim">Add venues to this project first to generate proposals.</p>
                    <button class="btn btn-primary" onclick="state.activeProjectId = '${project.id}'; loadView('venues');" style="width: auto; margin-top: 20px;">Browse Venues</button>
                </div>
            `;
        } else {
            const includedCount = venuesList.filter(pv => pv.include_in_proposal).length;

            tabContentHtml = `
                <div class="card animate-fade" style="padding: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px;">
                        <div>
                            <h2 style="font-size: 1.4rem; color: var(--qed-dark-blue); margin-bottom: 8px;">Venue Proposal</h2>
                            <p class="text-dim">Select which venues to include in the final proposal document</p>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-secondary" onclick="previewProposal('${projectId}')" ${includedCount === 0 ? 'disabled' : ''} style="padding: 10px 20px;">
                                <i class="fa-solid fa-eye" style="margin-right: 8px;"></i> Preview HTML
                            </button>
                            <button class="btn btn-primary" onclick="generateProposalPDF('${projectId}')" ${includedCount === 0 ? 'disabled' : ''} style="padding: 10px 20px;">
                                <i class="fa-solid fa-file-pdf" style="margin-right: 8px;"></i> Generate PDF
                            </button>
                        </div>
                    </div>

                    <div style="background: var(--qed-bg-grey); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-weight: 600; color: var(--qed-dark-blue);">${includedCount} of ${venuesList.length}</span>
                                <span class="text-dim"> venues selected for proposal</span>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <button class="btn btn-secondary" onclick="toggleAllVenuesInProposal(true)" style="padding: 6px 16px; font-size: 0.9rem;">Select All</button>
                                <button class="btn btn-secondary" onclick="toggleAllVenuesInProposal(false)" style="padding: 6px 16px; font-size: 0.9rem;">Deselect All</button>
                            </div>
                        </div>
                    </div>


                    <div class="card" style="overflow: visible;">
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                            <thead>
                                <tr style="text-align: left; font-size: 0.85rem; color: var(--text-dim); border-bottom: 2px solid var(--qed-bg-grey);">
                                    <th style="padding: 16px 24px; width: 50px; border-bottom: 1px solid var(--qed-cold-grey);">
                                        <input type="checkbox" id="select-all-venues" onchange="toggleAllVenuesInProposal(this.checked)" style="width: 18px; height: 18px; accent-color: var(--qed-green); cursor: pointer;">
                                    </th>
                                    <th style="padding: 16px 12px; font-weight: 600; width: 250px; border-bottom: 1px solid var(--qed-cold-grey);">Venue</th>
                                    <th style="padding: 16px 12px; font-weight: 600; width: 120px; border-bottom: 1px solid var(--qed-cold-grey);">Price</th>
                                    <th style="padding: 16px 12px; font-weight: 600; border-bottom: 1px solid var(--qed-cold-grey);">Description Preview</th>
                                    <th style="padding: 16px 24px; font-weight: 600; width: 140px; text-align: right; border-bottom: 1px solid var(--qed-cold-grey);">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            venuesList.forEach(pv => {
                const v = pv.venue;
                const description = pv.final_description || pv.ai_description || v.description_template;
                const descPreview = description ? description.substring(0, 120) + (description.length > 120 ? '...' : '') : '';
                const hasPrice = pv.quoted_price && pv.quoted_price > 0;

                // Determine description source for badge
                let descSourceBadge = '';
                if (pv.final_description) descSourceBadge = '<span title="Custom Edited" style="color: var(--qed-green); font-size: 0.7rem; margin-left: 6px;"><i class="fa-solid fa-pen-fancy"></i></span>';
                else if (pv.ai_description) descSourceBadge = '<span title="AI Generated" style="color: var(--qed-blue); font-size: 0.7rem; margin-left: 6px;"><i class="fa-solid fa-robot"></i></span>';

                tabContentHtml += `
                    <tr style="transition: background 0.2s;">
                        <td style="padding: 16px 24px; border-bottom: 1px solid var(--qed-cold-grey); vertical-align: top;">
                            <input type="checkbox" class="venue-proposal-cb" data-venue-id="${v.id}" ${pv.include_in_proposal ? 'checked' : ''} onchange="toggleVenueInProposal('${projectId}', '${v.id}', this.checked)" style="width: 18px; height: 18px; accent-color: var(--qed-green); cursor: pointer; margin-top: 4px;">
                        </td>
                        <td style="padding: 16px 12px; border-bottom: 1px solid var(--qed-cold-grey); vertical-align: top;">
                            <div style="font-weight: 600; color: var(--qed-dark-blue); margin-bottom: 4px;">${v.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 4px;">${v.city}</div>
                            <span class="status-pill status-${pv.outreach_status}" style="font-size: 0.7rem; padding: 2px 8px;">${pv.outreach_status}</span>
                        </td>
                        <td style="padding: 16px 12px; border-bottom: 1px solid var(--qed-cold-grey); vertical-align: top;">
                            ${hasPrice ?
                        `<div style="font-weight: 600; color: var(--qed-dark-blue);">€${pv.quoted_price.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>` :
                        '<span class="text-dim" style="font-size: 0.9rem;">--</span>'
                    }
                        </td>
                        <td style="padding: 16px 12px; border-bottom: 1px solid var(--qed-cold-grey); vertical-align: top;">
                            ${descPreview ?
                        `<div style="font-size: 0.9rem; color: var(--qed-text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${descPreview} ${descSourceBadge}
                                 </div>` :
                        `<div style="display: flex; align-items: center; gap: 8px; color: var(--qed-orange); font-size: 0.85rem; background: rgba(237, 137, 54, 0.1); padding: 8px; border-radius: 4px;">
                                    <i class="fa-solid fa-exclamation-triangle"></i> Missing description
                                 </div>`
                    }
                        </td>
                        <td style="padding: 16px 24px; border-bottom: 1px solid var(--qed-cold-grey); vertical-align: top; text-align: right;">
                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                <button class="btn btn-secondary" onclick="aiContextPanel.open('${projectId}', '${v.id}')" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; background: ${pv.ai_description ? 'white' : 'linear-gradient(135deg, var(--qed-green) 0%, #2a9d8f 100%)'}; color: ${pv.ai_description ? 'var(--qed-green)' : 'white'}; border: ${pv.ai_description ? '1px solid var(--qed-green)' : 'none'};" title="AI Generate/Regenerate">
                                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                                </button>
                                <button class="btn btn-secondary" onclick="openProjectVenueEditor('${projectId}', '${v.id}')" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center;" title="Edit Details">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tabContentHtml += `
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 24px; padding: 16px; background: rgba(46, 196, 160, 0.1); border-left: 4px solid var(--qed-green); border-radius: 4px;">
                        <p style="font-size: 0.9rem; color: var(--qed-dark-blue); margin-bottom: 4px;"><strong>Tip:</strong> Review venue information before generating</p>
                        <p style="font-size: 0.85rem; color: var(--text-dim);">Make sure all selected venues have descriptions and pricing information for the best proposal quality.</p>
                    </div>
                </div>
            `;
        }
    }

    contentArea.innerHTML = `
        <!-- Stats Row -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
             <!-- ... (Stats cards, using length of venuesList for count) ... -->
             <div class="card" style="padding: 16px; display: flex; align-items: center;">
                <div style="background: rgba(232, 148, 74, 0.1); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fa-solid fa-map-pin" style="color: var(--qed-orange);"></i>
                </div>
                <div>
                    <p class="text-dim" style="font-size: 0.75rem; text-transform: uppercase;">Venues</p>
                    <p style="font-weight: 600;">${venuesList.length} Selected</p>
                </div>
            </div>
             <!-- ... (Other stats placeholders) ... -->
             <div class="card" style="padding: 16px; display: flex; align-items: center;">
                <div style="background: rgba(46, 196, 160, 0.1); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fa-solid fa-check" style="color: var(--qed-green);"></i>
                </div>
                <div>
                    <p class="text-dim" style="font-size: 0.75rem; text-transform: uppercase;">Status</p>
                    <p style="font-weight: 600;">${project.status}</p>
                </div>
            </div>
             <div class="card" style="padding: 16px; display: flex; align-items: center;">
                <div style="background: rgba(59, 159, 216, 0.1); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fa-regular fa-calendar" style="color: var(--qed-ciel);"></i>
                </div>
                <div>
                    <p class="text-dim" style="font-size: 0.75rem; text-transform: uppercase;">Dates</p>
                    <p style="font-weight: 600;">${new Date(project.event_date_start).toLocaleDateString()}</p>
                </div>
            </div>
             <div class="card" style="padding: 16px; display: flex; align-items: center;">
                <div style="background: rgba(27, 43, 75, 0.05); width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <i class="fa-solid fa-file-pdf" style="color: var(--qed-dark-blue);"></i>
                </div>
                <div>
                    <p class="text-dim" style="font-size: 0.75rem; text-transform: uppercase;">Proposal</p>
                    <p style="font-weight: 600;">Not Generated</p>
                </div>
            </div>
        </div>

        <!-- Project Flow Tabs -->
        <div style="border-bottom: 1px solid var(--qed-cold-grey); margin-bottom: 24px; display: flex; gap: 32px;">
            <div onclick="renderProjectDetails('${projectId}', 'selected')" style="padding-bottom: 12px; border-bottom: ${activeTab === 'selected' ? '2px solid var(--qed-green)' : 'none'}; color: ${activeTab === 'selected' ? 'var(--qed-dark-blue)' : 'var(--text-dim)'}; font-weight: 600; cursor: pointer;">Selected Venues (${venuesList.length})</div>
            <div onclick="renderProjectDetails('${projectId}', 'outreach')" style="padding-bottom: 12px; border-bottom: ${activeTab === 'outreach' ? '2px solid var(--qed-green)' : 'none'}; color: ${activeTab === 'outreach' ? 'var(--qed-dark-blue)' : 'var(--text-dim)'}; font-weight: 600; cursor: pointer;">Outreach & Status</div>
            <div onclick="renderProjectDetails('${projectId}', 'documents')" style="padding-bottom: 12px; border-bottom: ${activeTab === 'documents' ? '2px solid var(--qed-green)' : 'none'}; color: ${activeTab === 'documents' ? 'var(--qed-dark-blue)' : 'var(--text-dim)'}; font-weight: 600; cursor: pointer;">Documents</div>
        </div>

        <!-- Content -->
        ${tabContentHtml}
    `;

    // Checkbox Listeners for Selected Tab
    if (activeTab === 'selected' && venuesList.length > 0) {
        document.querySelectorAll('.venue-select-cb').forEach(cb => {
            cb.addEventListener('change', (e) => {
                toggleVenueSelection(e.target.getAttribute('data-id'));
            });
        });
    }
}

// Start the app
init();

async function updateVenueStatus(projectId, venueId, newStatus) {
    const result = await apiCall(`/projects/${projectId}/venues/${venueId}`, 'PATCH', { outreach_status: newStatus });
    if (result) {
        const pv = state.projectVenues.find(pv => pv.venue.id === venueId);
        if (pv) { pv.outreach_status = newStatus; pv.updated_at = new Date().toISOString(); }
        showToast('Status updated to ' + newStatus, 'success');
    }
}
