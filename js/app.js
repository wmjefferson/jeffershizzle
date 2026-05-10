/**
 * Jeffershizzle SPA — Main Application
 * 
 * Hash-based router. Images load hidden, then fade in at 200ms
 * once ALL images on the page have fully loaded.
 * 
 * Routes:
 *   #/           → Entry page (gallery 001)
 *   #/NNN        → Gallery page
 *   #/NNN/N      → Enlarged photo (click to follow spiderweb link)
 *   #/browse     → Alphabetical category listing
 */

let manifest = null;
let currentGalleryId = null;
let currentPhotoIndex = null;

// ---- Bootstrap ----

async function init() {
    showLoader();
    try {
        const resp = await fetch('manifest.json');
        manifest = await resp.json();
        
        // Use local API in dev
        if (!(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            CONFIG.imageBaseUrl = manifest.config.imageBaseUrl;
        }
        
        window.addEventListener('hashchange', onRoute);
        onRoute();
    } catch (err) {
        console.error('Failed to load manifest:', err);
        document.getElementById('gallery-content').innerHTML = 
            '<p style="padding-top:40vh;opacity:0.5">unable to load gallery data.</p>';
    } finally {
        hideLoader();
    }
}

// ---- Router ----

function onRoute() {
    const hash = window.location.hash || '#/';
    const parts = hash.replace('#/', '').split('/').filter(Boolean);
    
    if (parts[0] === 'browse') {
        renderBrowse();
    } else if (parts[0] === 'enter') {
        renderGallery(manifest.entry.id);
    } else if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
        renderLanding();
    } else if (parts.length === 1) {
        renderGallery(parts[0]);
    } else if (parts.length === 2) {
        renderEnlarged(parts[0], parseInt(parts[1], 10));
    }
}

// ---- Landing Page ----

function renderLanding() {
    currentGalleryId = null;
    currentPhotoIndex = null;
    
    const container = document.getElementById('gallery-content');
    
    // Pick a random background from BACK02 (1-92)
    const bgNum = String(Math.floor(Math.random() * 92) + 1).padStart(2, '0');
    const bgUrl = `${CONFIG.imageBaseUrl}/landing/${bgNum}.jpg`;
    
    container.innerHTML = `
        <div class="landing-bg" id="landing-bg"></div>
        <div class="text-window">
            <a href="#/enter">
                <h1>jeffershizzle dotcom.</h1>
            </a>
        </div>
    `;
    
    // Hide banners text on landing, show empty banners
    document.getElementById('site-title').style.visibility = 'hidden';
    document.getElementById('site-nav').style.visibility = 'hidden';
    document.getElementById('footer-back').style.visibility = 'hidden';
    document.getElementById('footer-category').textContent = '';
    hideInstructions();
    
    // Preload background, then fade in
    const bg = document.getElementById('landing-bg');
    const img = new Image();
    img.onload = function() {
        bg.style.backgroundImage = `url(${bgUrl})`;
        bg.classList.add('loaded');
    };
    img.src = bgUrl;
}

function showBannerText() {
    document.getElementById('site-title').style.visibility = '';
    document.getElementById('site-nav').style.visibility = '';
    document.getElementById('footer-back').style.visibility = '';
}

// ---- Gallery Rendering ----

function renderGallery(galleryId) {
    const gallery = manifest.galleries[galleryId];
    if (!gallery) { renderNotFound(galleryId); return; }
    
    currentGalleryId = galleryId;
    currentPhotoIndex = null;
    showBannerText();
    
    const container = document.getElementById('gallery-content');
    const isEntry = galleryId === manifest.entry.id;
    
    // Build photos array
    const photos = gallery.photos && gallery.photos.length > 0 
        ? gallery.photos 
        : (gallery.variants || []);
    
    // Determine layout
    const isGrid = gallery.template.startsWith('grid-');
    const isVertical = gallery.template === 'vertical-scroll' || gallery.template === 'single';
    
    let wrapperClass = 'gallery-wrapper';
    let innerClass = '';
    
    if (isGrid) {
        const cols = gallery.gridCols || guessGridCols(gallery.template);
        innerClass = `layout-grid cols-${cols}`;
    } else {
        innerClass = 'layout-vertical';
    }
    
    // Build HTML
    let html = `<div class="${wrapperClass}"><div class="${innerClass}">`;
    
    photos.forEach((photo, index) => {
        const imgUrl = `${CONFIG.imageBaseUrl}/${galleryId}/${photo.image}`;
        const clickTarget = `#/${galleryId}/${index}`;
        
        html += `<a href="${clickTarget}">`;
        html += `<img data-src="${imgUrl}" alt="" />`;
        html += `</a>`;
    });
    
    html += '</div></div>';
    
    container.innerHTML = html;
    
    // Update UI
    updateFooter(galleryId, gallery);
    
    // Instructions only on entry page
    if (isEntry) {
        showInstructions('click one of the photographs to enlarge.');
    } else {
        hideInstructions();
    }
    
    // Load all images, then fade in
    const wrapper = container.querySelector('.gallery-wrapper');
    loadAllImages(wrapper);
    
    // Scroll to top
    document.getElementById('gallery-container').scrollTop = 0;
}

function renderEnlarged(galleryId, photoIndex) {
    const gallery = manifest.galleries[galleryId];
    if (!gallery) { renderNotFound(galleryId); return; }
    
    currentGalleryId = galleryId;
    currentPhotoIndex = photoIndex;
    showBannerText();
    
    const photos = gallery.photos && gallery.photos.length > 0 
        ? gallery.photos 
        : (gallery.variants || []);
    
    const photo = photos[photoIndex];
    if (!photo) { renderGallery(galleryId); return; }
    
    const container = document.getElementById('gallery-content');
    const imgUrl = `${CONFIG.imageBaseUrl}/${galleryId}/${photo.image}`;
    
    // Where does clicking go?
    let nextLink = `#/${galleryId}`;
    if (photo.linksTo) {
        nextLink = `#/${photo.linksTo}`;
    }
    
    const isEntry = galleryId === manifest.entry.id;
    
    container.innerHTML = `
        <div class="gallery-wrapper">
            <div class="layout-enlarged">
                <a href="${nextLink}">
                    <img data-src="${imgUrl}" alt="" />
                </a>
            </div>
        </div>
    `;
    
    updateFooter(galleryId, gallery, true);
    
    // Instructions only on the entry gallery's enlarged view
    if (isEntry) {
        showInstructions('click again to see more photographs with a similar element.');
    } else {
        hideInstructions();
    }
    
    const wrapper = container.querySelector('.gallery-wrapper');
    loadAllImages(wrapper);
    
    document.getElementById('gallery-container').scrollTop = 0;
}

function renderBrowse() {
    currentGalleryId = null;
    currentPhotoIndex = null;
    showBannerText();
    
    const container = document.getElementById('gallery-content');
    
    let html = '<div class="gallery-wrapper"><div class="browse-container">';
    html += '<div class="browse-list">';
    
    for (const item of manifest.browse) {
        if (item.galleryId) {
            html += `<a class="browse-item" href="#/${item.galleryId}">${item.name}</a>`;
        } else {
            html += `<span class="browse-item" style="opacity:0.3">${item.name}</span>`;
        }
    }
    
    html += '</div></div></div>';
    
    container.innerHTML = html;
    
    document.getElementById('footer-back').href = '#/';
    document.getElementById('footer-back').textContent = 'index.';
    document.getElementById('footer-category').textContent = '';
    hideInstructions();
    
    // No images to load, fade in immediately
    const wrapper = container.querySelector('.gallery-wrapper');
    wrapper.classList.add('loaded');
    
    document.getElementById('gallery-container').scrollTop = 0;
}

function renderNotFound(id) {
    const container = document.getElementById('gallery-content');
    container.innerHTML = `
        <div class="gallery-wrapper loaded" style="padding-top:30vh;text-align:center">
            <p style="opacity:0.5">gallery ${id} not found.</p>
            <p style="margin-top:12px"><a href="#/">back to start.</a></p>
        </div>
    `;
}

// ---- Helpers ----

function guessGridCols(template) {
    // Extract cols from template like "grid-3x2"
    const m = template.match(/grid-(\d+)x(\d+)/);
    if (m) return parseInt(m[1], 10);
    return 2;
}

function updateFooter(galleryId, gallery, isEnlarged) {
    const backLink = document.getElementById('footer-back');
    const categorySpan = document.getElementById('footer-category');
    
    if (isEnlarged) {
        backLink.href = `#/${galleryId}`;
        backLink.textContent = 'back.';
    } else if (galleryId === manifest.entry.id) {
        backLink.href = '#/';
        backLink.textContent = 'index.';
    } else {
        backLink.href = '#/enter';
        backLink.textContent = 'index.';
    }
    
    categorySpan.textContent = gallery.category || '';
}

function showInstructions(text) {
    const el = document.getElementById('instructions');
    document.getElementById('instructions-text').textContent = text;
    el.classList.remove('hidden');
}

function hideInstructions() {
    document.getElementById('instructions').classList.add('hidden');
}

// ---- Image Loading ----
// ALL images load hidden, then fade in together at 200ms

function loadAllImages(wrapper) {
    const images = wrapper.querySelectorAll('img[data-src]');
    
    if (images.length === 0) {
        wrapper.classList.add('loaded');
        return;
    }
    
    let loaded = 0;
    const total = images.length;
    
    function onImageReady() {
        loaded++;
        if (loaded >= total) {
            // All images loaded — fade in
            wrapper.classList.add('loaded');
        }
    }
    
    images.forEach(img => {
        const src = img.dataset.src;
        
        img.onload = onImageReady;
        img.onerror = () => {
            console.warn('Failed to load:', src);
            onImageReady(); // Don't block fade-in for failed images
        };
        
        // Start loading immediately (no lazy load)
        img.src = src;
        delete img.dataset.src;
    });
}

// ---- Loader ----

function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => {
        loader.classList.add('hidden');
        loader.style.opacity = '';
    }, 300);
}

// ---- Keyboard Navigation ----

document.addEventListener('keydown', (e) => {
    if (!manifest) return;
    
    if (e.key === 'Escape') {
        if (currentPhotoIndex !== null) {
            window.location.hash = `#/${currentGalleryId}`;
        } else {
            window.location.hash = '#/';
        }
        return;
    }
    
    if (currentPhotoIndex !== null && currentGalleryId) {
        const gallery = manifest.galleries[currentGalleryId];
        const photos = gallery.photos && gallery.photos.length > 0 
            ? gallery.photos 
            : (gallery.variants || []);
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.min(currentPhotoIndex + 1, photos.length - 1);
            window.location.hash = `#/${currentGalleryId}/${next}`;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = Math.max(currentPhotoIndex - 1, 0);
            window.location.hash = `#/${currentGalleryId}/${prev}`;
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const photo = photos[currentPhotoIndex];
            if (photo && photo.linksTo) {
                window.location.hash = `#/${photo.linksTo}`;
            }
        }
    }
});

// ---- Start ----

document.addEventListener('DOMContentLoaded', init);
