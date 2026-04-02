/* ═══════════════════════════════════════════════════════════
   NEMS — API Helper Module
   Centralized fetch wrapper for all backend communication
   ═══════════════════════════════════════════════════════════ */

const API_BASE = '/api';

/**
 * Auth helpers
 */
const auth = {
  getRole: () => localStorage.getItem('nems_role'),
  getStudentId: () => localStorage.getItem('nems_student_id'),
  getUserName: () => localStorage.getItem('nems_user_name'),
  isLoggedIn: () => !!localStorage.getItem('nems_role'),
  logout: () => {
    localStorage.clear();
    window.location.href = 'login.html';
  },
  checkAuth: () => {
    if (!auth.isLoggedIn() && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('signup.html')) {
      window.location.href = 'login.html';
    }
  }
};

// Check auth on page load
auth.checkAuth();

/**
 * Generic fetch wrapper with error handling and auth headers
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    
    // Add auth headers
    const headers = { 
      'Content-Type': 'application/json',
      'x-user-role': auth.getRole() || '',
      'x-student-id': auth.getStudentId() || ''
    };

    const config = {
      headers,
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}`);
      }
      return text;
    }

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
  const role = auth.getRole();
  
  let pages = [
    { href: 'index.html', label: 'Dashboard' }
  ];

  if (role === 'admin') {
    pages.push({ href: 'students.html', label: 'Student Management' });
    pages.push({ href: 'register.html', label: 'Registrations' });
    pages.push({ href: 'results.html', label: 'Results Update' });
    pages.push({ href: 'grievance.html', label: 'Grievances' });
    pages.push({ href: 'allotment.html', label: 'Allotments' });
  } else if (role === 'student') {
    pages.push({ href: 'students.html', label: 'My Profile' });
    pages.push({ href: 'register.html', label: 'Register for Exam' });
    pages.push({ href: 'results.html', label: 'My Results' });
    pages.push({ href: 'grievance.html', label: 'Help Desk' });
    pages.push({ href: 'allotment.html', label: 'My Allotment' });
  }

  const links = pages.map(p =>
    `<a href="${p.href}" class="${p.href === activePage ? 'active' : ''}">${p.label}</a>`
  ).join('');

  const userName = auth.getUserName() || (role === 'admin' ? 'Administrator' : 'Student');

  return `
    <header class="header">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 2rem;">
          <a href="index.html" class="logo">
            <div class="logo-icon">🎓</div>
            NEMS
          </a>
          <nav class="nav">
            ${links}
          </nav>
        </div>
        <div class="user-profile" style="display: flex; align-items: center; gap: 1rem;">
          <span style="color: var(--text-secondary); font-size: 0.9rem;">${userName} (${role})</span>
          <button onclick="auth.logout()" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Logout</button>
        </div>
      </div>
    </header>
  `;
}
