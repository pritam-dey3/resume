// Umami identity: fingerprint-first.
// This file is injected after the page's load event (see index.html), so no
// analytics request competes with the app bundle or first paint. It then
// injects the umami tracker (auto-track disabled) and waits for browser idle
// before doing any fingerprinting work.
//
// Endpoints come from window.__UMAMI_CONFIG__ (set in index.html from the
// VITE_UMAMI_* env vars); the values below are the production defaults.
//
// Nothing is sent until the visitor has been identified with their ThumbmarkJS
// id; the pageview is then sent manually, which keeps every event attributed
// to the fingerprint-based session instead of an umami-generated anonymous one.
//
// The visitor IP (from ipapi.co) is stored hex-encoded so it never appears as
// a plaintext IP in Umami. To read it back later:
//   node -e "console.log(Buffer.from(process.argv[1], 'hex').toString())" <hex>

const config = window.__UMAMI_CONFIG__ || {};
const UMAMI_SCRIPT_URL = config.scriptUrl || 'https://umami-sv.pritamdey.in/script.js';
const UMAMI_WEBSITE_ID = config.websiteId || '82e1df0d-3c92-47ba-a807-ab14f2f60575';

function loadUmami() {
  const script = document.createElement('script');
  script.src = UMAMI_SCRIPT_URL;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.dataset.autoTrack = 'false';
  script.async = true;
  document.head.appendChild(script);
}

function encodeIp(ip) {
  let hex = '';
  for (let i = 0; i < ip.length; i++) {
    hex += ip.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

async function initIdentity(attempt = 0) {
  if (!window.umami?.identify || !window.umami?.track) {
    if (attempt < 50) {
      await new Promise((r) => setTimeout(r, 200));
      return initIdentity(attempt + 1);
    }
    return;
  }

  const geoPromise = fetch('https://ipapi.co/json/')
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => data?.ip ? {
      ip: data.ip,
      city: data.city,
      country: data.country_name || data.country,
      countryCode: data.country_code,
      region: data.region,
    } : null)
    .catch(() => null);

  let thumbmarkData = null;

  try {
    await import('https://cdn.jsdelivr.net/npm/@thumbmarkjs/thumbmarkjs/dist/thumbmark.umd.js');
    const t = new window.ThumbmarkJS.Thumbmark();
    const tmData = await t.get();
    const components = tmData?.components || {};

    thumbmarkData = {
      thumbmark: tmData.thumbmark,
      thumbmarkVersion: tmData.version,
      thumbmarkConfidence: tmData.info?.uniqueness?.score,
      tmBrowserName: components.system?.browser?.name,
      tmBrowserVersion: components.system?.browser?.version,
      tmPlatform: components.system?.platform,
      tmLanguage: components.locales?.languages,
      tmTimezone: components.locales?.timezone,
      tmCpuCores: components.system?.hardwareConcurrency,
      tmDeviceMemory: components.hardware?.deviceMemory,
      tmTouchPoints: components.screen?.maxTouchPoints,
      tmWebglRenderer: components.hardware?.videocard?.renderer,
      tmCanvasHash: components.canvas?.commonPixelsHash,
      tmWebglHash: components.webgl?.commonPixelsHash,
      tmAudioHash: components.audio?.sampleHash,
      tmWebrtcHash: components.webrtc?.hash,
      tmMobile: components.system?.mobile,
    };
  } catch {
    thumbmarkData = null;
  }

  const uniqueId = thumbmarkData?.thumbmark || localStorage.getItem('umami-fallback-id') || crypto.randomUUID();
  localStorage.setItem('umami-fallback-id', uniqueId);

  try {
    // Identify first so the session is keyed to the fingerprint id, then send
    // the pageview manually (auto-track is disabled).
    window.umami.identify(uniqueId, thumbmarkData || {});
    window.umami.track();
  } catch {
    // Never attribute events to an anonymous umami session.
    return;
  }

  window.__umamiIdentityReady = true;
  window.dispatchEvent(new Event('umami:identity-ready'));

  const geoData = await geoPromise;

  if (geoData) {
    const { ip, ...geo } = geoData;
    const identityData = { ...(thumbmarkData || {}), ...geo };

    if (ip) {
      identityData.ip = encodeIp(ip);
    }

    window.umami.identify(uniqueId, identityData);
  }
}

const start = () => {
  loadUmami();
  // No forced deadline: fingerprinting only runs when the browser is idle, so
  // it can never jank an active session. If the visitor never idles, we lose
  // that visit's analytics — an accepted trade-off.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initIdentity());
  } else {
    setTimeout(initIdentity, 4000);
  }
};

if (document.readyState === 'complete') {
  start();
} else {
  window.addEventListener('load', start);
}
