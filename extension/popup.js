// Get risk level label based on score
function getRiskLevel(score) {
  if (score > 70) return "High Risk";
  if (score > 40) return "Warning";
  if (score > 0) return "Be cautious";
  return "Safe";
}

// Get risk level color
function getRiskColor(score) {
  if (score > 70) return "#FF5252";  // Red
  if (score > 40) return "#FFA726";  // Orange
  if (score > 0) return "#9A9C49";  // Yellow
  return "#4CAF50";  // Green
}

// Display analysis results
function displayResult(result) {
  const riskScore = result.risk_score || 0;
  const riskLevel = result.status || getRiskLevel(riskScore);
  const riskColor = result.color || getRiskColor(riskScore);
  
  // Update header with color
  const header = document.querySelector('.header');
  header.style.background = `linear-gradient(135deg, ${riskColor} 0%, ${riskColor} 100%)`;
  document.getElementById('riskLevel').textContent = riskLevel;
  
  // Update risk score display with color
  document.getElementById('riskScore').textContent = riskScore;
  document.querySelector('.risk-number').style.color = riskColor;
  
  // Update factors list
  const factorsList = document.getElementById('factorsList');
  factorsList.innerHTML = '';
  
  if (result.flags && result.flags.length > 0) {
    result.flags.forEach(flag => {
      const li = document.createElement('li');
      li.textContent = flag;
      factorsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No suspicious factors detected';
    factorsList.appendChild(li);
  }
  
  // Add bank accounts if found
  if (result.entities_found && result.entities_found.length > 0) {
    const li = document.createElement('li');
    li.textContent = `Blacklisted Account: ${result.entities_found[0]}`;
    factorsList.appendChild(li);
  }
}

// Helpers for resolving API base URL
async function getStoredBaseUrl() {
  return new Promise((resolve) => {
    try {
      chrome.storage?.local?.get(['apiBaseUrl'], (data) => {
        resolve((data?.apiBaseUrl || '').trim());
      });
    } catch {
      resolve('');
    }
  });
}

async function resolveBaseUrl() {
  const stored = await getStoredBaseUrl();
  if (stored) return stored.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.API_BASE_URL && window.API_BASE_URL.trim()) {
    return window.API_BASE_URL.trim().replace(/\/$/, '');
  }
  // Local fallbacks
  return 'http://localhost:5000';
}

async function tryAnalyzeWithFallback(text, image) {
  const primary = await resolveBaseUrl();
  const candidates = [primary];
  const add = (u) => { if (!candidates.includes(u)) candidates.push(u); };
  if (!/localhost/.test(primary)) {
    add('http://localhost:8080');
    add('http://localhost:5000');
  } else {
    if (primary !== 'http://localhost:8080') add('http://localhost:8080');
    if (primary !== 'http://localhost:5000') add('http://localhost:5000');
  }

  const payload = JSON.stringify({ text, image });
  const headers = { 'Content-Type': 'application/json' };
  let lastError = '';

  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/analyze`, { method: 'POST', headers, body: payload });
      if (!res.ok) { lastError = `HTTP ${res.status}`; continue; }
      const data = await res.json();
      try { chrome.storage?.local?.set({ apiBaseUrl: base }, () => {}); } catch {}
      return { data, base };
    } catch (e) {
      lastError = e?.message || 'Network error';
      continue;
    }
  }
  throw new Error(`All backends unreachable. Tried: ${candidates.join(', ')}. Last error: ${lastError}`);
}

// Close button handler
document.getElementById('closeBtn').addEventListener('click', () => { window.close(); });

// Settings: allow user to set API base URL
document.getElementById('settingsBtn').addEventListener('click', async () => {
  const current = await getStoredBaseUrl();
  const input = prompt('Enter API Base URL (e.g., https://<service>.a.run.app)\nLeave empty to use localhost:5000', current);
  if (input === null) return; // cancel
  const val = (input || '').trim();
  chrome.storage?.local?.set({ apiBaseUrl: val }, () => {
    const msg = val ? `Saved: ${val}` : 'Using localhost:5000';
    alert(msg + '\nReload the popup to apply.');
  });
});

// Main analysis logic
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  // Check if we can actually run scripts on this page
  if (tabs[0].url.startsWith("chrome://")) {
    document.getElementById('riskLevel').textContent = "Unavailable";
    document.getElementById('factorsList').innerHTML = '<li>Cannot scan Chrome system pages</li>';
    return;
  }

  chrome.tabs.sendMessage(tabs[0].id, {action: "analyze_text"}, async (response) => {
    // Check if content script responded
    if (chrome.runtime.lastError || !response) {
      document.getElementById('riskLevel').textContent = "Error";
      document.getElementById('factorsList').innerHTML = '<li>Refresh the page and try again</li>';
      console.error(chrome.runtime.lastError?.message || chrome.runtime.lastError);
      return;
    }

    // If we got text, send to backend (with fallback attempts)
    try {
      const { data, base } = await tryAnalyzeWithFallback(response.text, "");
      displayResult(data);
      document.getElementById('factorsList').insertAdjacentHTML('beforeend', `<li style="color:#888">Using backend: ${base}</li>`);
    } catch (error) {
      document.getElementById('riskLevel').textContent = "Error";
      const msg = (error && error.message) ? error.message : 'Backend unreachable.';
      document.getElementById('factorsList').innerHTML = `<li>${msg}</li><li>Click Settings to set API URL or start local server</li>`;
      console.error('Analyze failed:', error);
    }
  });
});