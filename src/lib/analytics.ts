type EventData = Record<string, string | number | boolean>;

let identityReady = typeof window !== "undefined" && window.__umamiIdentityReady === true;
const pending: Array<{ name: string; data?: EventData }> = [];

function send(name: string, data?: EventData) {
  try {
    window.umami?.track(name, data);
  } catch {
    // analytics must never break the site
  }
}

function flush() {
  identityReady = true;
  while (pending.length) {
    const { name, data } = pending.shift()!;
    send(name, data);
  }
}

// Events fired before the visitor is identified (fingerprint computed) are
// queued so none of them land on an umami-generated anonymous session.
export function trackEvent(name: string, data?: EventData) {
  if (identityReady) {
    send(name, data);
    return;
  }
  pending.push({ name, data });
  if (pending.length > 50) pending.shift();
}

if (typeof window !== "undefined") {
  window.addEventListener("umami:identity-ready", flush, { once: true });
}
