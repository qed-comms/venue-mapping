// Test AI Context Panel
// Add this to browser console to test the panel

// Test with mock data
async function testAIPanel() {
    console.log('🧪 Testing AI Context Panel...');

    // Check if panel exists
    if (typeof aiContextPanel === 'undefined') {
        console.error('❌ aiContextPanel not found!');
        return;
    }

    console.log('✅ aiContextPanel found');

    // Check if we have a project and venue
    if (!state.activeProjectId) {
        console.warn('⚠️  No active project. Please navigate to a project first.');
        return;
    }

    if (!state.projectVenues || state.projectVenues.length === 0) {
        console.warn('⚠️  No venues in project. Please add a venue first.');
        return;
    }

    const firstVenue = state.projectVenues[0];
    console.log('📍 Testing with venue:', firstVenue.venue.name);

    // Open panel
    try {
        await aiContextPanel.open(state.activeProjectId, firstVenue.venue.id);
        console.log('✅ Panel opened successfully!');
        console.log('👉 Fill in the form and click "Generate Description"');
    } catch (error) {
        console.error('❌ Error opening panel:', error);
    }
}

// Run test
console.log('🚀 AI Context Panel Test Ready');
console.log('Run: testAIPanel()');
