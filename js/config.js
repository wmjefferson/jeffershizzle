/**
 * Jeffershizzle SPA — Configuration
 */
const CONFIG = {
    // Production: through Cloudflare Tunnel
    imageBaseUrl: "https://api.jeffershizzle.com/images",

    // Local dev: direct to API
    // imageBaseUrl: "http://localhost:8030/images",

    siteName: "jeffershizzle dotcom",

    // Transition timing (ms)
    fadeOutDuration: 300,
    fadeInDuration: 500,

    // Image loading
    lazyLoadThreshold: 200, // px from viewport
};

// Auto-detect local dev
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.imageBaseUrl = "http://localhost:8030/images";
}
