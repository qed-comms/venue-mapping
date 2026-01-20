
// ============================================================================
// PROPOSAL GENERATION FUNCTIONS
// ============================================================================

async function toggleVenueInProposal(projectId, venueId, include) {
    const result = await apiCall(`/projects/${projectId}/venues/${venueId}`, 'PATCH', {
        include_in_proposal: include
    });

    if (result) {
        // Update local state
        const pv = state.projectVenues.find(pv => pv.venue.id === venueId);
        if (pv) {
            pv.include_in_proposal = include;
        }

        // Re-render to update count
        renderProjectDetails(projectId, 'documents');
    }
}

async function toggleAllVenuesInProposal(include) {
    const projectId = state.currentParams;

    // Update all venues
    const promises = state.projectVenues.map(pv =>
        apiCall(`/projects/${projectId}/venues/${pv.venue.id}`, 'PATCH', {
            include_in_proposal: include
        })
    );

    await Promise.all(promises);

    // Update local state
    state.projectVenues.forEach(pv => {
        pv.include_in_proposal = include;
    });

    // Re-render
    renderProjectDetails(projectId, 'documents');
}

async function previewProposal(projectId) {
    try {
        // Open preview in new window
        const previewUrl = `${API_BASE}/projects/${projectId}/proposal/preview`;
        window.open(previewUrl, '_blank', 'width=1200,height=800');
    } catch (error) {
        console.error('Error opening preview:', error);
        showToast('Failed to open preview', 'error');
    }
}

async function generateProposalPDF(projectId) {
    try {
        // Show loading state
        showToast('Generating PDF...', 'info');

        // Trigger PDF download
        const pdfUrl = `${API_BASE}/projects/${projectId}/proposal/pdf`;
        window.open(pdfUrl, '_blank');

        setTimeout(() => {
            showToast('PDF generated successfully', 'success');
        }, 1000);
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Failed to generate PDF', 'error');
    }
}

// ============================================================================
// PROPOSAL EDITING FUNCTIONS
// ============================================================================

async function openProjectVenueEditor(projectId, venueId) {
    const pv = state.projectVenues.find(p => p.venue.id === venueId);
    if (!pv) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    // Description hierarchy
    const currentDescription = pv.final_description || pv.ai_description || pv.venue.description_template || '';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--qed-cold-grey); padding-bottom: 16px;">
                <h2 style="margin: 0;">Edit Proposal Details</h2>
                <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--qed-cold-grey); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <h3 style="margin-bottom: 20px; color: var(--qed-dark-blue);">${pv.venue.name}</h3>
                
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Quoted Price (€)</label>
                    <input type="number" id="prop-price" value="${pv.quoted_price || ''}" placeholder="e.g. 5000" 
                           style="width: 100%; padding: 10px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md);">
                </div>
                
                <div class="form-group">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                        <label style="font-weight: 500;">Proposal Description</label>
                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.85rem;" 
                                onclick="this.closest('.modal-overlay').remove(); aiContextPanel.open('${projectId}', '${venueId}');">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Use AI Generator
                        </button>
                    </div>
                    <textarea id="prop-desc" rows="12" placeholder="Enter description for proposal..." 
                              style="width: 100%; padding: 12px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); resize: vertical; line-height: 1.5;">${currentDescription}</textarea>
                    
                    <div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-dim);">
                        ${pv.final_description ?
            '<span style="color: var(--qed-green);"><i class="fa-solid fa-check-circle"></i> Using custom edited description</span>' :
            pv.ai_description ?
                '<span style="color: var(--qed-blue);"><i class="fa-solid fa-robot"></i> Using AI generated description</span>' :
                '<span><i class="fa-solid fa-info-circle"></i> Using default venue template</span>'}
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--qed-cold-grey); display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="saveProjectVenueDetails('${projectId}', '${venueId}', this)">
                    <i class="fa-solid fa-save"></i> Save Changes
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

async function saveProjectVenueDetails(projectId, venueId, btn) {
    const modal = btn.closest('.modal-content');
    const priceInput = modal.querySelector('#prop-price');
    const descInput = modal.querySelector('#prop-desc');

    const price = priceInput.value ? parseFloat(priceInput.value) : null;
    const description = descInput.value;

    const result = await apiCall(`/projects/${projectId}/venues/${venueId}`, 'PATCH', {
        quoted_price: price,
        final_description: description
    });

    if (result) {
        showToast('Details updated successfully', 'success');

        // Update local state
        const pv = state.projectVenues.find(p => p.venue.id === venueId);
        if (pv) {
            pv.quoted_price = price;
            pv.final_description = description;
        }

        btn.closest('.modal-overlay').remove();

        // Re-render only if we are on the documents tab
        const activeTab = document.querySelector('.card[onclick*="documents"]').style.borderBottom.includes('solid') ? 'documents' : 'venues';
        if (state.activeView === 'project-details') {
            renderProjectDetails(projectId, 'documents');
        }
    }
}
