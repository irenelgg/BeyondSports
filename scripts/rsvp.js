document.addEventListener('DOMContentLoaded', function() {
    function showConfirmationModal() {
        var modalOverlay = document.getElementById('modal-overlay');
        var confirmationModal = document.getElementById('confirmation-modal');
        var mainContent = document.getElementById('main-content');

        modalOverlay.classList.remove('hidden');
        confirmationModal.classList.remove('hidden');
        mainContent.classList.add('blur');
    }

    function hideModal() {
        var modalOverlay = document.getElementById('modal-overlay');
        var confirmationModal = document.getElementById('confirmation-modal');
        var mainContent = document.getElementById('main-content');

        modalOverlay.classList.add('hidden');
        confirmationModal.classList.add('hidden');
        mainContent.classList.remove('blur');
    }

    document.querySelectorAll('.event-card-rsvp').forEach(function(button) {
        button.addEventListener('click', function() {
            showConfirmationModal();
        });
    });

    document.getElementById('cancel-no').addEventListener('click', hideModal);
    document.getElementById('cancel-yes').addEventListener('click', function() {
        hideModal();
        window.location.href = 'cancel-page.html'; // Redirect to cancellation page
    });
});
