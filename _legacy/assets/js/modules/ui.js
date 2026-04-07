/**
 * UI-related functionality
 */

/**
 * Setup collapsible sections
 */
export const setupSectionCollapse = () => {
  const headers = document.querySelectorAll('.section-header');

  if (headers.length > 0) {
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.collapse-icon');

        content.classList.toggle('hidden');
        icon.classList.toggle('rotated');
      });
    });
  }
};

/**
 * Setup sidebar toggle functionality
 */
export const setupSidebarToggle = () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (!sidebarToggle || !sidebar) return;

  // Toggle sidebar on button click
  sidebarToggle.addEventListener('click', event => {
    event.stopPropagation();
    sidebar.classList.toggle('active');
    sidebar.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', event => {
    if (sidebar.classList.contains('active') &&
        !sidebar.contains(event.target) &&
        event.target !== sidebarToggle) {
      sidebar.classList.remove('active');
      sidebar.style.display = 'none';
    }
  });
};

/**
 * Setup search toggle functionality
 */
export const setupSearchToggle = () => {
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');

  if (!searchToggle || !searchBar) return;

  // Toggle search bar on button click
  searchToggle.addEventListener('click', event => {
    event.stopPropagation();
    searchBar.classList.toggle('active');
    searchBar.style.display = searchBar.classList.contains('active') ? 'block' : 'none';
  });

  // Close search bar when clicking outside
  document.addEventListener('click', event => {
    if (searchBar.classList.contains('active') &&
        !searchBar.contains(event.target) &&
        event.target !== searchToggle) {
      searchBar.classList.remove('active');
      searchBar.style.display = 'none';
    }
  });
};
