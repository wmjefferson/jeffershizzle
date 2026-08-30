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

import { CONFIG } from './config.js';

let manifest = null;
let currentGalleryId = null;
let currentPhotoIndex = null;
let currentFromBrowse = false;

// ---- Bootstrap ----

async function init() {
    showLoader();
    try {
        const resp = await fetch('manifest.json');
        manifest = await resp.json();
        
        if (manifest.config && manifest.config.imageBaseUrl) {
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
    const rawHash = window.location.hash || '#/';
    const isFromBrowse = rawHash.includes('from=browse');
    const cleanHash = rawHash.split('?')[0];
    const parts = cleanHash.replace('#/', '').split('/').filter(Boolean);
    
    if (parts[0] === 'browse') {
        renderBrowse();
    } else if (parts[0] === 'enter') {
        renderGallery(manifest.entry.id, false);
    } else if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
        renderLanding();
    } else if (parts.length === 1) {
        renderGallery(parts[0], isFromBrowse);
    } else if (parts.length === 2) {
        renderEnlarged(parts[0], parseInt(parts[1], 10), isFromBrowse);
    }
}

// ---- Landing Page ----

function renderLanding() {
    currentGalleryId = null;
    currentPhotoIndex = null;
    
    const container = document.getElementById('gallery-content');
    
    // Pick a random background from active landing images
    const landingImages = manifest.landingImages && manifest.landingImages.length > 0 
        ? manifest.landingImages 
        : Array.from({length: 92}, (_, i) => `${String(i + 1).padStart(2, '0')}.jpg`).filter(f => f !== '78.jpg');
    const chosenImage = landingImages[Math.floor(Math.random() * landingImages.length)];
    const bgUrl = `${CONFIG.imageBaseUrl}/landing/${chosenImage}`;
    
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
    document.getElementById('footer-back').style.display = 'none';
    document.getElementById('footer-category').textContent = '';
    hideFooterPersonalLink();
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
}

function showFooterPersonalLink() {
    document.getElementById('footer-personal').style.display = '';
}

function hideFooterPersonalLink() {
    document.getElementById('footer-personal').style.display = 'none';
}

// ---- Gallery Rendering ----

function renderGallery(galleryId, fromBrowse = false) {
    const gallery = manifest.galleries[galleryId];
    if (!gallery) { renderNotFound(galleryId); return; }
    
    currentGalleryId = galleryId;
    currentPhotoIndex = null;
    currentFromBrowse = fromBrowse;
    showBannerText();
    showFooterPersonalLink();
    
    const container = document.getElementById('gallery-content');
    const isEntry = galleryId === manifest.entry.id && !fromBrowse;
    
    // Build photos array
    const photos = gallery.photos && gallery.photos.length > 0 
        ? gallery.photos 
        : (gallery.variants || []);
    
    // Determine layout
    const isGrid = gallery.template.startsWith('grid-');
    
    let wrapperClass = fromBrowse ? 'gallery-wrapper gallery-from-browse' : 'gallery-wrapper';
    
    if (isGrid) {
        const cols = gallery.gridCols || guessGridCols(gallery.template);
        const innerClass = `layout-grid cols-${cols}`;
        
        let gridHtml = '';
        photos.forEach((photo, index) => {
            const imgUrl = `${CONFIG.imageBaseUrl}/${galleryId}/${photo.image}`;
            const clickTarget = fromBrowse ? `#/${galleryId}/${index}?from=browse` : `#/${galleryId}/${index}`;
            if (fromBrowse) {
                gridHtml += `<a href="${clickTarget}"><img data-src="${imgUrl}" alt="" /></a>`;
            } else {
                gridHtml += `<a href="${clickTarget}"><img data-src="${imgUrl}" alt="" /></a>`;
            }
        });
        container.innerHTML = `<div class="${wrapperClass}"><div class="${innerClass}">${gridHtml}</div></div>`;
    } else {
        const innerClass = 'layout-vertical';
        let vertHtml = '';
        photos.forEach((photo, index) => {
            const imgUrl = `${CONFIG.imageBaseUrl}/${galleryId}/${photo.image}`;
            const clickTarget = fromBrowse ? `#/${galleryId}/${index}?from=browse` : `#/${galleryId}/${index}`;
            if (fromBrowse) {
                vertHtml += `<a href="${clickTarget}"><img data-src="${imgUrl}" alt="" /></a>`;
            } else {
                vertHtml += `<a href="${clickTarget}"><img data-src="${imgUrl}" alt="" /></a>`;
            }
        });
        container.innerHTML = `<div class="${wrapperClass}"><div class="${innerClass}">${vertHtml}</div></div>`;
    }
    
    // Update UI
    updateFooter(galleryId, gallery, false, fromBrowse);
    
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

function renderEnlarged(galleryId, photoIndex, fromBrowse = false) {
    const gallery = manifest.galleries[galleryId];
    if (!gallery) { renderNotFound(galleryId); return; }
    
    currentGalleryId = galleryId;
    currentPhotoIndex = photoIndex;
    currentFromBrowse = fromBrowse;
    showBannerText();
    showFooterPersonalLink();
    
    const photos = gallery.photos && gallery.photos.length > 0 
        ? gallery.photos 
        : (gallery.variants || []);
    
    const photo = photos[photoIndex];
    if (!photo) { renderGallery(galleryId); return; }
    
    const container = document.getElementById('gallery-content');
    const imgUrl = `${CONFIG.imageBaseUrl}/${galleryId}/${photo.image}`;
    
    // Browse-origin enlarged views return to browse on click; spiderweb views follow links.
    let nextLink = `#/${galleryId}`;
    if (fromBrowse) {
        nextLink = '#/browse';
    } else if (photo.linksTo) {
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
    
    updateFooter(galleryId, gallery, true, fromBrowse);
    
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
    currentFromBrowse = false;
    showBannerText();
    showFooterPersonalLink();
    
    const container = document.getElementById('gallery-content');
    
    let html = '<div class="gallery-wrapper"><div class="browse-container">';
    html += '<p class="browse-intro">this is an archive, modernized with artificial intelligence, slightly imperfect.</p>';
    html += '<div class="browse-list">';
    
    for (const item of manifest.browse) {
        if (item.galleryId) {
            html += `<a class="browse-item" href="#/${item.galleryId}?from=browse">${item.name}</a>`;
        } else {
            html += `<span class="browse-item" style="opacity:0.3">${item.name}</span>`;
        }
    }
    
    html += '</div></div></div>';
    
    container.innerHTML = html;
    
    document.getElementById('footer-back').style.display = 'none';
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

function updateFooter(galleryId, gallery, isEnlarged, fromBrowse = false) {
    const backLink = document.getElementById('footer-back');
    const categorySpan = document.getElementById('footer-category');
    
    if (isEnlarged && fromBrowse) {
        backLink.style.display = '';
        backLink.href = '#/browse';
        backLink.textContent = 'back.';
        categorySpan.style.display = 'none';
    } else if (isEnlarged) {
        backLink.style.display = '';
        backLink.href = `#/${galleryId}`;
        backLink.textContent = 'back.';
        categorySpan.style.display = 'none';
    } else if (fromBrowse) {
        backLink.style.display = '';
        backLink.href = '#/browse';
        backLink.textContent = 'back.';
        categorySpan.style.display = 'none';
    } else {
        backLink.style.display = 'none';
        backLink.textContent = '';
        categorySpan.style.display = '';
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
            window.location.hash = currentFromBrowse ? `#/${currentGalleryId}?from=browse` : `#/${currentGalleryId}`;
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
            window.location.hash = currentFromBrowse ? `#/${currentGalleryId}/${next}?from=browse` : `#/${currentGalleryId}/${next}`;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = Math.max(currentPhotoIndex - 1, 0);
            window.location.hash = currentFromBrowse ? `#/${currentGalleryId}/${prev}?from=browse` : `#/${currentGalleryId}/${prev}`;
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const photo = photos[currentPhotoIndex];
            if (!currentFromBrowse && photo && photo.linksTo) {
                window.location.hash = `#/${photo.linksTo}`;
            }
        }
    }
});

// ---- Start ----

document.addEventListener('DOMContentLoaded', init);
