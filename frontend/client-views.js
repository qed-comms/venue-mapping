/**
 * Client Management Views
 * Handles listing, details, creation, and editing of clients.
 */

// ============================================================================
// CLIENT LIST VIEW
// ============================================================================

async function renderClientsView() {
    state.currentView = 'clients';
    updateNavigation();

    const clients = await apiCall('/clients');

    let html = `
        <div class="view-header">
            <div>
                <h1>Clients</h1>
                <p class="text-dim">Manage client profiles and AI preferences</p>
            </div>
            <button class="btn btn-primary top-action-btn" onclick="showCreateClientModal()">
                <i class="fa-solid fa-plus"></i> New Client
            </button>
        </div>
    `;

    if (!clients || clients.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fa-solid fa-building-user"></i>
                <h2>No Clients Yet</h2>
                <p>Create client profiles to speed up project creation and train the AI.</p>
                <button class="btn btn-primary" onclick="showCreateClientModal()">Add First Client</button>
            </div>
        `;
    } else {
        html += `
            <div class="card-grid">
                ${clients.map(client => renderClientCard(client)).join('')}
            </div>
        `;
    }

    document.getElementById('content-area').innerHTML = html;
}

function renderClientCard(client) {
    return `
        <div class="card clickable" onclick="renderClientDetails('${client.id}')">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div style="width: 48px; height: 48px; border-radius: 8px; background: var(--qed-bg-grey); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--qed-dark-blue); font-weight: 600;">
                    ${client.logo_url ? `<img src="${client.logo_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : client.name.substring(0, 2).toUpperCase()}
                </div>
                <!-- <span class="badge" style="background: var(--qed-bg-grey);">${client.industry || 'General'}</span> -->
            </div>
            <h3 style="margin-bottom: 4px; color: var(--qed-dark-blue);">${client.name}</h3>
            <p class="text-dim" style="font-size: 0.9rem; margin-bottom: 16px;">${client.industry || 'No industry specified'}</p>
            
            <div style="border-top: 1px solid var(--qed-cold-grey); padding-top: 12px; margin-top: auto;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-dim);">
                    <i class="fa-solid fa-robot" style="color: ${client.brand_tone ? 'var(--qed-blue)' : 'var(--qed-medium-grey)'}"></i>
                    ${client.brand_tone ? 'AI Standard Configured' : 'No AI Context'}
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// CLIENT DETAIL VIEW
// ============================================================================

async function renderClientDetails(clientId) {
    const client = await apiCall(`/clients/${clientId}`);
    if (!client) return;

    state.currentView = 'client-details';
    // We don't update nav here to keep 'clients' highlighted or handle breadcrumbs manually

    const html = `
        <div class="view-header">
            <div>
                <button class="btn btn-secondary btn-sm" onclick="renderClientsView()" style="margin-bottom: 12px;">
                    <i class="fa-solid fa-arrow-left"></i> Back to Clients
                </button>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 64px; height: 64px; border-radius: 12px; background: var(--qed-bg-grey); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--qed-dark-blue); font-weight: 600;">
                        ${client.logo_url ? `<img src="${client.logo_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">` : client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1>${client.name}</h1>
                        <p class="text-dim">${client.industry || ''} ${client.website ? `• <a href="${client.website}" target="_blank">${client.website}</a>` : ''}</p>
                    </div>
                </div>
            </div>
            <div style="display:flex; gap: 8px;">
                 <button class="btn btn-secondary" onclick="showEditClientModal('${client.id}')">
                    <i class="fa-solid fa-pen"></i> Edit Profile
                </button>
                <button class="btn btn-danger" onclick="deleteClient('${client.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <!-- Left Column: AI & Preferences -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-wand-magic-sparkles" style="color: var(--qed-blue);"></i> AI Context Engine</h3>
                    </div>
                    <div class="card-body">
                        <div style="margin-bottom: 24px;">
                            <label class="info-label">Brand Tone of Voice</label>
                            <p class="info-value">${client.brand_tone || '<span class="text-dim">Not configured</span>'}</p>
                        </div>
                        <div>
                            <label class="info-label">Description Instructions</label>
                            <div class="info-value" style="white-space: pre-wrap;">${client.description_preferences || '<span class="text-dim">No specific instructions. AI will use default professional tone.</span>'}</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fa-solid fa-clipboard-list"></i> Standard Requirements</h3>
                    </div>
                    <div class="card-body">
                        ${renderStandardRequirements(client.standard_requirements)}
                    </div>
                </div>
            </div>

            <!-- Right Column: Projects & Notes -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div class="card">
                    <h3>Internal Notes</h3>
                    <p style="white-space: pre-wrap; margin-top: 12px; color: var(--qed-text-secondary);">${client.notes || 'No notes added.'}</p>
                </div>
                
                <div class="card">
                    <h3>Recent Projects</h3>
                    <p class="text-dim" style="margin-top:12px;">Projects list coming soon...</p>
                    <!-- TODO: Fetch projects for this client -->
                </div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

function renderStandardRequirements(reqs) {
    if (!reqs || Object.keys(reqs).length === 0) return '<p class="text-dim">No standard requirements set.</p>';

    // Simple key-value display for JSON
    return Object.entries(reqs).map(([key, val]) => `
        <div style="margin-bottom: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid var(--qed-bg-grey); padding-bottom: 8px;">
            <span style="font-weight: 500; text-transform: capitalize;">${key.replace(/_/g, ' ')}</span>
            <span class="text-dim">${val}</span>
        </div>
    `).join('');
}

// ============================================================================
// MODALS
// ============================================================================

function showCreateClientModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>New Client</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-times"></i></button>
            </div>
            <form onsubmit="handleCreateClient(event)">
                <div class="form-group">
                    <label>Client Name *</label>
                    <input type="text" name="name" required placeholder="e.g. TechCorp Inc.">
                </div>
                <div class="form-group grid-2">
                    <div>
                        <label>Industry</label>
                        <input type="text" name="industry" placeholder="e.g. Technology">
                    </div>
                    <div>
                        <label>Website</label>
                        <input type="url" name="website" placeholder="https://...">
                    </div>
                </div>
                
                <div class="divider">AI Configuration</div>
                
                <div class="form-group">
                    <label>Brand Tone</label>
                    <input type="text" name="brand_tone" placeholder="e.g. Professional, innovative, eco-conscious">
                    <small class="text-dim">Keywords that describe how the AI should write.</small>
                </div>
                
                <div class="form-group">
                    <label>Description Preferences</label>
                    <textarea name="description_preferences" rows="4" placeholder="e.g. Always emphasize sustainability. Avoid using 'cheap'. Focus on modern amenities."></textarea>
                    <small class="text-dim">Specific instructions for the venue description generator.</small>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Client</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

async function handleCreateClient(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const client = await apiCall('/clients', 'POST', data);
        if (client) {
            showToast('Client created successfully', 'success');
            e.target.closest('.modal-overlay').remove();
            renderClientsView();
        }
    } catch (error) {
        showToast(error.message || 'Failed to create client', 'error');
    }
}

async function showEditClientModal(clientId) {
    const client = await apiCall(`/clients/${clientId}`);
    if (!client) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Client</h2>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-times"></i></button>
            </div>
            <form onsubmit="handleUpdateClient(event, '${clientId}')">
                <div class="form-group">
                    <label>Client Name *</label>
                    <input type="text" name="name" required value="${client.name}">
                </div>
                <div class="form-group grid-2">
                    <div>
                        <label>Industry</label>
                        <input type="text" name="industry" value="${client.industry || ''}">
                    </div>
                    <div>
                        <label>Website</label>
                        <input type="url" name="website" value="${client.website || ''}">
                    </div>
                </div>
                
                <div class="divider">AI Configuration</div>
                <div class="form-group">
                    <label>Brand Tone</label>
                    <input type="text" name="brand_tone" value="${client.brand_tone || ''}">
                </div>
                <div class="form-group">
                    <label>Description Preferences</label>
                    <textarea name="description_preferences" rows="4">${client.description_preferences || ''}</textarea>
                </div>
                 <div class="form-group">
                    <label>Internal Notes</label>
                    <textarea name="notes" rows="3">${client.notes || ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

async function handleUpdateClient(e, clientId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const client = await apiCall(`/clients/${clientId}`, 'PATCH', data);
        if (client) {
            showToast('Client updated', 'success');
            e.target.closest('.modal-overlay').remove();
            renderClientDetails(clientId);
        }
    } catch (error) {
        showToast('Failed to update client', 'error');
    }
}

async function deleteClient(clientId) {
    if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;

    const result = await apiCall(`/clients/${clientId}`, 'DELETE');
    if (result === null) { // 204 returns null usually with our api wrapper if successful
        showToast('Client deleted', 'success');
        renderClientsView();
    }
}
