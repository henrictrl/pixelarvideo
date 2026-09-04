// ============================================================
// PIXELAR VÍDEO — app.js
// Engine de imagem herdada do Pixelar original (sem módulo Formas)
// + pipeline de vídeo via FFmpeg.wasm
// ============================================================

// ---------- LÓGICA DE TABS (idêntica ao Pixelar original) ----------
const allTabs = document.querySelectorAll('.d-tab');
allTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.disabled) return;
        const targetId = tab.getAttribute('data-target');
        const targetGroup = document.getElementById(targetId);
        if (!tab.classList.contains('active')) {
            allTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.control-group').forEach(g => g.classList.remove('active'));
            document.querySelectorAll(`[data-target="${targetId}"]`).forEach(t => t.classList.add('active'));
            if (targetGroup) targetGroup.classList.add('active');
        }
    });
});

document.querySelectorAll('.m-sub-btn:not(.reset-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-target');
        const targetItem = document.getElementById(targetId);
        const group = btn.closest('.control-group');
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            if (targetItem) targetItem.classList.remove('active');
        } else {
            group.querySelectorAll('.m-sub-btn:not(.reset-btn)').forEach(b => b.classList.remove('active'));
            group.querySelectorAll('.set-item').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            if (targetItem) targetItem.classList.add('active');
            if (window.innerWidth <= 768) {
                const nav = btn.closest('.m-sub-nav');
                nav.scrollTo({ left: btn.offsetLeft - (nav.offsetWidth / 2) + (btn.offsetWidth / 2), behavior: 'smooth' });
            }
        }
    });
});

function enableEditorTabs(enabled) {
    document.querySelectorAll('.d-tab[data-target^="group-ajustes"], .d-tab[data-target^="group-pixel"], .d-tab[data-target^="group-textura"], .d-tab[data-target^="group-cores"]')
        .forEach(t => { t.disabled = !enabled; });
}

// ---------- TEMA ----------
const themeBtn = document.getElementById('btnThemeToggle');
const themeBtnMenu = document.getElementById('btnThemeToggleMenu');
const rootHtml = document.documentElement;
const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
function updateThemeIcon() { themeBtn.innerHTML = rootHtml.getAttribute('data-theme') === 'dark' ? sunIcon : moonIcon; }
if (localStorage.getItem('pixelarVideoTheme') === 'dark') { rootHtml.setAttribute('data-theme', 'dark'); }
updateThemeIcon();
function toggleTheme() {
    if (rootHtml.getAttribute('data-theme') === 'dark') { rootHtml.removeAttribute('data-theme'); localStorage.setItem('pixelarVideoTheme', 'light'); }
    else { rootHtml.setAttribute('data-theme', 'dark'); localStorage.setItem('pixelarVideoTheme', 'dark'); }
    updateThemeIcon();
}
themeBtn.addEventListener('click', toggleTheme);
themeBtnMenu.addEventListener('click', toggleTheme);

// ---------- ZOOM ----------
let currentZoom = 1; const zoomStep = 0.2; const canvasWrapper = document.getElementById('canvas-wrapper');
function updateZoom() { canvasWrapper.style.transform = `scale(${currentZoom})`; }
document.getElementById('btn-zoom-in').addEventListener('click', () => { currentZoom += zoomStep; updateZoom(); });
document.getElementById('btn-zoom-out').addEventListener('click', () => { currentZoom = Math.max(0.2, currentZoom - zoomStep); updateZoom(); });

function fitImageToView() {
    if (!frameBitmap || !canvas.width) return;
    const stage = document.getElementById('stage');
    const wrapper = canvasWrapper;
    let availableHeight = stage.clientHeight; let availableWidth = stage.clientWidth;
    if (availableHeight < 50) availableHeight = 50;
    if (availableWidth < 50) availableWidth = 50;
    const imgAspect = frameBitmap.width / frameBitmap.height;
    const targetContentH = Math.min(availableHeight, availableWidth / imgAspect);
    const wrapperW = wrapper.clientWidth; const wrapperH = wrapper.clientHeight;
    if (wrapperW === 0 || wrapperH === 0) return;
    const renderedCanvasH = Math.min(wrapperH, wrapperW / imgAspect);
    if (renderedCanvasH <= 0) return;
    currentZoom = Math.max(0.2, Math.min(5, targetContentH / renderedCanvasH));
    updateZoom();
}

// ---------- BARRA DE CARREGAMENTO SUTIL ----------
const loadingContainer = document.getElementById('loading-bar-container');
let loadingTimeout = null;
function showLoading() { if (loadingTimeout) clearTimeout(loadingTimeout); loadingTimeout = setTimeout(() => { loadingContainer.style.display = 'block'; }, 100); }
function hideLoading() { if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null; } loadingContainer.style.display = 'none'; }

// ---------- FULLSCREEN ----------
document.getElementById('btn-fs-view').addEventListener('click', () => { document.body.classList.toggle('is-fullscreen'); setTimeout(fitImageToView, 300); });
document.getElementById('btn-exit-fullscreen').addEventListener('click', () => { document.body.classList.remove('is-fullscreen'); setTimeout(fitImageToView, 300); });
document.addEventListener('keydown', (e) => { if (e.key === "Escape" && document.body.classList.contains('is-fullscreen')) { document.body.classList.remove('is-fullscreen'); setTimeout(fitImageToView, 300); } });

// ---------- HELPERS DE COR (idênticos ao Pixelar original) ----------
function hexToRgb(hex) { let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 }; }
function rgbToHex(r, g, b) { return "#" + (1 << 24 | Math.max(0, Math.min(255, r)) << 16 | Math.max(0, Math.min(255, g)) << 8 | Math.max(0, Math.min(255, b))).toString(16).slice(1).toUpperCase(); }
function rgbToHsl(r, g, b) { r /= 255; g /= 255; b /= 255; let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) { h = s = 0; } else { let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return { h, s, l }; }
function hslToRgb(h, s, l) { let r, g, b; if (s === 0) { r = g = b = l; } else { const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q; r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3); } return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }; }
function interpolatePalette(anchors, size) {
    if (size <= anchors.length) return anchors.slice(0, size); let result = [];
    for (let i = 0; i < size; i++) {
        let t = i / (size - 1); let scaledT = t * (anchors.length - 1); let idx1 = Math.floor(scaledT); let idx2 = Math.min(idx1 + 1, anchors.length - 1); let localT = scaledT - idx1; let c1 = anchors[idx1]; let c2 = anchors[idx2];
        result.push({ r: Math.round(c1.r + (c2.r - c1.r) * localT), g: Math.round(c1.g + (c2.g - c1.g) * localT), b: Math.round(c1.b + (c2.b - c1.b) * localT) });
    }
    return result;
}
const clone = (arr) => arr.map(c => ({ ...c }));

// ---------- ESTADO GLOBAL ----------
let frameBitmap = null;           // ImageBitmap/Image do frame escolhido (fonte para o editor)
let currentPaletteMode = 'original'; let globalCurrentPalette = []; let basePalette = [];
let isImageInverted = false; let isShadowsInverted = false; let isMidDitherEnabled = false; let groupMethod = 'mean';
let savedPalettes = {};
try { savedPalettes = JSON.parse(localStorage.getItem('pixelarVideoPalettes')) || {}; } catch (e) {}

let ditherCanvas = document.createElement('canvas');
const canvas = document.getElementById('outputCanvas');
const ctx = canvas.getContext('2d');

function setBasePalette(pal) { basePalette = clone(pal); document.getElementById('palHue').value = 0; document.getElementById('palSat').value = 0; document.getElementById('palLight').value = 0; updateBadges(); buildColorInputs(globalCurrentPalette); }

function applyGlobalPaletteOffsets() {
    if (basePalette.length === 0) return;
    let hOffset = parseInt(document.getElementById('palHue').value, 10) / 360; let sOffset = parseInt(document.getElementById('palSat').value, 10) / 100; let lOffset = parseInt(document.getElementById('palLight').value, 10) / 100;
    globalCurrentPalette = basePalette.map(c => {
        let hsl = rgbToHsl(c.r, c.g, c.b); hsl.h = (hsl.h + hOffset + 1) % 1; hsl.s = Math.max(0, Math.min(1, hsl.s + sOffset)); hsl.l = Math.max(0, Math.min(1, hsl.l + lOffset)); return hslToRgb(hsl.h, hsl.s, hsl.l);
    });
    buildColorInputs(globalCurrentPalette); scheduleProcess();
}

function buildColorInputs(palette) {
    const grid = document.getElementById('colorsGrid'); grid.innerHTML = ''; let viewPal = palette.slice(0, 64);
    viewPal.forEach((color, i) => {
        const inp = document.createElement('input'); inp.type = 'color'; inp.className = 'color-btn'; let hex = rgbToHex(color.r, color.g, color.b); inp.value = hex;
        inp.addEventListener('change', (e) => { currentPaletteMode = 'manual'; basePalette = clone(globalCurrentPalette); document.getElementById('palHue').value = 0; document.getElementById('palSat').value = 0; document.getElementById('palLight').value = 0; updateBadges(); let newColor = hexToRgb(e.target.value); basePalette[i] = newColor; globalCurrentPalette[i] = newColor; buildColorInputs(globalCurrentPalette); scheduleProcess(); });
        grid.appendChild(inp);
    });
}

function updateBadgeSingle(id, val, def, f = '') {
    const el = document.getElementById(id);
    if (el) { const v = parseFloat(val); if (v !== def && v !== 0 && !isNaN(v)) { el.textContent = v + f; el.style.display = 'block'; } else { el.style.display = 'none'; } }
}
function updateBadges() {
    updateBadgeSingle('bdg-est', document.getElementById('estrutura').value, 0); updateBadgeSingle('bdg-exp', document.getElementById('exposicao').value, 0); updateBadgeSingle('bdg-bri', document.getElementById('brilho').value, 0); updateBadgeSingle('bdg-con', document.getElementById('contraste').value, 0); updateBadgeSingle('bdg-tem', document.getElementById('temperatura').value, 0); updateBadgeSingle('bdg-sat', document.getElementById('saturacao').value, 0); updateBadgeSingle('bdg-som', document.getElementById('sombras').value, 0); updateBadgeSingle('bdg-pos', document.getElementById('posterize').value, 0); updateBadgeSingle('bdg-abe', document.getElementById('rgbShift').value, 0);
    updateBadgeSingle('bdg-px', document.getElementById('pxSize').value, 1); updateBadgeSingle('bdg-grp', document.getElementById('groupStrength').value, 0);
    updateBadgeSingle('bdg-dPat', document.getElementById('ditherSelect').value === 'none' ? 0 : 1, 0, '*');
    updateBadgeSingle('bdg-dSca', document.getElementById('ditherScale').value, 1); updateBadgeSingle('bdg-dInt', document.getElementById('ditherIntensity').value, 100, '%'); updateBadgeSingle('bdg-dAng', document.getElementById('texAngle').value, 45, '°'); updateBadgeSingle('bdg-edg', document.getElementById('edgePixelSize').value, 0);

    const tO = document.getElementById('textureOpacity').value; const eO = document.getElementById('edgeOpacity').value; const bdgOpa = document.getElementById('bdg-opa');
    if (bdgOpa) { if ((tO != 100 && tO != 0) || (eO != 100 && eO != 0)) { bdgOpa.textContent = '*'; bdgOpa.style.display = 'block'; } else { bdgOpa.style.display = 'none'; } }

    const ph = document.getElementById('palHue').value; const ps = document.getElementById('palSat').value; const pl = document.getElementById('palLight').value; const bcAju = document.getElementById('bdg-corAju');
    if (bcAju) { if (ph != 0 || ps != 0 || pl != 0) { bcAju.textContent = '*'; bcAju.style.display = 'block'; } else { bcAju.style.display = 'none'; } }
}

function resetAdjustments(e) {
    if (e) e.stopPropagation();
    ['estrutura', 'exposicao', 'brilho', 'contraste', 'temperatura', 'saturacao', 'sombras', 'posterize', 'rgbShift'].forEach(id => document.getElementById(id).value = 0);
    isShadowsInverted = false; document.getElementById('btnInvertShadows').classList.remove('active-state');
    updateBadges(); scheduleProcess();
}
function resetPixel(e) {
    if (e) e.stopPropagation();
    document.getElementById('pxSize').value = 1; document.getElementById('groupStrength').value = 0;
    groupMethod = 'mean'; document.getElementById('btnGroupMean').classList.add('active-state'); document.getElementById('btnGroupMode').classList.remove('active-state');
    updateBadges(); scheduleProcess();
}
function resetDither(e) {
    if (e) e.stopPropagation();
    document.getElementById('ditherSelect').value = 'none'; document.getElementById('ditherScale').value = 1;
    document.getElementById('ditherIntensity').value = 100; document.getElementById('texAngle').value = 45;
    isMidDitherEnabled = false; document.getElementById('btnEffMidDither').classList.remove('active-state');
    document.getElementById('textureOpacity').value = 100; document.getElementById('edgeOpacity').value = 100;
    document.getElementById('edgePixelSize').value = 0; updateBadges(); scheduleProcess();
}
function resetColors(e) {
    if (e) e.stopPropagation();
    isImageInverted = false; currentPaletteMode = 'original';
    document.getElementById('colorSelect').value = 'all';
    globalCurrentPalette = []; setBasePalette([]); scheduleProcess();
}

document.querySelectorAll('.reset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = btn.getAttribute('data-target');
        if (target === 'ajustes') resetAdjustments(e);
        if (target === 'pixel') resetPixel(e);
        if (target === 'ditherSelect') resetDither(e);
        if (target === 'colors') resetColors(e);
    });
});

document.getElementById('btnInvertShadows').addEventListener('click', (e) => { isShadowsInverted = !isShadowsInverted; e.currentTarget.classList.toggle('active-state', isShadowsInverted); scheduleProcess(); });
document.getElementById('btnGroupMean').addEventListener('click', (e) => { groupMethod = 'mean'; e.currentTarget.classList.add('active-state'); document.getElementById('btnGroupMode').classList.remove('active-state'); scheduleProcess(); });
document.getElementById('btnGroupMode').addEventListener('click', (e) => { groupMethod = 'mode'; e.currentTarget.classList.add('active-state'); document.getElementById('btnGroupMean').classList.remove('active-state'); scheduleProcess(); });
document.getElementById('btnEffMidDither').addEventListener('click', (e) => { isMidDitherEnabled = !isMidDitherEnabled; e.currentTarget.classList.toggle('active-state', isMidDitherEnabled); scheduleProcess(); });
document.getElementById('btnInvert').addEventListener('click', (e) => { e.stopPropagation(); currentPaletteMode = 'manual'; isImageInverted = !isImageInverted; globalCurrentPalette = globalCurrentPalette.map(c => ({ r: 255 - c.r, g: 255 - c.g, b: 255 - c.b })); setBasePalette(globalCurrentPalette); scheduleProcess(); });

const processInputs = ['pxSize', 'estrutura', 'exposicao', 'brilho', 'contraste', 'temperatura', 'saturacao', 'sombras', 'posterize', 'rgbShift', 'groupStrength', 'ditherSelect', 'ditherScale', 'ditherIntensity', 'texAngle', 'edgeColor', 'edgePixelSize', 'colorSelect'];
processInputs.forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', () => { updateBadges(); scheduleProcess(); }); });
document.getElementById('textureOpacity').addEventListener('input', () => { updateBadges(); scheduleProcess(); });
document.getElementById('edgeOpacity').addEventListener('input', () => { updateBadges(); scheduleProcess(); });

document.getElementById('palHue').addEventListener('input', applyGlobalPaletteOffsets);
document.getElementById('palSat').addEventListener('input', applyGlobalPaletteOffsets);
document.getElementById('palLight').addEventListener('input', applyGlobalPaletteOffsets);

globalCurrentPalette = [hexToRgb('#2C2C2C'), hexToRgb('#D62828'), hexToRgb('#FFD166'), hexToRgb('#00C2A8')];
// paleta inicial fica "adormecida" até o usuário sair do modo 'original' ou carregar um frame

function renderPalettes() {
    const grid = document.getElementById('savedPalettesGrid'); grid.innerHTML = '';
    for (let key in savedPalettes) {
        const div = document.createElement('div'); div.style.display = "flex"; div.style.width = "100%"; div.style.marginBottom = "4px";
        const b = document.createElement('button'); b.className = "std-btn"; b.style.flex = "1 1 0%"; b.style.minWidth = "0"; b.style.display = "flex"; b.style.alignItems = "center"; b.style.padding = "2px 4px";
        const colorStrip = document.createElement('div'); colorStrip.style.display = "flex"; colorStrip.style.flex = "1 1 0%"; colorStrip.style.height = "16px"; colorStrip.style.marginRight = "6px";
        let viewP = savedPalettes[key].slice(0, 8); viewP.forEach(c => { const cDiv = document.createElement('div'); cDiv.style.flex = "1"; cDiv.style.backgroundColor = rgbToHex(c.r, c.g, c.b); colorStrip.appendChild(cDiv); });
        const label = document.createElement('span'); label.textContent = key; label.style.fontSize = "0.75rem"; label.style.paddingRight = "4px"; b.appendChild(colorStrip); b.appendChild(label);
        b.onclick = () => { isImageInverted = false; currentPaletteMode = 'preset'; globalCurrentPalette = [...savedPalettes[key]]; setBasePalette(globalCurrentPalette); scheduleProcess(); };
        const db = document.createElement('button'); db.className = "std-btn icon-btn"; db.innerHTML = "<svg viewBox='0 0 24 24'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg>"; db.style.marginLeft = "4px";
        db.onclick = () => { delete savedPalettes[key]; try { localStorage.setItem('pixelarVideoPalettes', JSON.stringify(savedPalettes)); } catch (e) {} renderPalettes(); };
        div.appendChild(b); div.appendChild(db); grid.appendChild(div);
    }
}
document.getElementById('btnSavePalette').addEventListener('click', () => { if (document.getElementById('colorSelect').value === 'all') { alert("O modo cores originais está ativo. Mude para um número específico de cores para gerar uma paleta e salvá-la."); return; } let name = prompt("Dê um nome para esta paleta:"); if (!name) return; savedPalettes[name] = [...globalCurrentPalette]; try { localStorage.setItem('pixelarVideoPalettes', JSON.stringify(savedPalettes)); } catch (e) {} renderPalettes(); });
document.getElementById('btnOriginal').addEventListener('click', () => { resetColors(); });

document.querySelectorAll('.shuffle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tgt = btn.getAttribute('data-target');
        if (tgt === 'pxSize') { document.getElementById('pxSize').value = 1 + Math.floor(Math.random() * 10); }
        if (tgt === 'colors') { randColorsGen(); }
        updateBadges(); scheduleProcess();
    });
});

window.lastRandomHue = window.lastRandomHue || Math.random();
function randColorsGen() {
    isImageInverted = false;
    let qty = parseInt(document.getElementById('colorSelect').value, 10);
    if (isNaN(qty)) { qty = [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)]; document.getElementById('colorSelect').value = qty.toString(); }
    currentPaletteMode = 'random';
    window.lastRandomHue = (window.lastRandomHue + 0.381966) % 1; let baseHue = window.lastRandomHue; let anchors = []; let algo = Math.floor(Math.random() * 5);
    if (algo === 0) anchors = [hslToRgb(baseHue, 0.9, 0.2), hslToRgb(baseHue, 0.8, 0.8), hslToRgb((baseHue + 0.5) % 1, 0.9, 0.3), hslToRgb((baseHue + 0.5) % 1, 0.8, 0.8)];
    else if (algo === 1) anchors = [hslToRgb(baseHue, 0.9, 0.2), hslToRgb((baseHue + 0.33) % 1, 0.8, 0.5), hslToRgb((baseHue + 0.66) % 1, 0.8, 0.5), hslToRgb(baseHue, 0.1, 0.9)];
    else if (algo === 2) anchors = [hslToRgb(baseHue, 0.9, 0.1), hslToRgb(baseHue, 1.0, 0.3), hslToRgb(baseHue, 0.8, 0.6), hslToRgb(baseHue, 0.6, 0.8), hslToRgb(baseHue, 0.2, 0.95)];
    else if (algo === 3) anchors = [hslToRgb(baseHue, 0.8, 0.15), hslToRgb((baseHue + 0.15) % 1, 0.7, 0.4), hslToRgb((baseHue + 0.85) % 1, 0.7, 0.7), hslToRgb(baseHue, 0.2, 0.9)];
    else { let numAnchors = 3 + Math.floor(Math.random() * 4); for (let i = 0; i < numAnchors; i++) { anchors.push(hslToRgb((baseHue + i * 0.15) % 1, 0.6 + Math.random() * 0.4, 0.1 + Math.random() * 0.8)); } anchors.sort((a, b) => (0.3 * a.r + 0.59 * a.g + 0.11 * a.b) - (0.3 * b.r + 0.59 * b.g + 0.11 * b.b)); }
    globalCurrentPalette = interpolatePalette(anchors, qty); setBasePalette(globalCurrentPalette);
}

renderPalettes();

// ============================================================
// ENGINE DE PROCESSAMENTO DE IMAGEM
// (adaptado do Pixelar original — sem módulo de Formas)
// ============================================================

function getMedianCut(pixels, count) {
    if (!pixels.length) return [{ r: 0, g: 0, b: 0, count: 0 }];
    let buckets = [pixels];
    while (buckets.length < count) {
        let maxR = -1, targetIdx = -1, axis = 'r';
        for (let i = 0; i < buckets.length; i++) {
            let b = buckets[i]; if (b.length < 2) continue;
            let rm = 255, rx = 0, gm = 255, gx = 0, bm = 255, bx = 0;
            for (let p of b) { if (p.r < rm) rm = p.r; if (p.r > rx) rx = p.r; if (p.g < gm) gm = p.g; if (p.g > gx) gx = p.g; if (p.b < bm) bm = p.b; if (p.b > bx) bx = p.b; }
            let rng = Math.max(rx - rm, gx - gm, bx - bm);
            if (rng > maxR) { maxR = rng; targetIdx = i; axis = (rx - rm === rng) ? 'r' : (gx - gm === rng) ? 'g' : 'b'; }
        }
        if (targetIdx === -1) break;
        let b = buckets[targetIdx]; b.sort((a, c) => a[axis] - c[axis]); let mid = Math.floor(b.length / 2);
        buckets.splice(targetIdx, 1, b.slice(0, mid), b.slice(mid));
    }
    return buckets.map(b => {
        if (!b.length) return { r: 0, g: 0, b: 0, count: 0 };
        let r = 0, g = 0, bl = 0; for (let p of b) { r += p.r; g += p.g; bl += p.b; }
        return { r: Math.round(r / b.length), g: Math.round(g / b.length), b: Math.round(bl / b.length), count: b.length };
    });
}

let pendingProcess = null;
function scheduleProcess() {
    if (pendingProcess) clearTimeout(pendingProcess);
    if (!frameBitmap) return;
    showLoading();
    pendingProcess = setTimeout(() => { processCoreEffects(); }, 150);
}

let engineDataCache = null;

// getStateObject() é definido para pegar valores da UI. Para uso no encode de vídeo
// (fora da UI, dentro do worker de frames), usamos runEngineOnBitmap() com um "state"
// explícito — assim a mesma lógica serve tanto para preview quanto para o vídeo inteiro.
function getUIState() {
    return {
        px: parseInt(document.getElementById('pxSize').value, 10),
        colorSelect: document.getElementById('colorSelect').value,
        groupStrength: parseInt(document.getElementById('groupStrength').value, 10),
        groupMethod: groupMethod,
        estrutura: parseInt(document.getElementById('estrutura').value, 10),
        exposicao: parseInt(document.getElementById('exposicao').value, 10),
        brilho: parseInt(document.getElementById('brilho').value, 10),
        sombras: parseInt(document.getElementById('sombras').value, 10),
        saturacao: parseInt(document.getElementById('saturacao').value, 10),
        contraste: parseInt(document.getElementById('contraste').value, 10),
        temperatura: parseInt(document.getElementById('temperatura').value, 10),
        posterize: parseInt(document.getElementById('posterize').value, 10),
        ditherSelect: document.getElementById('ditherSelect').value,
        ditherScale: parseInt(document.getElementById('ditherScale').value, 10),
        ditherIntensity: parseInt(document.getElementById('ditherIntensity').value, 10),
        texAngle: parseInt(document.getElementById('texAngle').value, 10),
        isShadowsInverted: isShadowsInverted,
        isMidDitherEnabled: isMidDitherEnabled,
        rgbShift: parseInt(document.getElementById('rgbShift').value, 10),
        edgeColor: document.getElementById('edgeColor').value,
        edgePixelSize: parseInt(document.getElementById('edgePixelSize').value, 10),
        textureOpacity: parseInt(document.getElementById('textureOpacity').value, 10),
        edgeOpacity: parseInt(document.getElementById('edgeOpacity').value, 10),
        isImageInverted: isImageInverted,
        currentPaletteMode: currentPaletteMode,
        palette: globalCurrentPalette.map(c => ({ ...c }))
    };
}

// Devolve o objeto de ESTILO exportável (sem dados do frame/vídeo original)
function getStyleExportObject() {
    return {
        _app: 'pixelar-video', _v: 1,
        px: document.getElementById('pxSize').value, col: document.getElementById('colorSelect').value,
        dith: document.getElementById('ditherSelect').value, grp: document.getElementById('groupStrength').value, gMod: groupMethod,
        est: document.getElementById('estrutura').value, exp: document.getElementById('exposicao').value, bri: document.getElementById('brilho').value,
        som: document.getElementById('sombras').value, sat: document.getElementById('saturacao').value, cont: document.getElementById('contraste').value,
        temp: document.getElementById('temperatura').value, post: document.getElementById('posterize').value,
        dScale: document.getElementById('ditherScale').value, dInt: document.getElementById('ditherIntensity').value, tAng: document.getElementById('texAngle').value,
        shInv: isShadowsInverted, effMidDither: isMidDitherEnabled,
        cc: globalCurrentPalette.map(c => rgbToHex(c.r, c.g, c.b)), palMode: currentPaletteMode, inv: isImageInverted,
        rSht: document.getElementById('rgbShift').value, edgC: document.getElementById('edgeColor').value, edgSiz: document.getElementById('edgePixelSize').value,
        pHue: document.getElementById('palHue').value, pSat: document.getElementById('palSat').value, pLig: document.getElementById('palLight').value,
        tOpa: document.getElementById('textureOpacity').value, eOpa: document.getElementById('edgeOpacity').value
    };
}

function applyStyleImport(p) {
    document.getElementById('pxSize').value = p.px !== undefined ? p.px : 1;
    document.getElementById('colorSelect').value = p.col !== undefined ? p.col : 'all';
    document.getElementById('ditherSelect').value = p.dith !== undefined ? p.dith : 'none';
    document.getElementById('groupStrength').value = p.grp !== undefined ? p.grp : 0;
    groupMethod = p.gMod || 'mean';
    document.getElementById('btnGroupMean').classList.toggle('active-state', groupMethod === 'mean');
    document.getElementById('btnGroupMode').classList.toggle('active-state', groupMethod === 'mode');
    document.getElementById('estrutura').value = p.est !== undefined ? p.est : 0;
    document.getElementById('exposicao').value = p.exp !== undefined ? p.exp : 0;
    document.getElementById('brilho').value = p.bri !== undefined ? p.bri : 0;
    document.getElementById('sombras').value = p.som !== undefined ? p.som : 0;
    document.getElementById('saturacao').value = p.sat !== undefined ? p.sat : 0;
    document.getElementById('contraste').value = p.cont !== undefined ? p.cont : 0;
    document.getElementById('temperatura').value = p.temp !== undefined ? p.temp : 0;
    document.getElementById('posterize').value = p.post !== undefined ? p.post : 0;
    document.getElementById('ditherScale').value = p.dScale !== undefined ? p.dScale : 1;
    document.getElementById('ditherIntensity').value = p.dInt !== undefined ? p.dInt : 100;
    document.getElementById('texAngle').value = p.tAng !== undefined ? p.tAng : 45;
    isMidDitherEnabled = p.effMidDither || false; document.getElementById('btnEffMidDither').classList.toggle('active-state', isMidDitherEnabled);
    isShadowsInverted = p.shInv || false; document.getElementById('btnInvertShadows').classList.toggle('active-state', isShadowsInverted);
    document.getElementById('rgbShift').value = p.rSht !== undefined ? p.rSht : 0;
    if (p.edgC) document.getElementById('edgeColor').value = p.edgC;
    if (p.edgSiz !== undefined) document.getElementById('edgePixelSize').value = p.edgSiz;
    if (p.tOpa !== undefined) document.getElementById('textureOpacity').value = p.tOpa;
    if (p.eOpa !== undefined) document.getElementById('edgeOpacity').value = p.eOpa;
    if (p.pHue !== undefined) document.getElementById('palHue').value = p.pHue;
    if (p.pSat !== undefined) document.getElementById('palSat').value = p.pSat;
    if (p.pLig !== undefined) document.getElementById('palLight').value = p.pLig;

    currentPaletteMode = p.palMode || 'manual'; isImageInverted = p.inv || false;
    if (p.cc && p.cc.length > 0) { globalCurrentPalette = p.cc.map(hexToRgb); setBasePalette(globalCurrentPalette); }

    updateBadges(); scheduleProcess();
}

// Núcleo de efeitos: recebe um bitmap (frame) + state e devolve engineData (sem paleta final ainda,
// pois a paleta pode depender de amostragem "original" — resolvida depois em resolvePalette()).
function computeEngineData(bitmapSrc, state) {
    const px = state.px;
    const estBoost = state.estrutura / 100;
    const expBoost = Math.pow(2, state.exposicao / 50);
    const brBoost = state.brilho;
    const shBoost = state.sombras;
    const satBoost = state.saturacao / 100;
    const contValue = state.contraste;
    const tempBoost = state.temperatura;
    const postVal = state.posterize;
    const posterLevels = postVal > 0 ? Math.max(2, Math.round(16 - (postVal / 100) * 14)) : 0;
    const contFactor = (259 * (contValue + 255)) / (255 * (259 - contValue));
    const uiGroupStrength = state.groupStrength;
    const passes = Math.ceil(uiGroupStrength / 5);

    const origW = bitmapSrc.width; const origH = bitmapSrc.height;
    const smallW = Math.max(1, Math.floor(origW / px));
    const smallH = Math.max(1, Math.floor(origH / px));

    const smallCanvas = document.createElement('canvas'); smallCanvas.width = smallW; smallCanvas.height = smallH;
    const sCtx = smallCanvas.getContext('2d', { willReadFrequently: true });
    sCtx.imageSmoothingEnabled = false;
    sCtx.drawImage(bitmapSrc, 0, 0, origW, origH, 0, 0, smallW, smallH);

    let imgData = sCtx.getImageData(0, 0, smallW, smallH); let d = imgData.data;

    let minL = 255, maxL = 0;
    if (estBoost > 0) {
        let tempD = new Uint8ClampedArray(d);
        for (let y = 1; y < smallH - 1; y++) {
            for (let x = 1; x < smallW - 1; x++) {
                let i = (y * smallW + x) * 4;
                if (d[i + 3] < 127) continue;
                for (let c = 0; c < 3; c++) {
                    let val = 5 * tempD[i + c] - tempD[i - smallW * 4 + c] - tempD[i + smallW * 4 + c] - tempD[i - 4 + c] - tempD[i + 4 + c];
                    d[i + c] = Math.min(255, Math.max(0, tempD[i + c] + (val - tempD[i + c]) * estBoost));
                }
            }
        }
    }

    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 127) { d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 0; continue; }
        let r = d[i], g = d[i + 1], b = d[i + 2];
        r = r * expBoost + brBoost; g = g * expBoost + brBoost; b = b * expBoost + brBoost;
        if (contValue !== 0) { r = contFactor * (r - 128) + 128; g = contFactor * (g - 128) + 128; b = contFactor * (b - 128) + 128; }
        if (tempBoost !== 0) { r += tempBoost; b -= tempBoost; }
        r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
        if (state.isImageInverted) { r = 255 - r; g = 255 - g; b = 255 - b; }
        let luma = 0.3 * r + 0.59 * g + 0.11 * b;
        if (satBoost !== 0) { const satScale = 1 + satBoost; r = luma + (r - luma) * satScale; g = luma + (g - luma) * satScale; b = luma + (b - luma) * satScale; }
        if (shBoost !== 0 && luma < 128) { let factor = (128 - luma) / 128; r += shBoost * factor; g += shBoost * factor; b += shBoost * factor; }
        if (posterLevels > 0) { r = Math.round((r / 255) * (posterLevels - 1)) * (255 / (posterLevels - 1)); g = Math.round((g / 255) * (posterLevels - 1)) * (255 / (posterLevels - 1)); b = Math.round((b / 255) * (posterLevels - 1)) * (255 / (posterLevels - 1)); }
        d[i] = Math.min(255, Math.max(0, r)); d[i + 1] = Math.min(255, Math.max(0, g)); d[i + 2] = Math.min(255, Math.max(0, b)); d[i + 3] = 255;
        let fluma = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; if (fluma < minL) minL = fluma; if (fluma > maxL) maxL = fluma;
    }

    if (passes > 0) {
        let srcData = new Uint8ClampedArray(d); let dstData = new Uint8ClampedArray(d);
        for (let p = 0; p < passes; p++) {
            for (let y = 0; y < smallH; y++) {
                for (let x = 0; x < smallW; x++) {
                    let idx = (y * smallW + x) * 4; if (srcData[idx + 3] === 0) { dstData[idx + 3] = 0; continue; }
                    if (state.groupMethod === 'mode') {
                        let counts = new Map(); let maxCount = 0; let modeColor = { r: srcData[idx], g: srcData[idx + 1], b: srcData[idx + 2] };
                        for (let dy = -1; dy <= 1; dy++) {
                            let ny = y + dy; if (ny < 0 || ny >= smallH) continue;
                            for (let dx = -1; dx <= 1; dx++) {
                                let nx = x + dx; if (nx < 0 || nx >= smallW) continue;
                                let nidx = (ny * smallW + nx) * 4;
                                if (srcData[nidx + 3] > 0) {
                                    let key = (srcData[nidx] << 16) | (srcData[nidx + 1] << 8) | srcData[nidx + 2];
                                    let curr = (counts.get(key) || 0) + 1; counts.set(key, curr);
                                    if (curr > maxCount) { maxCount = curr; modeColor = { r: srcData[nidx], g: srcData[nidx + 1], b: srcData[nidx + 2] }; }
                                }
                            }
                        }
                        dstData[idx] = modeColor.r; dstData[idx + 1] = modeColor.g; dstData[idx + 2] = modeColor.b; dstData[idx + 3] = srcData[idx + 3];
                    } else {
                        let r = srcData[idx], g = srcData[idx + 1], b = srcData[idx + 2]; let sumR = 0, sumG = 0, sumB = 0, count = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            let ny = y + dy; if (ny < 0 || ny >= smallH) continue;
                            for (let dx = -1; dx <= 1; dx++) {
                                let nx = x + dx; if (nx < 0 || nx >= smallW) continue;
                                let nidx = (ny * smallW + nx) * 4;
                                if (srcData[nidx + 3] > 0) {
                                    let nr = srcData[nidx], ng = srcData[nidx + 1], nb = srcData[nidx + 2];
                                    if (Math.abs(nr - r) + Math.abs(ng - g) + Math.abs(nb - b) < 150) { sumR += nr; sumG += ng; sumB += nb; count++; }
                                }
                            }
                        }
                        dstData[idx] = sumR / count; dstData[idx + 1] = sumG / count; dstData[idx + 2] = sumB / count; dstData[idx + 3] = srcData[idx + 3];
                    }
                }
            }
            srcData.set(dstData);
        }
        d.set(dstData);
    }

    return { data: d, w: smallW, h: smallH, minL, maxL };
}

function resolvePaletteForFrame(engineData, state) {
    const cLimitStr = state.colorSelect;
    let usePalette = (cLimitStr !== 'all'); let targetColors = usePalette ? parseInt(cLimitStr, 10) : 256;
    if (state.currentPaletteMode === 'original' && usePalette) {
        const d = engineData.data; const smallW = engineData.w; const smallH = engineData.h;
        const step = 4 * Math.max(1, Math.floor((smallW * smallH) / 4000));
        let pxs = [];
        for (let i = 0; i < d.length; i += step) if (d[i + 3] > 127) pxs.push({ r: d[i], g: d[i + 1], b: d[i + 2] });
        let baseCount = Math.max(targetColors, 16); let basePal = getMedianCut(pxs, baseCount);
        if (targetColors < baseCount) {
            let mapped = basePal.map(c => ({ col: { r: c.r, g: c.g, b: c.b }, count: c.count, luma: 0.3 * c.r + 0.59 * c.g + 0.11 * c.b }));
            mapped.sort((a, b) => b.count - a.count);
            let pool = mapped.slice(0, Math.max(targetColors * 2, 4));
            pool.sort((a, b) => a.luma - b.luma);
            let darkest = pool[0]; let lightest = pool[pool.length - 1]; let finalPalette = [darkest, lightest];
            mapped = mapped.filter(x => x !== darkest && x !== lightest); mapped.sort((a, b) => b.count - a.count);
            for (let i = 0; i < targetColors - 2; i++) { if (mapped[i]) finalPalette.push(mapped[i]); }
            return { palette: finalPalette.map(x => x.col), usePal: true };
        }
        return { palette: basePal.map(c => ({ r: c.r, g: c.g, b: c.b })), usePal: true };
    }
    return { palette: state.palette, usePal: usePalette };
}

function processCoreEffects() {
    if (!frameBitmap) { hideLoading(); return; }
    const state = getUIState();
    const raw = computeEngineData(frameBitmap, state);
    const resolved = resolvePaletteForFrame(raw, state);
    if (state.currentPaletteMode === 'original' && resolved.usePal) {
        globalCurrentPalette = resolved.palette;
        setBasePalette(globalCurrentPalette);
    }
    engineDataCache = { data: new Uint8ClampedArray(raw.data), w: raw.w, h: raw.h, minL: raw.minL, maxL: raw.maxL, palette: resolved.palette, usePal: resolved.usePal };
    renderCanvas();
}

const colorCache = new Map();
const findClosestColor = (r, g, b, palette) => {
    const key = (r & 0xF8) << 10 | (g & 0xF8) << 5 | (b & 0xF8); let cached = colorCache.get(key); if (cached) return cached;
    let minDist = Infinity, closest = palette[0];
    for (let i = 0; i < palette.length; i++) {
        let c = palette[i]; let dr = r - c.r, dg = g - c.g, db = b - c.b; let dist = dr * dr + dg * dg + db * db;
        if (dist < minDist) { minDist = dist; closest = c; }
    }
    colorCache.set(key, closest); return closest;
};

// Aplica dither/edge/rgbshift/paleta sobre engineData e desenha no canvas alvo.
// targetCanvas/targetCtx permitem reusar esta função tanto para o preview quanto
// para o encode em lote (offscreen canvas por frame).
function renderEngineToCanvas(engineData, state, targetCanvas, targetCtx, outW, outH) {
    colorCache.clear();
    const { w, h, minL, maxL, palette, usePal } = engineData;
    let d = new Uint8ClampedArray(engineData.data);

    targetCanvas.width = outW; targetCanvas.height = outH;
    targetCtx.imageSmoothingEnabled = false;

    const ditherMode = state.ditherSelect;
    const dithScale = state.ditherScale;
    const dithInt = state.ditherIntensity / 100;
    const texAngle = state.texAngle * Math.PI / 180;
    const rgbShift = state.rgbShift;
    const edgePixelSize = state.edgePixelSize;
    const edgeRgb = hexToRgb(state.edgeColor);
    const texOpa = state.textureOpacity / 100;
    const edgeOpa = state.edgeOpacity / 100;

    let edgeMap = null;
    if (edgePixelSize > 0) {
        edgeMap = new Uint8Array(w * h);
        for (let y = 0; y < h - edgePixelSize; y++) {
            for (let x = 0; x < w - edgePixelSize; x++) {
                let idx = (y * w + x) * 4;
                let luma = 0.3 * d[idx] + 0.59 * d[idx + 1] + 0.11 * d[idx + 2];
                let rLuma = 0.3 * d[idx + edgePixelSize * 4] + 0.59 * d[idx + edgePixelSize * 4 + 1] + 0.11 * d[idx + edgePixelSize * 4 + 2];
                let bLuma = 0.3 * d[idx + edgePixelSize * w * 4] + 0.59 * d[idx + edgePixelSize * w * 4 + 1] + 0.11 * d[idx + edgePixelSize * w * 4 + 2];
                if (Math.abs(luma - rLuma) > 20 || Math.abs(luma - bLuma) > 20) { edgeMap[y * w + x] = 1; }
            }
        }
    }

    for (let y = 0; y < h; y++) {
        let sy = Math.floor(y / dithScale);
        for (let x = 0; x < w; x++) {
            let i = (y * w + x) * 4;
            if (d[i + 3] === 0) continue;

            if (edgePixelSize > 0 && edgeMap[y * w + x] === 1) {
                d[i] = d[i] * (1 - edgeOpa) + edgeRgb.r * edgeOpa;
                d[i + 1] = d[i + 1] * (1 - edgeOpa) + edgeRgb.g * edgeOpa;
                d[i + 2] = d[i + 2] * (1 - edgeOpa) + edgeRgb.b * edgeOpa;
                d[i + 3] = 255;
                continue;
            }

            let r = d[i], g = d[i + 1], b = d[i + 2];
            let pxLuma = 0.3 * r + 0.59 * g + 0.11 * b;

            if (state.isShadowsInverted) { let norm = (pxLuma - minL) / (maxL - minL || 1); if (norm < 0.45) { r = 255 - r; g = 255 - g; b = 255 - b; } }

            let sx = Math.floor(x / dithScale); let factor = 0;
            if (ditherMode === 'halftone') {
                let size = Math.max(2, dithScale * 3); let sC = Math.sin(texAngle), cC = Math.cos(texAngle);
                let rx = x * cC - y * sC; let ry = x * sC + y * cC;
                let cx = (Math.abs(rx) % size) - size / 2; let cy = (Math.abs(ry) % size) - size / 2;
                let dist = Math.sqrt(cx * cx + cy * cy); let maxDist = size / 1.5; factor = ((dist / maxDist) - 0.5) * 1.5;
            } else if (ditherMode === 'nintendo_ds') {
                let mx = sx % 4, my = sy % 4; let bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
                factor = (bayer[my][mx] / 15 - 0.5) * 0.5;
            } else if (ditherMode === 'xerox') {
                let rand = Math.random(); let noise = rand > 0.7 ? 0.7 : (rand < 0.3 ? -0.7 : (rand - 0.5) * 0.2);
                let streak = (y % Math.max(3, dithScale * 4) === 0) && (Math.random() > 0.3) ? 0.6 : 0; factor = (noise + streak) * 1.2;
            } else if (ditherMode === 'linhas') {
                let sC = Math.sin(texAngle), cC = Math.cos(texAngle); let rx = x * cC - y * sC; let lineSize = Math.max(1, dithScale * 2);
                factor = Math.sin(rx * (Math.PI / lineSize)) > 0 ? 0.3 : -0.3;
            } else if (ditherMode === 'checkerboard') factor = ((sx + sy) % 2 === 0) ? -0.3 : 0.3;
            else if (ditherMode === 'diamonds') { let cx = sx % 6; let cy = sy % 6; factor = (Math.abs(cx - 3) + Math.abs(cy - 3) < 3) ? -0.4 : 0.2; }
            else if (ditherMode === 'waves') factor = (Math.sin(sx * 0.5) + Math.cos(sy * 0.5)) * 0.25;
            else if (ditherMode === 'scanlines') factor = (sy % 3 === 0) ? -0.4 : 0.1;
            else if (ditherMode === 'maze') factor = ((sx * sy) % 3 === 0) ? -0.3 : 0.3;
            else if (ditherMode === 'noise') factor = (Math.random() - 0.5) * 0.4;

            factor *= dithInt * texOpa;
            if (state.isMidDitherEnabled) { let norm = (pxLuma - minL) / (maxL - minL || 1); if (norm < 0.25 || norm > 0.75) factor = 0; }
            if (factor !== 0) { let spread = 120; r = Math.max(0, Math.min(255, r + factor * spread)); g = Math.max(0, Math.min(255, g + factor * spread)); b = Math.max(0, Math.min(255, b + factor * spread)); }

            if (usePal && palette && palette.length > 0) {
                let closest = findClosestColor(r, g, b, palette);
                d[i] = closest.r; d[i + 1] = closest.g; d[i + 2] = closest.b;
            } else { d[i] = r; d[i + 1] = g; d[i + 2] = b; }
            d[i + 3] = 255;
        }
    }

    if (rgbShift > 0) {
        let shiftTemp = new Uint8ClampedArray(d);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let i = (y * w + x) * 4; let rx = x + rgbShift;
                if (rx >= 0 && rx < w) { d[i] = shiftTemp[(y * w + rx) * 4]; }
                let bx = x - rgbShift;
                if (bx >= 0 && bx < w) { d[i + 2] = shiftTemp[(y * w + bx) * 4 + 2]; }
            }
        }
    }

    const tmpCanvas = document.createElement('canvas'); tmpCanvas.width = w; tmpCanvas.height = h;
    tmpCanvas.getContext('2d').putImageData(new ImageData(d, w, h), 0, 0);
    targetCtx.clearRect(0, 0, outW, outH);
    targetCtx.drawImage(tmpCanvas, 0, 0, w, h, 0, 0, outW, outH);
}

function renderCanvas() {
    if (!engineDataCache) { hideLoading(); return; }
    const state = getUIState();
    const px = state.px;
    const maxDim = Math.max(frameBitmap.width, frameBitmap.height);
    const displayScale = maxDim > 2000 ? 2000 / maxDim : 1;
    const outW = engineDataCache.w * px * displayScale;
    const outH = engineDataCache.h * px * displayScale;
    renderEngineToCanvas(engineDataCache, state, canvas, ctx, outW, outH);
    hideLoading();
}

// ============================================================
// VÍDEO: upload, detecção de formato, FFmpeg.wasm sob demanda
// ============================================================

const srcVideoEl = document.getElementById('srcVideo');
let currentVideoFile = null;
let currentVideoDuration = 0;
let needsFFmpegForSource = false; // true se o navegador não conseguir decodificar nativamente
let ffmpegInstance = null;
let ffmpegLoadPromise = null;

function extToMime(name) {
    const ext = name.split('.').pop().toLowerCase();
    return { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska', mpeg: 'video/mpeg', mpg: 'video/mpeg' }[ext] || '';
}

function browserCanPlay(file) {
    const mime = file.type || extToMime(file.name);
    if (!mime) return false;
    const probe = document.createElement('video');
    const result = probe.canPlayType(mime);
    return result === 'probably' || result === 'maybe';
}

async function loadFFmpegIfNeeded() {
    if (ffmpegInstance) return ffmpegInstance;
    if (ffmpegLoadPromise) return ffmpegLoadPromise;
    ffmpegLoadPromise = (async () => {
        setStepIndicator('Carregando motor de conversão (FFmpeg)… isso acontece só na primeira vez.');
        const { FFmpeg } = FFmpegWASM;
        const ff = new FFmpeg();
        ff.on('log', ({ message }) => { appendRenderLog(message); });
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const coreURL = await FFmpegUtil.toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await FFmpegUtil.toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        await ff.load({ coreURL, wasmURL });
        ffmpegInstance = ff;
        return ff;
    })();
    return ffmpegLoadPromise;
}

function setStepIndicator(text) { document.getElementById('stepIndicator').textContent = text; }
function setVideoInfo(text) { document.getElementById('videoInfo').textContent = text; }

function fmtTime(s) { if (!isFinite(s)) return '0.0s'; return s.toFixed(1) + 's'; }

// ---------- UPLOAD ----------
async function handleVideoFile(file) {
    if (!file) return;
    currentVideoFile = file;
    needsFFmpegForSource = !browserCanPlay(file);
    document.getElementById('welcomeMsg').style.display = 'none';
    setVideoInfo(`${file.name} — ${(file.size / 1024 / 1024).toFixed(1)}MB${needsFFmpegForSource ? ' (requer conversão)' : ''}`);
    setStepIndicator('2. Aguarde o carregamento do vídeo…');

    if (!needsFFmpegForSource) {
        const url = URL.createObjectURL(file);
        srcVideoEl.src = url;
        srcVideoEl.onloadedmetadata = async () => {
            currentVideoDuration = srcVideoEl.duration;
            if (currentVideoDuration > 35) {
                setStepIndicator('Aviso: vídeo longo detectado. Recomendado até ~30s; o processamento pode demorar bastante.');
            }
            await buildScrubberThumbnails();
            openScrubber();
        };
        srcVideoEl.onerror = async () => {
            // fallback: navegador aceitou o mime mas não decodifica de fato -> tenta ffmpeg
            needsFFmpegForSource = true;
            await handleVideoViaFFmpeg(file);
        };
    } else {
        await handleVideoViaFFmpeg(file);
    }
}

async function handleVideoViaFFmpeg(file) {
    try {
        const ff = await loadFFmpegIfNeeded();
        setStepIndicator('Convertendo vídeo para pré-visualização (MP4)… pode levar um tempo.');
        const inName = 'input_' + Date.now() + '.' + file.name.split('.').pop();
        await ff.writeFile(inName, await FFmpegUtil.fetchFile(file));
        // Gera uma versão MP4 leve só para permitir o scrubber nativo depois (reencode rápido, resolução reduzida)
        const previewName = 'preview.mp4';
        await ff.exec(['-i', inName, '-vf', 'scale=480:-2', '-r', '15', '-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', previewName]);
        const data = await ff.readFile(previewName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        srcVideoEl.src = url;
        srcVideoEl.onloadedmetadata = async () => {
            currentVideoDuration = srcVideoEl.duration;
            await buildScrubberThumbnails();
            openScrubber();
        };
        await ff.deleteFile(inName);
        await ff.deleteFile(previewName);
    } catch (err) {
        console.error(err);
        setStepIndicator('Não foi possível ler este arquivo. Tente converter para MP4 antes e enviar novamente.');
        alert('Não foi possível processar este vídeo automaticamente. Se possível, converta-o para MP4 e tente novamente.');
    }
}

['videoUpload', 'videoUploadMsg', 'videoUploadTop'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('change', (e) => { const f = e.target.files[0]; if (f) handleVideoFile(f); e.target.value = ''; });
});

// ============================================================
// SCRUBBER — escolha manual do frame de referência
// ============================================================
const scrubBar = document.getElementById('scrub-bar');
const scrubThumbsEl = document.getElementById('scrubThumbs');
const scrubHandle = document.getElementById('scrubHandle');
const scrubTrackWrap = document.getElementById('scrubTrackWrap');
let scrubSelectedTime = 0;
const SCRUB_THUMB_COUNT = 12;

function openScrubber() {
    scrubBar.classList.add('visible');
    setStepIndicator('2. Arraste a barra abaixo e escolha o frame que representa o visual do vídeo.');
    document.getElementById('scrubTimeLabel').textContent = `0.0s / ${fmtTime(currentVideoDuration)}`;
}

async function buildScrubberThumbnails() {
    scrubThumbsEl.innerHTML = '';
    const tmpCanvas = document.createElement('canvas');
    const tctx = tmpCanvas.getContext('2d');
    tmpCanvas.width = 160; tmpCanvas.height = 90;
    for (let i = 0; i < SCRUB_THUMB_COUNT; i++) {
        const t = (currentVideoDuration * i) / (SCRUB_THUMB_COUNT - 1 || 1);
        const dataUrl = await grabVideoFrameDataURL(t, tmpCanvas, tctx);
        const img = document.createElement('img');
        img.src = dataUrl;
        scrubThumbsEl.appendChild(img);
    }
    await seekAndLoadFrame(0);
}

function grabVideoFrameDataURL(time, tmpCanvas, tctx) {
    return new Promise((resolve) => {
        const onSeeked = () => {
            srcVideoEl.removeEventListener('seeked', onSeeked);
            tctx.drawImage(srcVideoEl, 0, 0, tmpCanvas.width, tmpCanvas.height);
            resolve(tmpCanvas.toDataURL('image/jpeg', 0.6));
        };
        srcVideoEl.addEventListener('seeked', onSeeked);
        srcVideoEl.currentTime = Math.min(Math.max(time, 0), Math.max(currentVideoDuration - 0.05, 0));
    });
}

function seekAndLoadFrame(time) {
    return new Promise((resolve) => {
        const onSeeked = async () => {
            srcVideoEl.removeEventListener('seeked', onSeeked);
            const bmp = await createImageBitmap(srcVideoEl).catch(() => null);
            if (bmp) {
                frameBitmap = bmp;
            } else {
                // fallback: desenha em canvas e usa como bitmap
                const c = document.createElement('canvas'); c.width = srcVideoEl.videoWidth; c.height = srcVideoEl.videoHeight;
                c.getContext('2d').drawImage(srcVideoEl, 0, 0);
                frameBitmap = await createImageBitmap(c);
            }
            canvasWrapper.style.display = 'block';
            document.getElementById('btn-download-frame').disabled = false;
            document.getElementById('btnExportStylePng').disabled = false;
            enableEditorTabs(true);
            if (currentPaletteMode === 'original') { globalCurrentPalette = []; }
            scheduleProcess();
            setTimeout(fitImageToView, 50);
            resolve();
        };
        srcVideoEl.addEventListener('seeked', onSeeked);
        srcVideoEl.currentTime = Math.min(Math.max(time, 0), Math.max(currentVideoDuration - 0.05, 0));
    });
}

let scrubDragging = false;
function updateScrubFromClientX(clientX) {
    const rect = scrubTrackWrap.getBoundingClientRect();
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    scrubHandle.style.left = (pct * 100) + '%';
    scrubSelectedTime = pct * currentVideoDuration;
    document.getElementById('scrubTimeLabel').textContent = `${fmtTime(scrubSelectedTime)} / ${fmtTime(currentVideoDuration)}`;
}
scrubTrackWrap.addEventListener('pointerdown', (e) => { scrubDragging = true; scrubTrackWrap.setPointerCapture(e.pointerId); updateScrubFromClientX(e.clientX); });
scrubTrackWrap.addEventListener('pointermove', (e) => { if (scrubDragging) updateScrubFromClientX(e.clientX); });
scrubTrackWrap.addEventListener('pointerup', () => { scrubDragging = false; });

document.getElementById('btnUseFrame').addEventListener('click', async () => {
    setStepIndicator('Carregando frame selecionado…');
    await seekAndLoadFrame(scrubSelectedTime);
    setStepIndicator('3. Ajuste o estilo (Ajustes, Pixel, Textura, Cores). Depois vá em "Vídeo" e gere o resultado.');
    document.getElementById('btnApplyToVideo').disabled = false;
});

// ============================================================
// RENDERIZAÇÃO DO VÍDEO COMPLETO (aplica o estilo a todos os frames)
// ============================================================

const renderOverlay = document.getElementById('render-overlay');
const renderProgressFill = document.getElementById('renderProgressFill');
const renderStatsText = document.getElementById('renderStatsText');
const renderPercentText = document.getElementById('renderPercentText');
const renderLogEl = document.getElementById('renderLog');
let renderCancelled = false;

function appendRenderLog(msg) {
    renderLogEl.textContent += msg + '\n';
    renderLogEl.scrollTop = renderLogEl.scrollHeight;
}
function setRenderProgress(pct, statsText) {
    renderProgressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    renderPercentText.textContent = Math.round(pct) + '%';
    if (statsText) renderStatsText.textContent = statsText;
}
function openRenderOverlay() {
    renderCancelled = false;
    renderLogEl.textContent = '';
    setRenderProgress(0, 'Preparando…');
    renderOverlay.classList.add('visible');
}
function closeRenderOverlay() { renderOverlay.classList.remove('visible'); }
document.getElementById('btnCancelRender').addEventListener('click', () => {
    renderCancelled = true;
    setRenderProgress(renderProgressFill.style.width ? parseFloat(renderProgressFill.style.width) : 0, 'Cancelando…');
});

async function applyStyleToFullVideo() {
    if (!currentVideoFile || !frameBitmap) return;
    openRenderOverlay();
    const state = getUIState();

    try {
        const ff = await loadFFmpegIfNeeded();
        if (renderCancelled) { closeRenderOverlay(); return; }

        setRenderProgress(2, 'Lendo vídeo original…');
        const inExt = currentVideoFile.name.split('.').pop();
        const inName = 'src_full.' + inExt;
        await ff.writeFile(inName, await FFmpegUtil.fetchFile(currentVideoFile));
        if (renderCancelled) { await safeCleanup(ff, [inName]); closeRenderOverlay(); return; }

        // Descobre FPS/duração real via probe leve (reusa metadados já lidos do <video>)
        const fps = 12; // FPS de trabalho: equilíbrio entre fluidez e tempo de processamento no navegador
        const duration = Math.min(currentVideoDuration, 30);

        setRenderProgress(6, 'Extraindo frames do vídeo…');
        await ff.exec(['-i', inName, '-t', String(duration), '-vf', `fps=${fps}`, 'frame_%05d.png']);
        if (renderCancelled) { await safeCleanup(ff, [inName]); closeRenderOverlay(); return; }

        const listing = await ff.listDir('.');
        const frameFiles = listing.filter(f => /^frame_\d{5}\.png$/.test(f.name)).map(f => f.name).sort();
        const totalFrames = frameFiles.length;
        if (totalFrames === 0) throw new Error('Nenhum frame extraído.');

        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        for (let i = 0; i < totalFrames; i++) {
            if (renderCancelled) { await safeCleanup(ff, [inName, ...frameFiles]); closeRenderOverlay(); return; }
            const fname = frameFiles[i];
            const data = await ff.readFile(fname);
            const blob = new Blob([data.buffer], { type: 'image/png' });
            const bmp = await createImageBitmap(blob);

            const raw = computeEngineData(bmp, state);
            let paletteInfo;
            if (i === 0 && state.currentPaletteMode === 'original') {
                paletteInfo = resolvePaletteForFrame(raw, state);
                state.palette = paletteInfo.palette; // trava a paleta do 1º frame p/ manter consistência entre frames
                state.currentPaletteMode = 'manual';
            } else {
                paletteInfo = { palette: state.palette, usePal: state.colorSelect !== 'all' };
            }
            const engineData = { data: raw.data, w: raw.w, h: raw.h, minL: raw.minL, maxL: raw.maxL, palette: paletteInfo.palette, usePal: paletteInfo.usePal };

            const maxDim = Math.max(bmp.width, bmp.height);
            const displayScale = maxDim > 1600 ? 1600 / maxDim : 1;
            const outW = Math.max(2, Math.round(raw.w * state.px * displayScale));
            const outH = Math.max(2, Math.round(raw.h * state.px * displayScale));
            renderEngineToCanvas(engineData, state, offCanvas, offCtx, outW, outH);

            const outBlob = await new Promise(res => offCanvas.toBlob(res, 'image/png'));
            const outBuf = new Uint8Array(await outBlob.arrayBuffer());
            await ff.writeFile('styled_' + fname, outBuf);
            await ff.deleteFile(fname);
            bmp.close && bmp.close();

            const pct = 8 + (i / totalFrames) * 74;
            setRenderProgress(pct, `Processando frame ${i + 1} de ${totalFrames}…`);
            await new Promise(r => setTimeout(r, 0)); // libera a UI entre frames
        }

        if (renderCancelled) { closeRenderOverlay(); return; }
        setRenderProgress(84, 'Recompondo vídeo (codificando MP4)…');

        const hasAudio = await probeHasAudio(ff, inName);
        const encodeArgs = ['-framerate', String(fps), '-i', 'styled_frame_%05d.png'];
        if (hasAudio) {
            encodeArgs.push('-i', inName, '-map', '0:v:0', '-map', '1:a:0?', '-shortest');
        }
        encodeArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '23');
        if (hasAudio) encodeArgs.push('-c:a', 'aac', '-b:a', '128k');
        encodeArgs.push('output_final.mp4');

        await ff.exec(encodeArgs);
        if (renderCancelled) { closeRenderOverlay(); return; }

        setRenderProgress(97, 'Finalizando…');
        const finalData = await ff.readFile('output_final.mp4');
        const finalBlob = new Blob([finalData.buffer], { type: 'video/mp4' });

        // limpeza best-effort (não bloqueia o download se falhar)
        safeCleanup(ff, [inName, 'output_final.mp4', ...frameFiles.map(f => 'styled_' + f)]).catch(() => {});

        setRenderProgress(100, 'Concluído!');
        await new Promise(r => setTimeout(r, 300));
        closeRenderOverlay();
        triggerRobustDownload(finalBlob, `pixelar_video_${Date.now()}.mp4`);

    } catch (err) {
        console.error(err);
        appendRenderLog('ERRO: ' + (err && err.message ? err.message : String(err)));
        setRenderProgress(0, 'Falhou.');
        await new Promise(r => setTimeout(r, 1200));
        closeRenderOverlay();
        alert('Não foi possível gerar o vídeo. Verifique o arquivo original ou tente um trecho mais curto.');
    }
}

async function probeHasAudio(ff, inName) {
    try {
        let hasAudio = false;
        const handler = ({ message }) => { if (/Stream .*Audio:/.test(message)) hasAudio = true; };
        if (typeof ff.on === 'function') ff.on('log', handler);
        // -t 0.1 -f null - : lê só o cabeçalho/streams sem gerar arquivo de saída real
        await ff.exec(['-i', inName, '-t', '0.1', '-f', 'null', '-']).catch(() => {});
        if (typeof ff.off === 'function') ff.off('log', handler);
        return hasAudio;
    } catch (e) { return false; }
}

async function safeCleanup(ff, names) {
    for (const n of names) { try { await ff.deleteFile(n); } catch (e) {} }
}

document.getElementById('btnApplyToVideo').addEventListener('click', applyStyleToFullVideo);

// ============================================================
// DOWNLOAD ROBUSTO (desktop + mobile, incluindo iOS Safari)
// ============================================================
function triggerRobustDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);

    // Caminho 1: Web Share API com arquivos (funciona bem em iOS/Android — abre a folha de compartilhar
    // e permite "Salvar em Arquivos" / galeria, contornando o bloqueio de download direto do Safari).
    const canShareFiles = navigator.canShare && (() => {
        try {
            const testFile = new File([blob], fileName, { type: blob.type });
            return navigator.canShare({ files: [testFile] });
        } catch (e) { return false; }
    })();

    if (canShareFiles) {
        const file = new File([blob], fileName, { type: blob.type });
        navigator.share({ files: [file], title: fileName }).catch(() => {
            // usuário cancelou ou falhou -> cai para o método de link
            fallbackLinkDownload(url, fileName);
        });
        // ainda assim garante o link como alternativa, caso o compartilhamento não seja o que o usuário queira
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
    }

    fallbackLinkDownload(url, fileName);
}

function fallbackLinkDownload(url, fileName) {
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.style.display = 'none'; a.rel = 'noopener';
    document.body.appendChild(a);
    try { a.click(); } catch (error) { window.open(url, '_blank'); }
    setTimeout(() => { a.remove(); }, 1000);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ============================================================
// DOWNLOAD DO FRAME (imagem estática) — igual ao Pixelar original
// ============================================================
const dlFrameModal = document.getElementById('downloadFrameModal');
document.getElementById('btn-download-frame').addEventListener('click', () => { if (frameBitmap) dlFrameModal.style.display = 'flex'; });
document.getElementById('dlf-close').addEventListener('click', () => { dlFrameModal.style.display = 'none'; });

document.getElementById('dlf-png').addEventListener('click', () => {
    if (!canvas.width) { alert('Nada para baixar ainda.'); return; }
    const fileName = `pixelar_frame_${Date.now()}.png`;
    const embedMetadataAndDownload = (blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onload = () => {
            const buffer = reader.result; const metaStr = "PIXELARVID_META:" + JSON.stringify(getStyleExportObject());
            const metaBytes = new TextEncoder().encode(metaStr); const combined = new Uint8Array(buffer.byteLength + metaBytes.length);
            combined.set(new Uint8Array(buffer), 0); combined.set(metaBytes, buffer.byteLength);
            const finalBlob = new Blob([combined], { type: 'image/png' });
            triggerRobustDownload(finalBlob, fileName);
        };
        reader.readAsArrayBuffer(blob);
    };
    canvas.toBlob(embedMetadataAndDownload, 'image/png');
    dlFrameModal.style.display = 'none';
});

document.getElementById('dlf-svg').addEventListener('click', () => {
    if (!canvas.width) { alert('Nada para baixar ainda.'); return; }
    const w = canvas.width, h = canvas.height;
    const cData = ctx.getImageData(0, 0, w, h).data;
    let svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    for (let y = 0; y < h; y++) {
        let startX = 0; let curColor = '';
        for (let x = 0; x <= w; x++) {
            let idx = (y * w + x) * 4; let hex = x < w ? rgbToHex(cData[idx], cData[idx + 1], cData[idx + 2]) : null;
            let alpha = x < w ? cData[idx + 3] : 0; if (alpha < 127) hex = null;
            if (x === 0) { curColor = hex; continue; }
            if (hex !== curColor || x === w) {
                if (curColor !== null) { svg += `\n  <rect x="${startX}" y="${y}" width="${(x - startX)}" height="1" fill="${curColor}"/>`; }
                startX = x; curColor = hex;
            }
        }
    }
    svg += `\n</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    triggerRobustDownload(blob, `pixelar_frame_${Date.now()}.svg`);
    dlFrameModal.style.display = 'none';
});

// ============================================================
// EXPORT / IMPORT DE ESTILO (json e png com metadado)
// ============================================================
document.getElementById('btnExportStyleJson').addEventListener('click', () => {
    const styleObj = getStyleExportObject();
    const blob = new Blob([JSON.stringify(styleObj, null, 2)], { type: 'application/json' });
    triggerRobustDownload(blob, `pixelar_estilo_${Date.now()}.json`);
});

document.getElementById('btnExportStylePng').addEventListener('click', () => {
    if (!canvas.width) { alert('Ajuste um frame primeiro.'); return; }
    const fileName = `pixelar_estilo_${Date.now()}.png`;
    const embedAndDownload = (blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onload = () => {
            const buffer = reader.result; const metaStr = "PIXELARVID_META:" + JSON.stringify(getStyleExportObject());
            const metaBytes = new TextEncoder().encode(metaStr); const combined = new Uint8Array(buffer.byteLength + metaBytes.length);
            combined.set(new Uint8Array(buffer), 0); combined.set(metaBytes, buffer.byteLength);
            const finalBlob = new Blob([combined], { type: 'image/png' });
            triggerRobustDownload(finalBlob, fileName);
        };
        reader.readAsArrayBuffer(blob);
    };
    canvas.toBlob(embedAndDownload, 'image/png');
});

document.getElementById('importStyleConfig').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            const text = await file.text();
            const obj = JSON.parse(text);
            applyStyleImport(obj);
        } else {
            const slice = file.slice(Math.max(0, file.size - 4000));
            const text = await slice.text();
            const match = text.match(/PIXELARVID_META:(\{.*\})/) || text.match(/PIXELAR_META:(\{.*\})/);
            if (match) { applyStyleImport(JSON.parse(match[1])); }
            else { alert('Este PNG não contém dados de estilo do Pixelar Vídeo.'); }
        }
    } catch (err) {
        console.error(err);
        alert('Falha ao ler o arquivo de estilo.');
    }
    e.target.value = '';
});
