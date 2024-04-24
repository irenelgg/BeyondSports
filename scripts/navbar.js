document.addEventListener('DOMContentLoaded', function () {
    const navToggleIcon = document.querySelector('.nav-toggle-icon');
    const navLinks = document.querySelector('.nav-links');

    navToggleIcon.addEventListener('click', function () {
        navLinks.style.display = navLinks.style.display === 'none' ? 'block' : 'none';
    });
});