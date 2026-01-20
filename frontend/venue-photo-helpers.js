
// Delete venue photo
async function deleteVenuePhoto(venueId, photoId) {
    if (!confirm('Are you sure you want to delete this photo?')) {
        return;
    }

    try {
        await apiCall(`/venues/${venueId}/photos/${photoId}`, 'DELETE');

        // Remove from DOM
        const photoElement = document.querySelector(`.edit-photo-item[data-photo-id="${photoId}"]`);
        if (photoElement) {
            photoElement.remove();
        }

        showToast('Photo deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting photo:', error);
        showToast('Failed to delete photo', 'error');
    }
}
