/* ═══════════════════════════════════════════════════════════
   NEMS — API Helper Module
   Centralized fetch wrapper for all backend communication
   ═══════════════════════════════════════════════════════════ */

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

/**
 * Shorthand methods
 */
const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

/**
 * Show a dismissible alert message
 */
function showAlert(containerId, message, type = 'success') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  container.innerHTML = `
    <div class="alert alert-${type}">
      <span>${icons[type] || ''}</span>
      <span>${message}</span>
    </div>
  `;

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

/**
 * Populate a <select> element with options
 */
function populateSelect(selectId, items, valueKey, labelKey, placeholder = 'Select...') {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.textContent = typeof labelKey === 'function' ? labelKey(item) : item[labelKey];
    select.appendChild(option);
  });
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Get status badge HTML
 */
function statusBadge(status) {
  const colors = {
    'Open': 'amber',
    'Under Review': 'blue',
    'Resolved': 'green',
    'Rejected': 'red',
    'Accepted': 'green',
    'Not Accepted': 'red',
    'Upgraded': 'purple'
  };
  const color = colors[status] || 'blue';
  return `<span class="badge badge-${color}">${status}</span>`;
}

/**
 * Generate the standard nav bar HTML
 */
function getNavHTML(activePage = '') {
  const pages = [
    { href: 'index.html', label: 'Dashboard' },
    { href: 'students.html', label: 'Students' },
    { href: 'register.html', label: 'Exam Registration' },
    { href: 'results.html', label: 'Results' },
    { href: 'grievance.html', label: 'Grievances' },
    { href: 'allotment.html', label: 'Allotment' }
  ];

  const links = pages.map(p =>
    `<a href="${p.href}" class="${p.href === activePage ? 'active' : ''}">${p.label}</a>`
  ).join('');

  return `
    <header class="header">
      <div class="container">
        <a href="index.html" class="logo">
          <div class="logo-icon">🎓</div>
          NEMS
        </a>
        <nav class="nav">
          ${links}
        </nav>
      </div>
    </header>
  `;
}
