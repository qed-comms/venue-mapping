/**
 * AI Context Panel - SIMPLIFIED VERSION
 * Venue Description Generator with minimal required fields
 */

class VenueAIContextPanel {
    constructor() {
        this.panel = null;
        this.currentVenue = null;
        this.currentProject = null;
        this.currentContext = {};
        this.autoSaveTimeout = null;
        this.atmosphereTags = [];
    }

    async open(projectId, venueId) {
        this.currentProject = projectId;
        this.currentVenue = venueId;
        await this.loadContext();
        this.render();
        this.attachListeners();
    }

    async loadContext() {
        const pv = state.projectVenues.find(pv => pv.venue.id === this.currentVenue);
        if (pv && pv.ai_context) {
            this.currentContext = pv.ai_context;
            this.atmosphereTags = pv.ai_context.event_context?.atmosphere || [];
        } else {
            this.currentContext = {
                event_context: {},
                venue_highlights: {}
            };
            this.atmosphereTags = [];
        }
    }

    render() {
        if (this.panel) {
            this.panel.remove();
        }

        const panel = document.createElement('div');
        panel.className = 'ai-context-panel';
        panel.innerHTML = this.getHTML();

        document.body.appendChild(panel);
        this.panel = panel;

        this.populateForm();
        setTimeout(() => panel.classList.add('show'), 10);
    }

    getHTML() {
        const venue = state.projectVenues.find(pv => pv.venue.id === this.currentVenue)?.venue;
        const venueName = venue ? venue.name : 'Venue';

        return `
            <div class="ai-panel-overlay" onclick="aiContextPanel.close()"></div>
            <div class="ai-panel-content">
                <div class="ai-panel-header">
                    <div>
                        <h2>✨ AI Description Generator</h2>
                        <p class="text-dim">${venueName}</p>
                    </div>
                    <button onclick="aiContextPanel.close()" class="close-btn" title="Close (Esc)">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div class="ai-panel-body">
                    <!-- Quick Context Section -->
                    <section class="context-section">
                        <h3><i class="fa-solid fa-bolt"></i> Quick Context</h3>
                        <p class="section-desc">Just the essentials - takes 30 seconds!</p>
                        
                        <div class="form-group">
                            <label>Event Type <span class="required">*</span></label>
                            <select id="ai-event-type" required>
                                <option value="">Select type...</option>
                                <option value="conference">Conference</option>
                                <option value="wedding">Wedding</option>
                                <option value="corporate">Corporate Event</option>
                                <option value="social">Social Gathering</option>
                                <option value="training">Training/Workshop</option>
                                <option value="gala">Gala/Fundraiser</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>What's the event about? <span class="required">*</span></label>
                            <input type="text" id="ai-purpose" placeholder="e.g., Annual team retreat for 100 people" maxlength="200">
                        </div>
                        
                        <div class="form-group">
                            <label>Vibe/Atmosphere <span class="required">*</span></label>
                            <div id="ai-atmosphere-tags" class="tag-container"></div>
                            <input type="text" id="ai-atmosphere-input" placeholder="Type keywords: professional, modern, elegant (press Enter)" maxlength="50">
                            <small class="text-dim">Add 2-3 keywords that describe the desired atmosphere</small>
                        </div>
                    </section>
                    
                    <!-- Optional Details (Collapsible) -->
                    <details class="context-section">
                        <summary style="cursor: pointer; font-weight: 600; color: var(--qed-dark-blue); padding: 12px 0;">
                            <i class="fa-solid fa-plus-circle"></i> Add More Details (Optional)
                        </summary>
                        
                        <div class="form-group" style="margin-top: 16px;">
                            <label>Unique Features</label>
                            <div id="ai-features-list" class="features-list"></div>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="ai-feature-input" placeholder="e.g., Rooftop terrace" maxlength="100" style="flex: 1;">
                                <button type="button" class="btn btn-secondary" onclick="aiContextPanel.addFeature()" style="width: auto; padding: 8px 16px;">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Technology/AV</label>
                            <input type="text" id="ai-technology" placeholder="e.g., 4K projectors, high-speed WiFi" maxlength="150">
                        </div>
                        
                        <div class="form-group">
                            <label>Special Notes</label>
                            <textarea id="ai-special-req" rows="2" placeholder="Anything else important?" maxlength="200"></textarea>
                        </div>
                    </details>
                    
                    <!-- AI Output Section -->
                    <div id="ai-output-section" class="ai-output-section" style="display: none;">
                        <h3><i class="fa-solid fa-sparkles"></i> Generated Description</h3>
                        <div id="ai-description-output" class="ai-description-output"></div>
                        <div class="output-actions">
                            <button class="btn btn-secondary" onclick="aiContextPanel.regenerate()">
                                <i class="fa-solid fa-rotate"></i> Regenerate
                            </button>
                            <button class="btn btn-primary" onclick="aiContextPanel.acceptDescription()">
                                <i class="fa-solid fa-check"></i> Accept & Save
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="ai-panel-footer">
                    <button class="btn btn-primary" onclick="aiContextPanel.generateDescription()" id="generate-btn">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Description
                    </button>
                </div>
            </div>
        `;
    }

    populateForm() {
        const ctx = this.currentContext;

        if (ctx.event_context) {
            document.getElementById('ai-event-type').value = ctx.event_context.event_type || '';
            document.getElementById('ai-purpose').value = ctx.event_context.purpose || '';
            document.getElementById('ai-special-req').value = ctx.event_context.special_requirements || '';
            this.renderAtmosphereTags();
        }

        if (ctx.venue_highlights) {
            this.renderFeatures(ctx.venue_highlights.unique_features || []);
            document.getElementById('ai-technology').value = ctx.venue_highlights.technology || '';
        }
    }

    renderAtmosphereTags() {
        const container = document.getElementById('ai-atmosphere-tags');
        container.innerHTML = this.atmosphereTags.map((tag, index) => `
            <span class="tag">
                ${tag}
                <i class="fa-solid fa-xmark" onclick="aiContextPanel.removeAtmosphereTag(${index})"></i>
            </span>
        `).join('');
    }

    renderFeatures(features) {
        const container = document.getElementById('ai-features-list');
        container.innerHTML = features.map((feature, index) => `
            <div class="feature-item">
                <span>• ${feature}</span>
                <i class="fa-solid fa-xmark" onclick="aiContextPanel.removeFeature(${index})"></i>
            </div>
        `).join('');
    }

    addAtmosphereTag(tag) {
        if (tag && !this.atmosphereTags.includes(tag)) {
            this.atmosphereTags.push(tag);
            this.renderAtmosphereTags();
            this.scheduleAutoSave();
        }
    }

    removeAtmosphereTag(index) {
        this.atmosphereTags.splice(index, 1);
        this.renderAtmosphereTags();
        this.scheduleAutoSave();
    }

    addFeature() {
        const input = document.getElementById('ai-feature-input');
        const feature = input.value.trim();

        if (feature) {
            const features = this.currentContext.venue_highlights?.unique_features || [];
            features.push(feature);

            if (!this.currentContext.venue_highlights) {
                this.currentContext.venue_highlights = {};
            }
            this.currentContext.venue_highlights.unique_features = features;

            this.renderFeatures(features);
            input.value = '';
            this.scheduleAutoSave();
        }
    }

    removeFeature(index) {
        const features = this.currentContext.venue_highlights?.unique_features || [];
        features.splice(index, 1);
        this.renderFeatures(features);
        this.scheduleAutoSave();
    }

    attachListeners() {
        const atmosphereInput = document.getElementById('ai-atmosphere-input');
        atmosphereInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = e.target.value.trim();
                if (tag) {
                    this.addAtmosphereTag(tag);
                    e.target.value = '';
                }
            }
        });

        const featureInput = document.getElementById('ai-feature-input');
        featureInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addFeature();
            }
        });

        const inputs = this.panel.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.scheduleAutoSave());
            input.addEventListener('change', () => this.scheduleAutoSave());
        });

        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    handleKeyboard(e) {
        if (!this.panel) return;
        if (e.key === 'Escape') this.close();
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            this.generateDescription();
        }
    }

    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveContext(true);
        }, 2000);
    }

    collectFormData() {
        const context = {
            event_context: {
                event_type: document.getElementById('ai-event-type').value,
                purpose: document.getElementById('ai-purpose').value,
                atmosphere: this.atmosphereTags,
                special_requirements: document.getElementById('ai-special-req').value
            },
            venue_highlights: {
                unique_features: this.currentContext.venue_highlights?.unique_features || [],
                technology: document.getElementById('ai-technology').value
            }
        };

        return context;
    }

    async saveContext(silent = false) {
        const context = this.collectFormData();

        const result = await apiCall(
            `/projects/${this.currentProject}/venues/${this.currentVenue}`,
            'PATCH',
            { ai_context: context }
        );

        if (result) {
            this.currentContext = context;
            const pv = state.projectVenues.find(pv => pv.venue.id === this.currentVenue);
            if (pv) pv.ai_context = context;

            if (!silent) showToast('Context saved', 'success');
        }
    }

    validateForm() {
        const errors = [];

        if (!document.getElementById('ai-event-type').value) {
            errors.push('Event Type is required');
        }

        if (!document.getElementById('ai-purpose').value.trim()) {
            errors.push('Event description is required');
        }

        if (this.atmosphereTags.length === 0) {
            errors.push('Add at least one atmosphere keyword');
        }

        return errors;
    }

    async generateDescription() {
        const errors = this.validateForm();
        if (errors.length > 0) {
            showToast(errors.join('. '), 'error');
            return;
        }

        await this.saveContext(true);

        const btn = document.getElementById('generate-btn');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

        showToast('Generating description...', 'info');

        try {
            const result = await apiCall(
                `/projects/${this.currentProject}/venues/${this.currentVenue}/generate-description`,
                'POST'
            );

            if (result && result.ai_description) {
                document.getElementById('ai-description-output').textContent = result.ai_description;
                document.getElementById('ai-output-section').style.display = 'block';
                document.getElementById('ai-output-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                showToast('Description generated!', 'success');
            }
        } catch (error) {
            console.error('AI error:', error);
            showToast(error.message || 'Generation failed. Check API key.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }

    async regenerate() {
        if (confirm('Generate a new description?')) {
            await this.generateDescription();
        }
    }

    async acceptDescription() {
        const description = document.getElementById('ai-description-output').textContent;

        const result = await apiCall(
            `/projects/${this.currentProject}/venues/${this.currentVenue}`,
            'PATCH',
            { final_description: description }
        );

        if (result) {
            showToast('Description saved!', 'success');
            const pv = state.projectVenues.find(pv => pv.venue.id === this.currentVenue);
            if (pv) pv.final_description = description;
            setTimeout(() => this.close(), 1000);
        }
    }

    close() {
        if (this.panel) {
            this.panel.classList.remove('show');
            setTimeout(() => {
                this.panel.remove();
                this.panel = null;
            }, 300);
        }
        document.removeEventListener('keydown', this.handleKeyboard);
    }
}

// Global instance
const aiContextPanel = new VenueAIContextPanel();
