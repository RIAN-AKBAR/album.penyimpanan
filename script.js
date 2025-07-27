// Shared functions
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function downloadPhoto(photoUrl, photoName) {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = photoName || 'photo_' + Date.now() + '.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function setupConfirmationDialog() {
    const dialog = document.getElementById('confirmation-dialog');
    const message = document.getElementById('confirmation-message');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');
    
    let currentAction = null;

    function show(msg, action) {
        message.textContent = msg;
        currentAction = action;
        dialog.classList.add('active');
    }

    function hide() {
        dialog.classList.remove('active');
        currentAction = null;
    }

    confirmBtn?.addEventListener('click', () => {
        if (currentAction) currentAction();
        hide();
    });

    cancelBtn?.addEventListener('click', hide);

    return { show };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Shared initialization if needed
});
