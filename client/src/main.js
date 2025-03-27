const state = {
  config: {},
  logs: [],
  isLoadingConfig: true,
  isLoadingLogs: true,
  isSubmitting: false,
  temperatureInputValue: ""
};

const pages = {
  '#': createConfigPage,
  '#temperature-log-form': createTemperatureLogForm,
  '#view-logs': createViewLogsPage
};

function createConfigPage() {
  return `
    <div class="container">
      <h1>View Config</h1>
      ${createCard("Drone ID", state.config.drone_id || "Loading...")}
      ${createCard("Drone Name", state.config.drone_name ? import.meta.env.VITE_CUSTOM_DRONE_NAME : "Loading...")}
      ${createCard("Light", state.config.light || "Loading...")}
      ${createCard("Country", state.config.country ? import.meta.env.VITE_CUSTOM_COUNTRY : "Loading...")}
    </div>
  `;
}

function createTemperatureLogForm() {
  const isDisabled = state.isLoadingConfig || state.isSubmitting;
  return `
    <div class="container">
      <h1>Temperature Log Form</h1>
      <form id="temperature-log-form">
        <label for="temperature">Temperature (Celsius)</label>
        <div class="form-group">
          <input 
            type="number" 
            id="temperature" 
            placeholder="Enter temperature" 
            value="${state.temperatureInputValue}" 
            ${isDisabled ? "disabled" : ""} 
            required
          >
          <button 
            type="submit" 
            class="btn btn-primary" 
            id="submit-btn" 
            ${isDisabled ? "disabled" : ""}
          >
            ${state.isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
      ${state.isLoadingConfig ? "<p>Loading config...</p>" : ""}
    </div>
  `;
}

function createViewLogsPage() {
  const rows = state.logs.length
    ? state.logs.map(log => `
        <tr>
          <td>${log.drone_id}</td>
          <td>${log.drone_name}</td>
          <td>${log.country}</td>
          <td>${log.celsius}°C</td>
          <td>${log.created}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5">${state.isLoadingLogs ? "Loading logs..." : "No logs available"}</td></tr>`;

  return `
    <div class="container">
      <h1>View Logs</h1>
      <table>
        <thead>
          <tr>
            <th>Drone ID</th>
            <th>Drone Name</th>
            <th>Country</th>
            <th>Celsius</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function createCard(title, text) {
  return `
    <div class="card">
      <h2 class="card-title">${title}</h2>
      <p class="card-text">${text}</p>
    </div>
  `;
}

function updateNav(hash) {
  document.querySelectorAll("nav a").forEach(a => a.className = 'btn btn-secondary');
  const activeLink = document.querySelector(`nav a[href="${hash}"]`);
  if (activeLink) activeLink.className = 'btn btn-primary';
}

function renderPage() {
  const hash = window.location.hash || "#";
  updateNav(hash);
  document.querySelector('#app').innerHTML = pages[hash] ? pages[hash]() : "<h1>Page Not Found</h1>";

  if (hash === '#temperature-log-form') {
    document.querySelector('#temperature').addEventListener('input', e => {
      state.temperatureInputValue = e.target.value;
    });
    document.querySelector('#temperature-log-form').addEventListener('submit', submitTemperatureLog);
  }
}

async function fetchData(url, key, loadingKey) {
  try {
    state[loadingKey] = true;
    renderPage();
    const response = await fetch(url);
    state[key] = await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${key}:`, error);
  } finally {
    state[loadingKey] = false;
    renderPage();
  }
}

async function getConfig() {
  await fetchData(`${import.meta.env.VITE_SERVER_URL}/configs/${import.meta.env.VITE_DRONE_ID}`, 'config', 'isLoadingConfig');
}

async function getLogs() {
  await fetchData(`${import.meta.env.VITE_SERVER_URL}/logs/${import.meta.env.VITE_DRONE_ID}`, 'logs', 'isLoadingLogs');
}

async function submitTemperatureLog(event) {
  event.preventDefault();
  const temperature = document.querySelector('#temperature').value;
  if (!temperature) return;

  const body = {
    drone_id: import.meta.env.VITE_DRONE_ID,
    drone_name: import.meta.env.VITE_CUSTOM_DRONE_NAME || state.config.drone_name,
    country:  import.meta.env.VITE_CUSTOM_COUNTRY || state.config.country,
    celsius: temperature
  };

  state.isSubmitting = true;
  renderPage();

  try {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    state.temperatureInputValue = "";
    await getLogs();
    window.location.hash = "#view-logs";
  } catch (error) {
    console.error("Failed to submit temperature log:", error);
  } finally {
    state.isSubmitting = false;
    renderPage();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getConfig();
  getLogs();
  window.addEventListener('hashchange', renderPage);
  renderPage();
});
