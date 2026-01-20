// ===== VENUE UPLOAD FUNCTIONALITY =====

// Create CSV Upload Modal
const csvUploadModal = document.createElement('div');
csvUploadModal.className = 'modal-overlay';
csvUploadModal.id = 'csv-upload-modal';
csvUploadModal.innerHTML = `
    <div class="modal-content animate-fade" style="max-width: 600px;">
        <h2 style="margin-bottom: 8px;">Upload Venues via CSV</h2>
        <p class="text-dim" style="margin-bottom: 24px; font-size: 0.9rem;">
            Upload a CSV file with venue data. Download the template if you need a reference.
        </p>
        
        <div id="csv-upload-zone" style="
            border: 2px dashed var(--qed-cold-grey);
            border-radius: var(--radius-lg);
            padding: 40px;
            text-align: center;
            background: var(--qed-bg-grey);
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 20px;
        ">
            <i class="fa-solid fa-file-csv" style="font-size: 3rem; color: var(--qed-green); margin-bottom: 16px;"></i>
            <h3 style="margin-bottom: 8px;">Drop CSV file here</h3>
            <p class="text-dim" style="margin-bottom: 16px;">or click to browse</p>
            <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
            <button class="btn btn-secondary" style="width: auto;" onclick="document.getElementById('csv-file-input').click()">
                Choose File
            </button>
        </div>
        
        <div id="csv-upload-progress" style="display: none; margin-bottom: 20px;">
            <div style="background: var(--qed-bg-grey); border-radius: var(--radius-md); padding: 16px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <i class="fa-solid fa-spinner fa-spin" style="color: var(--qed-green);"></i>
                    <span id="csv-upload-status">Uploading...</span>
                </div>
                <div style="background: white; height: 4px; border-radius: 2px; overflow: hidden;">
                    <div id="csv-progress-bar" style="background: var(--qed-green); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                </div>
            </div>
        </div>
        
        <div id="csv-upload-result" style="display: none; margin-bottom: 20px;"></div>
        
        <div style="background: var(--qed-bg-grey); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
            <h4 style="font-size: 0.9rem; margin-bottom: 8px;">CSV Format Requirements:</h4>
            <ul class="text-dim" style="font-size: 0.85rem; margin-left: 20px; line-height: 1.6;">
                <li><strong>Required:</strong> name, city, capacity</li>
                <li><strong>Optional:</strong> facilities, event_types, contact_email, contact_phone, website, address, description_template, notes</li>
                <li>Arrays (facilities, event_types) should be comma-separated</li>
                <li>Max file size: 5MB, Max rows: 1000</li>
            </ul>
        </div>
        
        <div style="display: flex; gap: 12px;">
            <button type="button" class="btn btn-secondary" id="close-csv-modal">Cancel</button>
            <button type="button" class="btn btn-secondary" id="download-csv-template" style="margin-left: auto;">
                <i class="fa-solid fa-download" style="margin-right: 6px;"></i> Download Template
            </button>
        </div>
    </div>
`;
document.body.appendChild(csvUploadModal);

// Create Manual Venue Add Modal
const addVenueModal = document.createElement('div');
addVenueModal.className = 'modal-overlay';
addVenueModal.id = 'add-venue-modal';
addVenueModal.innerHTML = `
    <div class="modal-content animate-fade" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
        <h2 style="margin-bottom: 24px;">Add New Venue</h2>
        <form id="venue-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                    <label>Venue Name <span style="color: var(--qed-red);">*</span></label>
                    <input type="text" id="v-name" placeholder="e.g. Grand Hotel Brussels" required>
                </div>
                <div class="form-group">
                    <label>City <span style="color: var(--qed-red);">*</span></label>
                    <input type="text" id="v-city" placeholder="e.g. Brussels" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Capacity <span style="color: var(--qed-red);">*</span></label>
                <input type="number" id="v-capacity" placeholder="e.g. 200" min="1" required>
            </div>
            
            <div class="form-group">
                <label>Facilities <span class="text-dim" style="font-weight: 400;">(comma-separated)</span></label>
                <input type="text" id="v-facilities" placeholder="e.g. WiFi, Projector, Catering, Parking">
            </div>
            
            <div class="form-group">
                <label>Event Types <span class="text-dim" style="font-weight: 400;">(comma-separated)</span></label>
                <input type="text" id="v-event-types" placeholder="e.g. Conference, Workshop, Seminar">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                    <label>Contact Email</label>
                    <input type="email" id="v-email" placeholder="contact@venue.com">
                </div>
                <div class="form-group">
                    <label>Contact Phone</label>
                    <input type="tel" id="v-phone" placeholder="+32 2 123 4567">
                </div>
            </div>
            
            <div class="form-group">
                <label>Website</label>
                <input type="url" id="v-website" placeholder="https://www.venue.com">
            </div>
            
            <div class="form-group">
                <label>Address</label>
                <input type="text" id="v-address" placeholder="123 Example Street, 1000 Brussels">
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="v-description" class="textarea" placeholder="A brief description of the venue..."></textarea>
            </div>
            
            <div class="form-group">
                <label>Notes</label>
                <textarea id="v-notes" class="textarea" placeholder="Internal notes..."></textarea>
            </div>
            
            <div class="form-group">
                <label>Photos <span class="text-dim" style="font-weight: 400;">(optional, max 5 photos)</span></label>
                <div style="border: 2px dashed var(--qed-cold-grey); border-radius: var(--radius-md); padding: 20px; text-align: center; background: var(--qed-bg-grey);">
                    <input type="file" id="v-photos" accept="image/jpeg,image/png,image/jpg" multiple style="display: none;">
                    <i class="fa-solid fa-images" style="font-size: 2rem; color: var(--qed-green); margin-bottom: 8px;"></i>
                    <p class="text-dim" style="font-size: 0.9rem; margin-bottom: 12px;">Click to upload photos or drag and drop</p>
                    <button type="button" class="btn btn-secondary" style="width: auto; padding: 8px 16px;" onclick="document.getElementById('v-photos').click()">
                        Choose Photos
                    </button>
                    <div id="photo-preview" style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px;"></div>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" id="close-venue-modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Venue</button>
            </div>
        </form>
    </div>
`;
document.body.appendChild(addVenueModal);

// Helper function to attach listeners
function attachVenueUploadListeners() {
    const addBtn = document.getElementById('add-venue-btn');
    const uploadBtn = document.getElementById('upload-csv-btn');
    const templateBtn = document.getElementById('download-template-btn');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addVenueModal.classList.add('show');
            setTimeout(() => {
                setupFormChangeTracking();
                const photoInput = document.getElementById('v-photos');
                if (photoInput) {
                    photoInput.addEventListener('change', handlePhotoSelection);
                }
            }, 100);
        });
    }

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            csvUploadModal.classList.add('show');
        });
    }

    if (templateBtn) {
        templateBtn.addEventListener('click', downloadCSVTemplate);
    }
}

// CSV Upload Modal Handlers
document.getElementById('close-csv-modal').addEventListener('click', () => {
    csvUploadModal.classList.remove('show');
    resetCSVUpload();
});

document.getElementById('download-csv-template').addEventListener('click', downloadCSVTemplate);

// Drag and drop
const uploadZone = document.getElementById('csv-upload-zone');
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--qed-green)';
    uploadZone.style.background = 'rgba(46, 196, 160, 0.05)';
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = 'var(--qed-cold-grey)';
    uploadZone.style.background = 'var(--qed-bg-grey)';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--qed-cold-grey)';
    uploadZone.style.background = 'var(--qed-bg-grey)';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleCSVUpload(files[0]);
    }
});

uploadZone.addEventListener('click', () => {
    document.getElementById('csv-file-input').click();
});

document.getElementById('csv-file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleCSVUpload(e.target.files[0]);
    }
});

// Manual Venue Modal Handlers
let formHasChanges = false;
let selectedPhotos = [];

// Track form changes
function setupFormChangeTracking() {
    const form = document.getElementById('venue-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            formHasChanges = true;
        });
    });
}

// Photo upload handling
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const photoInput = document.getElementById('v-photos');
        if (photoInput) {
            photoInput.addEventListener('change', handlePhotoSelection);
        }
    }, 100);
});

function handlePhotoSelection(e) {
    const files = Array.from(e.target.files);

    // Limit to 5 photos
    if (files.length > 5) {
        alert('Maximum 5 photos allowed');
        return;
    }

    selectedPhotos = files;
    displayPhotoPreview(files);
}

function displayPhotoPreview(files) {
    const preview = document.getElementById('photo-preview');
    if (!preview) return;

    preview.innerHTML = '';

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 1;';
            div.innerHTML = `
                <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="removePhoto(${index})" style="
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(232, 90, 90, 0.9);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                ">×</button>
            `;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

function removePhoto(index) {
    selectedPhotos.splice(index, 1);
    const photoInput = document.getElementById('v-photos');
    if (photoInput) {
        // Create new FileList without the removed file
        const dt = new DataTransfer();
        selectedPhotos.forEach(file => dt.items.add(file));
        photoInput.files = dt.files;
    }
    displayPhotoPreview(selectedPhotos);
}

document.getElementById('close-venue-modal').addEventListener('click', () => {
    if (formHasChanges) {
        if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
            return;
        }
    }
    closeVenueModal();
});

// Close modal when clicking outside
addVenueModal.addEventListener('click', (e) => {
    if (e.target === addVenueModal) {
        if (formHasChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
                return;
            }
        }
        closeVenueModal();
    }
});

function closeVenueModal() {
    addVenueModal.classList.remove('show');
    document.getElementById('venue-form').reset();
    formHasChanges = false;
    selectedPhotos = [];
    const preview = document.getElementById('photo-preview');
    if (preview) preview.innerHTML = '';
}

document.getElementById('venue-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const venueData = {
        name: document.getElementById('v-name').value,
        city: document.getElementById('v-city').value,
        capacity: parseInt(document.getElementById('v-capacity').value),
        facilities: document.getElementById('v-facilities').value.split(',').map(f => f.trim()).filter(f => f),
        event_types: document.getElementById('v-event-types').value.split(',').map(e => e.trim()).filter(e => e),
        contact_email: document.getElementById('v-email').value || null,
        contact_phone: document.getElementById('v-phone').value || null,
        website: document.getElementById('v-website').value || null,
        address: document.getElementById('v-address').value || null,
        description_template: document.getElementById('v-description').value || null,
        notes: document.getElementById('v-notes').value || null,
    };

    // Create venue first
    const result = await apiCall('/venues', 'POST', venueData);
    if (result) {
        // Upload photos if any
        if (selectedPhotos.length > 0) {
            await uploadVenuePhotos(result.id, selectedPhotos);
        }

        closeVenueModal();
        alert('Venue created successfully!');
        loadView('venues'); // Reload venues
    }
});

async function uploadVenuePhotos(venueId, photos) {
    for (let i = 0; i < photos.length; i++) {
        const formData = new FormData();
        formData.append('file', photos[i]);
        formData.append('display_order', i.toString());

        try {
            await fetch(`${API_BASE}/venues/${venueId}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                },
                body: formData
            });
        } catch (error) {
            console.error('Failed to upload photo:', error);
        }
    }
}

// Setup form tracking when modal opens
const originalAddVenueListener = document.getElementById('add-venue-btn');
if (originalAddVenueListener) {
    originalAddVenueListener.addEventListener('click', () => {
        setTimeout(setupFormChangeTracking, 100);
    });
}

// CSV Upload Handler
async function handleCSVUpload(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
    }

    // Show progress
    document.getElementById('csv-upload-progress').style.display = 'block';
    document.getElementById('csv-upload-result').style.display = 'none';
    document.getElementById('csv-progress-bar').style.width = '30%';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/venues/upload-csv`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });

        document.getElementById('csv-progress-bar').style.width = '100%';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        const result = await response.json();
        displayCSVResult(result);

        // Reload venues if any were created
        if (result.successful > 0) {
            setTimeout(() => {
                loadView('venues');
            }, 2000);
        }

    } catch (error) {
        document.getElementById('csv-upload-progress').style.display = 'none';
        document.getElementById('csv-upload-result').style.display = 'block';
        document.getElementById('csv-upload-result').innerHTML = `
            <div style="background: rgba(232, 90, 90, 0.1); border: 1px solid var(--qed-red); border-radius: var(--radius-md); padding: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fa-solid fa-circle-exclamation" style="color: var(--qed-red); font-size: 1.5rem;"></i>
                    <div>
                        <h4 style="color: var(--qed-red); margin-bottom: 4px;">Upload Failed</h4>
                        <p class="text-dim" style="font-size: 0.9rem;">${error.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

function displayCSVResult(result) {
    document.getElementById('csv-upload-progress').style.display = 'none';
    document.getElementById('csv-upload-result').style.display = 'block';

    const successRate = result.total_rows > 0 ? Math.round((result.successful / result.total_rows) * 100) : 0;
    const isSuccess = result.failed === 0;

    let html = `
        <div style="background: ${isSuccess ? 'rgba(46, 196, 160, 0.1)' : 'rgba(232, 148, 74, 0.1)'}; 
                    border: 1px solid ${isSuccess ? 'var(--qed-green)' : 'var(--qed-orange)'}; 
                    border-radius: var(--radius-md); padding: 20px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <i class="fa-solid ${isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation'}" 
                   style="color: ${isSuccess ? 'var(--qed-green)' : 'var(--qed-orange)'}; font-size: 2rem;"></i>
                <div>
                    <h3 style="margin-bottom: 4px;">${isSuccess ? 'Upload Successful!' : 'Upload Completed with Errors'}</h3>
                    <p class="text-dim" style="font-size: 0.9rem;">
                        ${result.successful} of ${result.total_rows} venues created (${successRate}%)
                    </p>
                </div>
            </div>
            
            ${result.failed > 0 ? `
                <div style="background: white; border-radius: var(--radius-md); padding: 12px; margin-top: 12px;">
                    <h4 style="font-size: 0.9rem; margin-bottom: 8px; color: var(--qed-red);">
                        ${result.failed} Error${result.failed > 1 ? 's' : ''}:
                    </h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${result.errors.map(err => `
                            <div style="font-size: 0.85rem; padding: 6px 0; border-bottom: 1px solid var(--qed-cold-grey);">
                                <strong>Row ${err.row}:</strong> ${err.message}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('csv-upload-result').innerHTML = html;
}

function resetCSVUpload() {
    document.getElementById('csv-file-input').value = '';
    document.getElementById('csv-upload-progress').style.display = 'none';
    document.getElementById('csv-upload-result').style.display = 'none';
    document.getElementById('csv-progress-bar').style.width = '0%';
}

async function downloadCSVTemplate() {
    try {
        const response = await fetch(`${API_BASE}/venues/csv-template`);
        if (!response.ok) throw new Error('Failed to download template');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'venue_upload_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        alert('Failed to download template: ' + error.message);
    }
}
