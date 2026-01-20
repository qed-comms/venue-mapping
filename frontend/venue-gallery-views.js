/**
 * Venue Gallery Views
 * Handles rendering of both Global and Project-specific venue galleries
 */

// ============================================================================
// GLOBAL VENUE GALLERY (Standalone Tab)
// ============================================================================

// State for gallery view
let galleryViewMode = localStorage.getItem('galleryViewMode') || 'card'; // 'card' or 'list'
let galleryFilters = {
    city: '',
    minCapacity: '',
    facilities: [],
    eventTypes: []
};

async function renderGlobalVenueGallery() {
    try {
        console.log('renderGlobalVenueGallery: Starting...');
        const response = await apiCall('/venues');
        console.log('renderGlobalVenueGallery: API response:', response);

        // Extract venues array from paginated response
        const venues = response?.items || [];
        console.log('renderGlobalVenueGallery: Venues array:', venues);

        // Fetch project venues if in project context
        let projectVenueIds = new Set();
        let currentProject = null;
        if (state.activeProjectId) {
            try {
                const projectVenues = await apiCall(`/projects/${state.activeProjectId}/venues`);
                projectVenueIds = new Set(projectVenues.map(pv => pv.venue.id));
                currentProject = state.projects.find(p => p.id === state.activeProjectId);
            } catch (error) {
                console.error('Error fetching project venues:', error);
            }
        }

        // Apply filters
        const filteredVenues = filterVenues(venues || []);

        // Get unique cities and facilities for filter dropdowns
        const cities = [...new Set((venues || []).map(v => v.city))].sort();
        const allFacilities = [...new Set((venues || []).flatMap(v => v.facilities || []))].sort();
        const allEventTypes = [...new Set((venues || []).flatMap(v => v.event_types || []))].sort();

        const html = `
            <div class="venue-gallery-header" style="margin-bottom: 32px;">
                ${state.activeProjectId && currentProject ? `
                    <!-- Breadcrumbs and Back Button -->
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <button onclick="loadView('project-details', '${state.activeProjectId}')" class="btn btn-secondary" style="width: auto; padding: 8px 16px; font-size: 0.9rem;">
                                <i class="fa-solid fa-arrow-left" style="margin-right: 6px;"></i> Back to Project
                            </button>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem; color: var(--qed-text-secondary);">
                            <a href="#" onclick="event.preventDefault(); loadView('project-details', '${state.activeProjectId}');" style="color: var(--qed-green); text-decoration: none; font-weight: 500;">
                                ${currentProject.event_name}
                            </a>
                            <i class="fa-solid fa-chevron-right" style="font-size: 0.75rem;"></i>
                            <span style="color: var(--qed-dark-blue); font-weight: 600;">Find Venues</span>
                        </div>
                    </div>
                    
                    <!-- Project Selection Mode Banner -->
                    <div style="background: linear-gradient(135deg, var(--qed-green) 0%, var(--qed-turquoise) 100%); color: white; padding: 16px 24px; border-radius: var(--radius-lg); margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 4px;">
                                <i class="fa-solid fa-info-circle" style="margin-right: 6px;"></i> Adding venues to project
                            </div>
                            <div style="font-size: 1.1rem; font-weight: 600;">
                                Click "Add to Project" on any venue card to add it
                            </div>
                        </div>
                        <button onclick="loadView('project-details', '${state.activeProjectId}')" class="btn btn-secondary" style="width: auto; padding: 8px 16px; background: white; color: var(--qed-dark-blue); border: none;">
                            <i class="fa-solid fa-check" style="margin-right: 6px;"></i> Done
                        </button>
                    </div>
                ` : ''}
                <!-- Top Row: Title and Actions -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 style="margin-bottom: 8px; font-size: 2rem;">${state.activeProjectId && currentProject ? `Find a venue for "${currentProject.event_name}"` : 'Venue Gallery'}</h1>
                        <p class="text-dim">Browsing ${filteredVenues.length} of ${venues ? venues.length : 0} venues</p>
                    </div>
                    ${!state.activeProjectId ? `
                        <div class="action-buttons" style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <!-- View Toggle (Icon Only) -->
                            <div style="display: flex; gap: 6px;">
                                <button id="view-card-btn" class="view-toggle-btn ${galleryViewMode === 'card' ? 'active' : ''}" title="Card View">
                                    <i class="fa-solid fa-th"></i>
                                </button>
                                <button id="view-list-btn" class="view-toggle-btn ${galleryViewMode === 'list' ? 'active' : ''}" title="List View">
                                    <i class="fa-solid fa-list"></i>
                                </button>
                            </div>
                            
                            <button id="add-venue-btn" class="btn btn-primary" style="width: auto; padding: 10px 20px;">
                                <i class="fa-solid fa-plus" style="margin-right: 6px;"></i><span>Add Venue</span>
                            </button>
                            <button id="upload-csv-btn" class="btn btn-secondary" style="width: auto; padding: 10px 20px;">
                                <i class="fa-solid fa-upload" style="margin-right: 6px;"></i><span>Upload CSV</span>
                            </button>
                            <button id="download-template-btn" class="btn btn-secondary" style="width: auto; padding: 10px 20px;">
                                <i class="fa-solid fa-download" style="margin-right: 6px;"></i><span>Template</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Filters Row -->
                <div class="filters-row" style="display: flex; gap: 12px; align-items: end; padding: 20px; background: var(--qed-bg-grey); border-radius: var(--radius-lg); border: 1px solid var(--qed-cold-grey); flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--qed-text-secondary); margin-bottom: 6px;">City</label>
                        <select id="filter-city" style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); background: white; font-size: 0.9rem;">
                            <option value="">All Cities</option>
                            ${cities.map(city => `<option value="${city}" ${galleryFilters.city === city ? 'selected' : ''}>${city}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--qed-text-secondary); margin-bottom: 6px;">Min. Capacity</label>
                        <input type="number" id="filter-capacity" placeholder="e.g. 100" value="${galleryFilters.minCapacity}" style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                    </div>
                    
                    <div style="flex: 2; min-width: 200px;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--qed-text-secondary); margin-bottom: 6px;">Facilities</label>
                        <div class="multi-select-wrapper" data-filter="facilities">
                            <div class="multi-select-trigger" id="facilities-trigger">
                                ${galleryFilters.facilities.length > 0
                ? `<div class="multi-select-values">
                                        ${galleryFilters.facilities.map(f => `
                                            <span class="multi-select-tag">
                                                ${f}
                                                <span class="multi-select-tag-remove" data-value="${f}">×</span>
                                            </span>
                                        `).join('')}
                                       </div>`
                : '<span class="multi-select-placeholder">Select facilities...</span>'}
                                <i class="fa-solid fa-chevron-down" style="color: var(--qed-text-secondary); font-size: 0.8rem;"></i>
                            </div>
                            <div class="multi-select-dropdown" id="facilities-dropdown">
                                ${allFacilities.map(facility => `
                                    <div class="multi-select-option ${galleryFilters.facilities.includes(facility) ? 'selected' : ''}" data-value="${facility}">
                                        <div class="multi-select-checkbox">
                                            ${galleryFilters.facilities.includes(facility) ? '<i class="fa-solid fa-check"></i>' : ''}
                                        </div>
                                        <span>${facility}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div style="flex: 2; min-width: 200px;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--qed-text-secondary); margin-bottom: 6px;">Event Types</label>
                        <div class="multi-select-wrapper" data-filter="eventTypes">
                            <div class="multi-select-trigger" id="event-types-trigger">
                                ${galleryFilters.eventTypes.length > 0
                ? `<div class="multi-select-values">
                                        ${galleryFilters.eventTypes.map(t => `
                                            <span class="multi-select-tag">
                                                ${t}
                                                <span class="multi-select-tag-remove" data-value="${t}">×</span>
                                            </span>
                                        `).join('')}
                                       </div>`
                : '<span class="multi-select-placeholder">Select event types...</span>'}
                                <i class="fa-solid fa-chevron-down" style="color: var(--qed-text-secondary); font-size: 0.8rem;"></i>
                            </div>
                            <div class="multi-select-dropdown" id="event-types-dropdown">
                                ${allEventTypes.map(type => `
                                    <div class="multi-select-option ${galleryFilters.eventTypes.includes(type) ? 'selected' : ''}" data-value="${type}">
                                        <div class="multi-select-checkbox">
                                            ${galleryFilters.eventTypes.includes(type) ? '<i class="fa-solid fa-check"></i>' : ''}
                                        </div>
                                        <span>${type}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <button id="clear-filters-btn" class="btn btn-secondary" style="width: auto; padding: 10px 20px; align-self: flex-end;">
                        <i class="fa-solid fa-filter-circle-xmark"></i> Clear
                    </button>
                </div>
            </div>
            
            <div id="venue-container">
                ${galleryViewMode === 'card'
                ? renderVenueCards(filteredVenues, projectVenueIds)
                : renderVenueList(filteredVenues, projectVenueIds)}
            </div>
        `;

        console.log('renderGlobalVenueGallery: Setting HTML...');
        document.getElementById('content-area').innerHTML = html;

        // Attach event listeners
        console.log('renderGlobalVenueGallery: Attaching listeners...');
        attachVenueUploadListeners();
        attachFilterListeners();
        attachViewToggleListeners();
        console.log('renderGlobalVenueGallery: Complete!');
    } catch (error) {
        console.error('renderGlobalVenueGallery: Error:', error);
        document.getElementById('content-area').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fa-solid fa-exclamation-triangle" style="font-size: 3rem; color: var(--qed-red); margin-bottom: 20px;"></i>
                <h3>Error Loading Venue Gallery</h3>
                <p class="text-dim">${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">Reload Page</button>
            </div>
        `;
    }
}

function filterVenues(venues) {
    return venues.filter(venue => {
        // City filter
        if (galleryFilters.city && venue.city !== galleryFilters.city) {
            return false;
        }

        // Capacity filter
        if (galleryFilters.minCapacity && venue.capacity < parseInt(galleryFilters.minCapacity)) {
            return false;
        }

        // Facilities filter (venue must have ALL selected facilities)
        if (galleryFilters.facilities.length > 0) {
            const venueFacilities = venue.facilities || [];
            if (!galleryFilters.facilities.every(f => venueFacilities.includes(f))) {
                return false;
            }
        }

        // Event types filter (venue must have at least ONE selected event type)
        if (galleryFilters.eventTypes.length > 0) {
            const venueEventTypes = venue.event_types || [];
            if (!galleryFilters.eventTypes.some(t => venueEventTypes.includes(t))) {
                return false;
            }
        }

        return true;
    });
}

function renderVenueCards(venues, projectVenueIds = new Set()) {
    if (venues.length === 0) {
        return '<p class="text-dim" style="text-align: center; padding: 40px;">No venues match your filters. Try adjusting your criteria.</p>';
    }

    return `
        <div class="venue-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
            ${venues.map(venue => renderGlobalVenueCard(venue, projectVenueIds)).join('')}
        </div>
    `;
}

function renderVenueList(venues, projectVenueIds = new Set()) {
    if (venues.length === 0) {
        return '<p class="text-dim" style="text-align: center; padding: 40px;">No venues match your filters. Try adjusting your criteria.</p>';
    }

    return `
        <div class="card" style="overflow: hidden;">
            ${venues.map(venue => renderGlobalVenueListItem(venue, projectVenueIds)).join('')}
        </div>
    `;
}

function renderGlobalVenueListItem(venue, projectVenueIds = new Set()) {
    const photoUrl = venue.photos && venue.photos.length > 0
        ? venue.photos[0].url
        : 'https://via.placeholder.com/80x80?text=No+Image';

    const facilities = venue.facilities && venue.facilities.length > 0
        ? venue.facilities.slice(0, 5).join(' • ')
        : 'No facilities';

    const isAdded = projectVenueIds.has(venue.id);

    return `
        <div style="display: flex; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--qed-cold-grey); transition: background 0.2s;" onmouseover="this.style.background='var(--qed-bg-grey)'" onmouseout="this.style.background='white'">
            <!-- Photo -->
            <div style="width: 80px; height: 80px; border-radius: 8px; background-image: url('${photoUrl}'); background-size: cover; background-position: center; flex-shrink: 0; margin-right: 20px;"></div>
            
            <!-- Info -->
            <div style="flex: 1;">
                <h3 style="margin-bottom: 6px; color: var(--qed-dark-blue); font-size: 1.1rem;">${venue.name}</h3>
                <div style="display: flex; gap: 20px; margin-bottom: 8px; color: var(--qed-text-secondary); font-size: 0.9rem;">
                    <span><i class="fa-solid fa-location-dot" style="color: var(--qed-green); margin-right: 6px;"></i>${venue.city}</span>
                    <span><i class="fa-solid fa-users" style="color: var(--qed-green); margin-right: 6px;"></i>${venue.capacity} people</span>
                </div>
                <p class="text-dim" style="font-size: 0.85rem;">${facilities}</p>
            </div>
            
            <!-- Contact Info -->
            <div style="flex: 1; margin: 0 20px;">
                ${venue.contact_email ? `<p class="text-dim" style="font-size: 0.85rem; margin-bottom: 4px;"><i class="fa-solid fa-envelope" style="margin-right: 6px;"></i>${venue.contact_email}</p>` : ''}
                ${venue.website ? `<p class="text-dim" style="font-size: 0.85rem;"><i class="fa-solid fa-globe" style="margin-right: 6px;"></i><a href="${venue.website}" target="_blank" style="color: var(--qed-green);">Website</a></p>` : ''}
            </div>
            
            <!-- Actions -->
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                ${state.activeProjectId && isAdded ? `
                    <button class="btn" style="padding: 10px 12px; font-size: 1rem; background: var(--qed-green); color: white; border: 2px solid var(--qed-green); cursor: pointer; border-radius: 8px;" onclick="removeVenueFromProject('${state.activeProjectId}', '${venue.id}')" title="Added - Click to Remove">
                        <i class="fa-solid fa-check"></i>
                    </button>
                ` : state.activeProjectId ? `
                    <button id="add-btn-list-${venue.id}" class="btn btn-primary" style="padding: 10px 12px; font-size: 1rem; background: white; color: var(--qed-green); border: 2px solid var(--qed-green); border-radius: 8px;" onclick="addVenueToProject('${venue.id}', '${state.activeProjectId}')" title="Add to Project">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                ` : `
                    <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.9rem;" onclick="viewVenueDetails('${venue.id}')">
                        View Details
                    </button>
                    <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.9rem;" onclick="editVenue('${venue.id}')">
                        Edit
                    </button>
                `}
            </div>
        </div>
    `;
}

function renderGlobalVenueCard(venue, projectVenueIds = new Set()) {
    const photoUrl = venue.photos && venue.photos.length > 0
        ? venue.photos[0].url
        : 'https://via.placeholder.com/400x240?text=No+Image';

    const facilities = venue.facilities && venue.facilities.length > 0
        ? venue.facilities.slice(0, 4).map(f => `<span class="facility-tag">${f}</span>`).join(' ')
        : '<span class="text-dim">No facilities listed</span>';

    const eventTypes = venue.event_types && venue.event_types.length > 0
        ? venue.event_types.join(', ')
        : 'Not specified';

    const isAdded = projectVenueIds.has(venue.id);

    return `
        <div class="card venue-card-global">
            <div class="card-img" style="background-image: url('${photoUrl}'); height: 200px;"></div>
            <div class="card-body">
                <h3 style="margin-bottom: 12px; color: var(--qed-dark-blue);">${venue.name}</h3>
                
                <div style="display: flex; gap: 16px; margin-bottom: 12px; color: var(--qed-text-secondary); font-size: 0.9rem;">
                    <span><i class="fa-solid fa-location-dot" style="color: var(--qed-green);"></i> ${venue.city}</span>
                    <span><i class="fa-solid fa-users" style="color: var(--qed-green);"></i> ${venue.capacity} people</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    ${facilities}
                </div>
                
                <p class="text-dim" style="font-size: 0.85rem; margin-bottom: 12px;">
                    <strong>Events:</strong> ${eventTypes}
                </p>
                
                ${venue.contact_email ? `
                    <p class="text-dim" style="font-size: 0.85rem; margin-bottom: 4px;">
                        <i class="fa-solid fa-envelope"></i> ${venue.contact_email}
                    </p>
                ` : ''}
                
                ${venue.website ? `
                    <p class="text-dim" style="font-size: 0.85rem; margin-bottom: 16px;">
                        <i class="fa-solid fa-globe"></i> <a href="${venue.website}" target="_blank" style="color: var(--qed-green);">${venue.website}</a>
                    </p>
                ` : ''}
                
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    ${state.activeProjectId && isAdded ? `
                        <button class="btn" style="flex: 1; padding: 10px 12px; background: var(--qed-green); color: white; border: 2px solid var(--qed-green); cursor: pointer; border-radius: 8px;" onclick="removeVenueFromProject('${state.activeProjectId}', '${venue.id}')" title="Added - Click to Remove">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button class="btn btn-secondary" style="padding: 10px 12px;" onclick="viewVenueDetails('${venue.id}')">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    ` : state.activeProjectId ? `
                        <button id="add-btn-card-${venue.id}" class="btn btn-primary" style="flex: 1; padding: 10px 12px; background: white; color: var(--qed-green); border: 2px solid var(--qed-green); border-radius: 8px;" onclick="addVenueToProject('${venue.id}', '${state.activeProjectId}')" title="Add to Project">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button class="btn btn-secondary" style="padding: 10px 12px;" onclick="viewVenueDetails('${venue.id}')">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    ` : `
                        <button class="btn btn-primary" style="flex: 1; padding: 8px 16px;" onclick="viewVenueDetails('${venue.id}')">
                            View Details
                        </button>
                        <button class="btn btn-secondary" style="flex: 1; padding: 8px 16px;" onclick="editVenue('${venue.id}')">
                            Edit
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// PROJECT VENUE GALLERY (Inside a Project)
// ============================================================================

async function loadProjectVenues(projectId) {
    const venues = await apiCall(`/projects/${projectId}/venues`);
    if (venues) {
        state.projectVenues = venues;
    }
}

async function renderProjectVenueGallery(projectId) {
    const project = await apiCall(`/projects/${projectId}`);
    const projectVenues = await apiCall(`/projects/${projectId}/venues`);

    if (!project) {
        document.getElementById('content-area').innerHTML = '<p>Project not found</p>';
        return;
    }

    const html = `
        <div class="project-venue-header" style="margin-bottom: 32px;">
            <button onclick="loadView('project-detail', '${projectId}')" class="btn btn-secondary" style="width: auto; padding: 8px 16px; margin-bottom: 16px;">
                <i class="fa-solid fa-arrow-left"></i> Back to Project
            </button>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 style="margin-bottom: 8px;">${project.event_name} - Venues</h1>
                    <p class="text-dim">${projectVenues ? projectVenues.length : 0} venues added to this project</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button id="add-from-db-btn" class="btn btn-primary" style="width: auto; padding: 10px 20px;" onclick="showAddVenueModal('${projectId}')">
                        <i class="fa-solid fa-database"></i> Add from Database
                    </button>
                    <button id="create-new-venue-btn" class="btn btn-secondary" style="width: auto; padding: 10px 20px;" onclick="createNewVenueForProject('${projectId}')">
                        <i class="fa-solid fa-plus"></i> Create New
                    </button>
                    <button id="generate-proposals-btn" class="btn btn-secondary" style="width: auto; padding: 10px 20px;" onclick="generateProposalsForProject('${projectId}')">
                        <i class="fa-solid fa-file-pdf"></i> Generate Proposals
                    </button>
                </div>
            </div>
        </div>
        
        <div class="project-venue-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 20px;">
            ${projectVenues && projectVenues.length > 0
            ? projectVenues.map(pv => renderProjectVenueCard(pv, projectId)).join('')
            : '<p class="text-dim">No venues added to this project yet. Browse the venue database to add some.</p>'}
        </div>
    `;

    document.getElementById('content-area').innerHTML = html;
}

function renderProjectVenueCard(projectVenue, projectId) {
    const venue = projectVenue.venue;
    const photoUrl = venue.photos && venue.photos.length > 0
        ? `${API_BASE}/venues/${venue.id}/photos/${venue.photos[0].id}`
        : 'https://via.placeholder.com/100x100?text=No+Image';

    const topFacilities = venue.facilities && venue.facilities.length > 0
        ? venue.facilities.slice(0, 3).join(' • ')
        : 'No facilities';

    const statusBadge = getStatusBadge(projectVenue.outreach_status);

    return `
        <div class="card project-venue-card" style="padding: 0;">
            <div style="display: flex; gap: 20px; padding: 20px;">
                <!-- Venue Photo -->
                <div style="flex-shrink: 0;">
                    <div style="width: 120px; height: 120px; border-radius: 8px; background-image: url('${photoUrl}'); background-size: cover; background-position: center;"></div>
                </div>
                
                <!-- Venue Info -->
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: var(--qed-dark-blue);">${venue.name}</h3>
                        ${statusBadge}
                    </div>
                    
                    <div style="display: flex; gap: 16px; margin-bottom: 8px; color: var(--qed-text-secondary); font-size: 0.9rem;">
                        <span><i class="fa-solid fa-location-dot" style="color: var(--qed-green);"></i> ${venue.city}</span>
                        <span><i class="fa-solid fa-users" style="color: var(--qed-green);"></i> ${venue.capacity} people</span>
                    </div>
                    
                    <p class="text-dim" style="font-size: 0.85rem; margin-bottom: 16px;">
                        ${topFacilities}
                    </p>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" style="flex: 1; padding: 8px 16px; font-size: 0.9rem;" onclick="generateProposal('${projectId}', '${venue.id}')">
                            <i class="fa-solid fa-file-pdf"></i> Generate Proposal
                        </button>
                        <button class="btn" style="flex: 1; padding: 8px 16px; font-size: 0.9rem; background: transparent; border: 2px solid var(--qed-red); color: var(--qed-red);" onclick="removeVenueFromProject('${projectId}', '${venue.id}')">
                            <i class="fa-solid fa-trash"></i> Remove from Project
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    const statusConfig = {
        draft: { label: 'DRAFT', color: '#718096', bg: '#E2E8F0' },
        sent: { label: 'SENT', color: '#1E40AF', bg: '#DBEAFE' },
        awaiting: { label: 'PENDING', color: '#1E40AF', bg: '#DBEAFE' },
        responded: { label: 'CONFIRMED', color: '#047857', bg: 'rgba(46, 196, 160, 0.15)' },
        declined: { label: 'DECLINED', color: '#B91C1C', bg: '#FEE2E2' }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return `
        <span class="status-pill" style="
            background-color: ${config.bg};
            color: ${config.color};
            border: 1px solid ${config.color}40;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        ">
            ${config.label}
        </span>
    `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function viewVenueDetails(venueId) {
    try {
        // Fetch full venue details
        const venue = await apiCall(`/venues/${venueId}`);

        if (!venue) {
            alert('Venue not found');
            return;
        }

        // Build photo gallery HTML
        let photosHTML = '';
        if (venue.photos && venue.photos.length > 0) {
            photosHTML = `
                <div style="margin-bottom: 24px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                        ${venue.photos.map((photo, index) => `
                            <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; aspect-ratio: 4/3;">
                                <img src="${photo.url}" 
                                     alt="${photo.caption || venue.name}" 
                                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                                     onclick="openPhotoGallery('${venueId}', ${index})">
                                ${photo.caption ? `<div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 8px 12px; color: white; font-size: 0.85rem;">${photo.caption}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            photosHTML = '<p class="text-dim" style="text-align: center; padding: 40px;">No photos available</p>';
        }

        // Build facilities HTML
        const facilitiesHTML = venue.facilities && venue.facilities.length > 0
            ? venue.facilities.map(f => `<span class="badge" style="background: var(--qed-bg-grey); color: var(--qed-navy); padding: 4px 12px; border-radius: var(--radius-pill); font-size: 0.85rem; margin-right: 6px; margin-bottom: 6px; display: inline-block;">${f}</span>`).join('')
            : '<span class="text-dim">None specified</span>';

        // Build event types HTML
        const eventTypesHTML = venue.event_types && venue.event_types.length > 0
            ? venue.event_types.map(t => `<span class="badge" style="background: var(--qed-green); color: white; padding: 4px 12px; border-radius: var(--radius-pill); font-size: 0.85rem; margin-right: 6px; margin-bottom: 6px; display: inline-block;">${t}</span>`).join('')
            : '<span class="text-dim">None specified</span>';

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; position: sticky; top: 0; background: white; padding-bottom: 16px; border-bottom: 1px solid var(--qed-cold-grey); z-index: 10;">
                    <div>
                        <h2 style="margin-bottom: 8px;">${venue.name}</h2>
                        <div style="display: flex; gap: 16px; color: var(--qed-text-secondary); font-size: 0.95rem;">
                            <span><i class="fa-solid fa-location-dot" style="color: var(--qed-green); margin-right: 6px;"></i>${venue.city}</span>
                            <span><i class="fa-solid fa-users" style="color: var(--qed-green); margin-right: 6px;"></i>${venue.capacity} people</span>
                        </div>
                    </div>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--qed-cold-grey); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <!-- Photos -->
                <div style="margin-bottom: 32px;">
                    <h3 style="margin-bottom: 16px; font-size: 1.1rem;">Photos</h3>
                    ${photosHTML}
                </div>

                <!-- Details Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 32px;">
                    <!-- Location -->
                    <div>
                        <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--qed-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Location</h4>
                        <p style="margin-bottom: 4px;"><strong>Address:</strong> ${venue.address || 'Not specified'}</p>
                        <p><strong>City:</strong> ${venue.city}</p>
                    </div>

                    <!-- Capacity -->
                    <div>
                        <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--qed-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Capacity</h4>
                        <p style="font-size: 1.5rem; font-weight: 600; color: var(--qed-green);">${venue.capacity}</p>
                        <p class="text-dim" style="font-size: 0.85rem;">Maximum attendees</p>
                    </div>

                    <!-- Contact -->
                    <div>
                        <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--qed-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Contact</h4>
                        ${venue.contact_name ? `<p style="margin-bottom: 4px;"><strong>Name:</strong> ${venue.contact_name}</p>` : ''}
                        ${venue.contact_email ? `<p style="margin-bottom: 4px;"><i class="fa-solid fa-envelope" style="margin-right: 6px; color: var(--qed-green);"></i><a href="mailto:${venue.contact_email}" style="color: var(--qed-green);">${venue.contact_email}</a></p>` : ''}
                        ${venue.contact_phone ? `<p style="margin-bottom: 4px;"><i class="fa-solid fa-phone" style="margin-right: 6px; color: var(--qed-green);"></i>${venue.contact_phone}</p>` : ''}
                        ${venue.website ? `<p><i class="fa-solid fa-globe" style="margin-right: 6px; color: var(--qed-green);"></i><a href="${venue.website}" target="_blank" style="color: var(--qed-green);">Visit Website</a></p>` : ''}
                        ${!venue.contact_name && !venue.contact_email && !venue.contact_phone && !venue.website ? '<span class="text-dim">No contact information</span>' : ''}
                    </div>
                </div>

                <!-- Facilities -->
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--qed-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Facilities</h4>
                    <div>${facilitiesHTML}</div>
                </div>

                <!-- Event Types -->
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--qed-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Event Types</h4>
                    <div>${eventTypesHTML}</div>
                </div>

                <!-- Description -->
                ${venue.description_template ? `
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--qed-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Description</h4>
                        <p style="line-height: 1.6; color: var(--qed-text-primary);">${venue.description_template}</p>
                    </div>
                ` : ''}

                <!-- Notes (Internal) -->
                ${venue.notes ? `
                    <div style="margin-bottom: 24px; padding: 16px; background: var(--qed-bg-grey); border-radius: var(--radius-md); border-left: 4px solid var(--qed-green);">
                        <h4 style="margin-bottom: 8px; font-size: 0.95rem; color: var(--qed-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Internal Notes</h4>
                        <p style="line-height: 1.6; color: var(--qed-text-primary);">${venue.notes}</p>
                    </div>
                ` : ''}

                <!-- Actions -->
                <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 24px; border-top: 1px solid var(--qed-cold-grey);">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); editVenue('${venue.id}')">
                        <i class="fa-solid fa-edit" style="margin-right: 6px;"></i> Edit Venue
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

    } catch (error) {
        console.error('Error loading venue details:', error);
        alert('Failed to load venue details. Please try again.');
    }
}

async function editVenue(venueId) {
    try {
        // Fetch current venue data
        const venue = await apiCall(`/venues/${venueId}`);

        if (!venue) {
            alert('Venue not found');
            return;
        }

        // Predefined options for facilities and event types
        const allFacilities = [
            'WiFi', 'Projector', 'Microphone', 'Sound System', 'Stage', 'Parking',
            'Catering Kitchen', 'Bar', 'Air Conditioning', 'Heating', 'Wheelchair Access',
            'AV equipment', 'Breakout Rooms', 'Natural Light', 'Outdoor Space', 'Ample Space',
            'Air Conditioning', 'Parking', 'Catering Services', 'Marina View'
        ];

        const allEventTypes = [
            'Conference', 'Workshop', 'Seminar', 'Training', 'Meeting', 'Networking',
            'Product Launch', 'Team Building', 'Gala', 'Reception', 'Exhibition',
            'Conferences', 'Board meetings', 'Workshops', 'Exhibitions'
        ];

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; position: sticky; top: 0; background: white; padding-bottom: 16px; border-bottom: 1px solid var(--qed-cold-grey); z-index: 10;">
                    <h2>Edit Venue</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()" style="width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--qed-cold-grey); background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <form id="edit-venue-form">
                    <!-- Basic Information -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="margin-bottom: 16px; font-size: 1.1rem; color: var(--qed-navy);">Basic Information</h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Venue Name *</label>
                                <input type="text" id="edit-name" value="${venue.name}" required
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">City *</label>
                                <input type="text" id="edit-city" value="${venue.city}" required
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Capacity *</label>
                                <input type="number" id="edit-capacity" value="${venue.capacity}" required min="1"
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Address</label>
                                <input type="text" id="edit-address" value="${venue.address || ''}"
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="margin-bottom: 16px; font-size: 1.1rem; color: var(--qed-navy);">Contact Information</h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Contact Name</label>
                                <input type="text" id="edit-contact-name" value="${venue.contact_name || ''}"
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Contact Email</label>
                                <input type="email" id="edit-contact-email" value="${venue.contact_email || ''}"
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Contact Phone</label>
                                <input type="tel" id="edit-contact-phone" value="${venue.contact_phone || ''}"
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 500;">Website</label>
                                <input type="url" id="edit-website" value="${venue.website || ''}" placeholder="https://"
                                    style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem;">
                            </div>
                        </div>
                    </div>

                    <!-- Facilities & Event Types -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="margin-bottom: 16px; font-size: 1.1rem; color: var(--qed-navy);">Facilities & Event Types</h3>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Facilities</label>
                            <div id="edit-facilities-container" style="min-height: 42px; padding: 8px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); background: white; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                                ${(venue.facilities || []).map(f => `
                                    <span class="edit-tag" data-value="${f}" style="background: var(--qed-green); color: white; padding: 4px 10px; border-radius: var(--radius-pill); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                                        ${f}
                                        <i class="fa-solid fa-times" onclick="this.parentElement.remove()" style="cursor: pointer; opacity: 0.8;"></i>
                                    </span>
                                `).join('')}
                            </div>
                            <select id="edit-facilities-select" style="width: 100%; padding: 8px 12px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); margin-top: 8px; font-size: 0.9rem;">
                                <option value="">+ Add facility...</option>
                                ${allFacilities.map(f => `<option value="${f}">${f}</option>`).join('')}
                            </select>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Event Types</label>
                            <div id="edit-event-types-container" style="min-height: 42px; padding: 8px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); background: white; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                                ${(venue.event_types || []).map(t => `
                                    <span class="edit-tag" data-value="${t}" style="background: var(--qed-navy); color: white; padding: 4px 10px; border-radius: var(--radius-pill); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                                        ${t}
                                        <i class="fa-solid fa-times" onclick="this.parentElement.remove()" style="cursor: pointer; opacity: 0.8;"></i>
                                    </span>
                                `).join('')}
                            </div>
                            <select id="edit-event-types-select" style="width: 100%; padding: 8px 12px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); margin-top: 8px; font-size: 0.9rem;">
                                <option value="">+ Add event type...</option>
                                ${allEventTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Photos -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="margin-bottom: 16px; font-size: 1.1rem; color: var(--qed-navy);">Photos</h3>
                        
                        <!-- Existing Photos -->
                        <div id="edit-existing-photos" style="margin-bottom: 16px;">
                            ${venue.photos && venue.photos.length > 0 ? `
                                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Current Photos</label>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px;">
                                    ${venue.photos.map(photo => `
                                        <div class="edit-photo-item" data-photo-id="${photo.id}" style="position: relative; border-radius: var(--radius-md); overflow: hidden; aspect-ratio: 4/3; border: 2px solid var(--qed-cold-grey);">
                                            <img src="${API_BASE}/venues/${venue.id}/photos/${photo.id}" 
                                                 alt="${photo.caption || venue.name}" 
                                                 style="width: 100%; height: 100%; object-fit: cover;">
                                            <button type="button" onclick="deleteVenuePhoto('${venue.id}', '${photo.id}')" 
                                                    style="position: absolute; top: 4px; right: 4px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                                <i class="fa-solid fa-trash" style="color: var(--qed-red); font-size: 0.85rem;"></i>
                                            </button>
                                            ${photo.caption ? `
                                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 6px 8px; color: white; font-size: 0.75rem;">
                                                    ${photo.caption}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-dim" style="margin-bottom: 16px;">No photos uploaded yet.</p>'}
                        </div>
                        
                        <!-- Upload New Photos -->
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Upload New Photos</label>
                            <div id="edit-photo-drop-zone" style="border: 2px dashed var(--qed-cold-grey); border-radius: var(--radius-md); padding: 32px; text-align: center; background: var(--qed-bg-grey); cursor: pointer; transition: all 0.2s;">
                                <i class="fa-solid fa-cloud-upload" style="font-size: 2.5rem; color: var(--qed-green); margin-bottom: 12px;"></i>
                                <p style="margin-bottom: 8px; font-weight: 500;">Drag & drop photos here or click to browse</p>
                                <p class="text-dim" style="font-size: 0.85rem;">Supports: JPG, PNG, WebP (max 10MB each)</p>
                                <input type="file" id="edit-photo-input" accept="image/*" multiple style="display: none;">
                            </div>
                            <div id="edit-photo-previews" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-top: 16px;"></div>
                        </div>
                    </div>

                    <!-- Description & Notes -->
                    <div style="margin-bottom: 32px;">
                        <h3 style="margin-bottom: 16px; font-size: 1.1rem; color: var(--qed-navy);">Description & Notes</h3>
                        
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Description Template</label>
                            <textarea id="edit-description" rows="4" placeholder="Standard description for proposals..."
                                style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem; font-family: inherit; resize: vertical;">${venue.description_template || ''}</textarea>
                            <p class="text-dim" style="font-size: 0.8rem; margin-top: 4px;">This description will be used in client proposals.</p>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500;">Internal Notes</label>
                            <textarea id="edit-notes" rows="3" placeholder="Private notes (not shown to clients)..."
                                style="width: 100%; padding: 10px 14px; border: 1px solid var(--qed-cold-grey); border-radius: var(--radius-md); font-size: 0.9rem; font-family: inherit; resize: vertical;">${venue.notes || ''}</textarea>
                            <p class="text-dim" style="font-size: 0.8rem; margin-top: 4px;">Internal notes for team reference only.</p>
                        </div>
                    </div>

                    <!-- Form Actions -->
                    <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 24px; border-top: 1px solid var(--qed-cold-grey);">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-save" style="margin-right: 6px;"></i> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // Setup tag input handlers
        const facilitiesSelect = modal.querySelector('#edit-facilities-select');
        const facilitiesContainer = modal.querySelector('#edit-facilities-container');

        facilitiesSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                // Check if already added
                const existing = Array.from(facilitiesContainer.querySelectorAll('.edit-tag')).find(
                    tag => tag.dataset.value === e.target.value
                );

                if (!existing) {
                    const tag = document.createElement('span');
                    tag.className = 'edit-tag';
                    tag.dataset.value = e.target.value;
                    tag.style.cssText = 'background: var(--qed-green); color: white; padding: 4px 10px; border-radius: var(--radius-pill); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;';
                    tag.innerHTML = `
                        ${e.target.value}
                        <i class="fa-solid fa-times" style="cursor: pointer; opacity: 0.8;"></i>
                    `;
                    tag.querySelector('i').addEventListener('click', () => tag.remove());
                    facilitiesContainer.appendChild(tag);
                }
                e.target.value = '';
            }
        });

        const eventTypesSelect = modal.querySelector('#edit-event-types-select');
        const eventTypesContainer = modal.querySelector('#edit-event-types-container');

        eventTypesSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                // Check if already added
                const existing = Array.from(eventTypesContainer.querySelectorAll('.edit-tag')).find(
                    tag => tag.dataset.value === e.target.value
                );

                if (!existing) {
                    const tag = document.createElement('span');
                    tag.className = 'edit-tag';
                    tag.dataset.value = e.target.value;
                    tag.style.cssText = 'background: var(--qed-navy); color: white; padding: 4px 10px; border-radius: var(--radius-pill); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;';
                    tag.innerHTML = `
                        ${e.target.value}
                        <i class="fa-solid fa-times" style="cursor: pointer; opacity: 0.8;"></i>
                    `;
                    tag.querySelector('i').addEventListener('click', () => tag.remove());
                    eventTypesContainer.appendChild(tag);
                }
                e.target.value = '';
            }
        });

        // Photo upload handling
        const photoInput = modal.querySelector('#edit-photo-input');
        const photoDropZone = modal.querySelector('#edit-photo-drop-zone');
        const photoPreviewsContainer = modal.querySelector('#edit-photo-previews');
        const newPhotos = []; // Store new photos to upload

        // Click to browse
        photoDropZone.addEventListener('click', () => photoInput.click());

        // Drag and drop
        photoDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            photoDropZone.style.borderColor = 'var(--qed-green)';
            photoDropZone.style.background = 'rgba(46, 196, 160, 0.1)';
        });

        photoDropZone.addEventListener('dragleave', () => {
            photoDropZone.style.borderColor = 'var(--qed-cold-grey)';
            photoDropZone.style.background = 'var(--qed-bg-grey)';
        });

        photoDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            photoDropZone.style.borderColor = 'var(--qed-cold-grey)';
            photoDropZone.style.background = 'var(--qed-bg-grey)';
            handlePhotoFiles(e.dataTransfer.files);
        });

        photoInput.addEventListener('change', (e) => {
            handlePhotoFiles(e.target.files);
        });

        function handlePhotoFiles(files) {
            Array.from(files).forEach(file => {
                // Validate file
                if (!file.type.startsWith('image/')) {
                    alert(`${file.name} is not an image file`);
                    return;
                }
                if (file.size > 10 * 1024 * 1024) {
                    alert(`${file.name} is too large (max 10MB)`);
                    return;
                }

                // Create preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewDiv = document.createElement('div');
                    previewDiv.style.cssText = 'position: relative; border-radius: var(--radius-md); overflow: hidden; border: 2px solid var(--qed-green);';

                    previewDiv.innerHTML = `
                        <img src="${e.target.result}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover;">
                        <button type="button" class="remove-preview-btn" style="position: absolute; top: 4px; right: 4px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                            <i class="fa-solid fa-times" style="color: var(--qed-red);"></i>
                        </button>
                        <input type="text" placeholder="Add caption (optional)" class="photo-caption-input" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 6px 8px; border: none; background: rgba(0,0,0,0.7); color: white; font-size: 0.75rem;">
                    `;

                    const removeBtn = previewDiv.querySelector('.remove-preview-btn');
                    removeBtn.addEventListener('click', () => {
                        const index = newPhotos.findIndex(p => p.file === file);
                        if (index > -1) newPhotos.splice(index, 1);
                        previewDiv.remove();
                    });

                    photoPreviewsContainer.appendChild(previewDiv);

                    // Store file with caption getter
                    newPhotos.push({
                        file: file,
                        getCaptionInput: () => previewDiv.querySelector('.photo-caption-input')
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        // Handle form submission
        const form = modal.querySelector('#edit-venue-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect form data
            const facilities = Array.from(facilitiesContainer.querySelectorAll('.edit-tag')).map(tag => tag.dataset.value);
            const eventTypes = Array.from(eventTypesContainer.querySelectorAll('.edit-tag')).map(tag => tag.dataset.value);

            const updateData = {
                name: modal.querySelector('#edit-name').value.trim(),
                city: modal.querySelector('#edit-city').value.trim(),
                capacity: parseInt(modal.querySelector('#edit-capacity').value),
                address: modal.querySelector('#edit-address').value.trim() || null,
                contact_name: modal.querySelector('#edit-contact-name').value.trim() || null,
                contact_email: modal.querySelector('#edit-contact-email').value.trim() || null,
                contact_phone: modal.querySelector('#edit-contact-phone').value.trim() || null,
                website: modal.querySelector('#edit-website').value.trim() || null,
                facilities: facilities,
                event_types: eventTypes,
                description_template: modal.querySelector('#edit-description').value.trim() || null,
                notes: modal.querySelector('#edit-notes').value.trim() || null
            };

            try {
                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i> Saving...';

                // Update venue
                await apiCall(`/venues/${venueId}`, 'PATCH', updateData);

                // Upload new photos if any
                if (newPhotos.length > 0) {
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i> Uploading photos...';

                    for (const photoData of newPhotos) {
                        const formData = new FormData();
                        formData.append('file', photoData.file);
                        const caption = photoData.getCaptionInput().value.trim();
                        if (caption) {
                            formData.append('caption', caption);
                        }

                        try {
                            await fetch(`${API_BASE}/venues/${venueId}/photos`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${state.token}`
                                },
                                body: formData
                            });
                        } catch (photoError) {
                            console.error('Error uploading photo:', photoError);
                        }
                    }
                }

                // Close modal
                modal.remove();

                // Refresh the gallery
                await renderGlobalVenueGallery();

                // Show success message
                showToast('Venue updated successfully!', 'success');

            } catch (error) {
                console.error('Error updating venue:', error);
                alert('Failed to update venue. Please check the form and try again.');

                // Reset button
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-save" style="margin-right: 6px;"></i> Save Changes';
            }
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (confirm('Discard changes?')) {
                    modal.remove();
                }
            }
        });

    } catch (error) {
        console.error('Error loading venue for edit:', error);
        alert('Failed to load venue data. Please try again.');
    }
}

async function removeVenueFromProject(projectId, venueId) {
    // Create custom confirmation dialog
    const confirmed = await new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal" style="max-width: 400px; background: white; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 12px; overflow: hidden;">
                <div class="modal-header">
                    <h2>Remove Venue</h2>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to remove this venue from the project?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-remove-btn">Cancel</button>
                    <button class="btn" id="confirm-remove-btn" style="background: var(--qed-red); color: white;">Remove</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('cancel-remove-btn').onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };

        document.getElementById('confirm-remove-btn').onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve(false);
            }
        };
    });

    if (!confirmed) return;

    const result = await apiCall(`/projects/${projectId}/venues/${venueId}`, 'DELETE');
    if (result !== false) {
        // Show "Venue Removed" banner
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: rgba(239, 68, 68, 0.9);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            color: white;
            padding: 16px 32px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideUp 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="background: rgba(255,255,255,0.2); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-trash" style="color: white; font-size: 0.9rem;"></i>
                </div>
                <span style="font-weight: 500; font-size: 1rem;">Venue removed from project</span>
            </div>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.8); font-size: 1.2rem; display: flex; align-items: center; justify-content: center; padding: 4px;">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = "slideDown 0.3s ease";
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Refresh project venues data
        await loadProjectVenues(projectId);

        // Render appropriate view based on current context
        if (state.currentView === 'venues') {
            await renderGlobalVenueGallery();
        } else {
            renderProjectDetails(projectId);
        }
    }
}

function showAddVenueModal(projectId) {
    // TODO: Implement modal to browse and add venues from database
    console.log('Show add venue modal for project:', projectId);
    alert('Add venue from database modal coming soon!');
}

function createNewVenueForProject(projectId) {
    // TODO: Open venue creation modal and add to project
    console.log('Create new venue for project:', projectId);
    alert('Create new venue for project coming soon!');
}

function generateProposal(projectId, venueId) {
    // TODO: Generate PDF proposal for specific venue
    console.log('Generate proposal for:', projectId, venueId);
    alert('Generate proposal coming soon!');
}

function generateProposalsForProject(projectId) {
    // TODO: Generate proposals for all venues in project
    console.log('Generate proposals for project:', projectId);
    alert('Generate proposals for all venues coming soon!');
}

// ============================================================================
// EVENT LISTENERS FOR FILTERS AND VIEW TOGGLE
// ============================================================================

function attachFilterListeners() {
    const cityFilter = document.getElementById('filter-city');
    const capacityFilter = document.getElementById('filter-capacity');
    const clearBtn = document.getElementById('clear-filters-btn');

    // City filter
    if (cityFilter) {
        cityFilter.addEventListener('change', (e) => {
            galleryFilters.city = e.target.value;
            renderGlobalVenueGallery();
        });
    }

    // Capacity filter
    if (capacityFilter) {
        capacityFilter.addEventListener('input', (e) => {
            galleryFilters.minCapacity = e.target.value;
            // Debounce the re-render
            clearTimeout(window.capacityFilterTimeout);
            window.capacityFilterTimeout = setTimeout(() => {
                renderGlobalVenueGallery();
            }, 500);
        });
    }

    // Multi-select dropdowns
    setupMultiSelect('facilities', galleryFilters.facilities);
    setupMultiSelect('eventTypes', galleryFilters.eventTypes);

    // Clear filters button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            galleryFilters = {
                city: '',
                minCapacity: '',
                facilities: [],
                eventTypes: []
            };
            renderGlobalVenueGallery();
        });
    }
}

// Multi-select dropdown setup
function setupMultiSelect(filterName, currentValues) {
    const wrapper = document.querySelector(`.multi-select-wrapper[data-filter="${filterName}"]`);
    if (!wrapper) return;

    const trigger = wrapper.querySelector('.multi-select-trigger');
    const dropdown = wrapper.querySelector('.multi-select-dropdown');
    const options = dropdown.querySelectorAll('.multi-select-option');

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = dropdown.classList.contains('active');

        // Close all other dropdowns
        document.querySelectorAll('.multi-select-dropdown.active').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });
        document.querySelectorAll('.multi-select-trigger.active').forEach(t => {
            if (t !== trigger) t.classList.remove('active');
        });

        // Toggle this dropdown
        dropdown.classList.toggle('active', !isActive);
        trigger.classList.toggle('active', !isActive);
    });

    // Handle option clicks
    options.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            const isSelected = option.classList.contains('selected');

            if (isSelected) {
                // Remove from filter
                galleryFilters[filterName] = galleryFilters[filterName].filter(v => v !== value);
            } else {
                // Add to filter
                galleryFilters[filterName].push(value);
            }

            renderGlobalVenueGallery();
        });
    });

    // Handle tag removal
    const tagRemoves = wrapper.querySelectorAll('.multi-select-tag-remove');
    tagRemoves.forEach(remove => {
        remove.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = remove.dataset.value;
            galleryFilters[filterName] = galleryFilters[filterName].filter(v => v !== value);
            renderGlobalVenueGallery();
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.classList.remove('active');
            trigger.classList.remove('active');
        }
    });
}

function attachViewToggleListeners() {
    const cardBtn = document.getElementById('view-card-btn');
    const listBtn = document.getElementById('view-list-btn');

    if (cardBtn) {
        cardBtn.addEventListener('click', () => {
            galleryViewMode = 'card';
            localStorage.setItem('galleryViewMode', 'card');
            renderGlobalVenueGallery();
        });
    }

    if (listBtn) {
        listBtn.addEventListener('click', () => {
            galleryViewMode = 'list';
            localStorage.setItem('galleryViewMode', 'list');
            renderGlobalVenueGallery();
        });
    }
}


// Toast notification helper
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === "success" ? "var(--qed-green)" : type === "error" ? "#ef4444" : "var(--qed-navy)"};
        color: white;
        border-radius: var(--radius-md);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 0.95rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;

    const icon = type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle";
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ============================================================================
// ADD VENUE TO PROJECT
// ============================================================================

async function addVenueToProject(venueId, projectId) {
    try {
        const result = await apiCall(`/projects/${projectId}/venues`, 'POST', {
            venue_id: venueId
        });

        if (result) {
            // Updated UI buttons logic follows...diff showing replacement of toast line

            // Update UI buttons to "Added" state
            ['add-btn-list-', 'add-btn-card-'].forEach(prefix => {
                const btn = document.getElementById(`${prefix}${venueId}`);
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    btn.style.background = 'var(--qed-green)';
                    btn.style.color = 'white';
                    btn.style.borderColor = 'var(--qed-green)';
                    btn.style.cursor = 'default';
                    btn.title = "Added to Project";
                }
            });

            // Show a "Back to Project" banner at the bottom
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: rgba(46, 196, 160, 0.9);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                color: white;
                padding: 16px 32px;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                animation: slideUp 0.3s ease;
            `;
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: rgba(255,255,255,0.2); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-check" style="color: white; font-size: 1rem;"></i>
                    </div>
                    <span style="font-weight: 500; font-size: 1rem;">Venue added to project successfully</span>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <button class="btn" onclick="state.activeProjectId = null; loadView('project-details', '${projectId}');" style="background: white; color: var(--qed-green); border: none; padding: 8px 20px; font-weight: 600; border-radius: 6px; cursor: pointer;">
                        Back to Project
                    </button>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.8); font-size: 1.2rem; display: flex; align-items: center; justify-content: center; padding: 4px;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = "slideDown 0.3s ease";
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
    } catch (error) {
        console.error('Error adding venue to project:', error);
        showToast(error.message || 'Failed to add venue to project', 'error');
    }
}
