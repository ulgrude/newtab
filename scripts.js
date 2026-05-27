// ── Clock ──────────────────────────────────────────────────────────────────────
function updateTime() {
    const pad = n => String(n).padStart(2, '0');
    const now = new Date();
    document.getElementById('currentTime').textContent =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
setInterval(updateTime, 1000);
updateTime();

// ── Random Image ──────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    const img = document.getElementById('randomImage');
    img.src = 'random-image/random-image.php';
    img.style.display = 'block';
});

// ── Global State ──────────────────────────────────────────────────────────────
let editMode = false;

// Modal state (add or edit)
let modalMode        = 'add';   // 'add' | 'edit'
let targetCatIndex   = null;    // target category for addition
let editingCard      = null;    // { id, catIndex, cardEl, currentImg }
let cardToDelete     = null;    // for the confirmation popup
let selectedFile     = null;    // image file selected in the modal

// Drag & drop state
let dragSrcCard      = null;
let dragSrcCat       = null;
let placeholder      = null;

// ── Loading ───────────────────────────────────────────────────────────────────
async function loadLinks() {
    const res  = await fetch('links/api.php?action=get');
    const data = await res.json();
    data.categories.forEach((links, catIndex) => {
        const container = document.querySelector(`.links-category[data-category="${catIndex}"]`);
        container.innerHTML = '';
        links.forEach(link => appendCard(container, link, catIndex));
        container.appendChild(makeAddBtn(catIndex));
    });
}

// ── Card construction ─────────────────────────────────────────────────────────
function appendCard(container, link, catIndex) {
    const card = document.createElement('a');
    card.className  = 'link-card';
    card.href       = link.url;
    card.dataset.id  = link.id;
    card.dataset.cat = catIndex;

    // Block navigation in edit mode
    card.addEventListener('click', e => {
        if (editMode) e.preventDefault();
    });

    // Pencil button
    const pencil = document.createElement('span');
    pencil.className   = 'edit-btn';
    pencil.title       = 'Edit';
    pencil.textContent = '✎';
    pencil.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openEditModal(link, catIndex, card);
    });

    const img = document.createElement('img');
    img.src = link.img || '';
    img.alt = link.alt;
    if (!link.img) img.style.display = 'none';

    card.appendChild(pencil);
    card.appendChild(img);

    // Drag & drop (reordering)
    setupCardDrag(card, catIndex);

    container.appendChild(card);
}

function makeAddBtn(catIndex) {
    const btn = document.createElement('button');
    btn.className = 'link-card-add';
    btn.title     = 'Add a link';
    btn.textContent = '+';
    btn.addEventListener('click', () => {
        targetCatIndex = catIndex;
        openAddModal();
    });
    return btn;
}

// ── Edit mode ─────────────────────────────────────────────────────────────────
document.getElementById('editToggleBtn').addEventListener('click', () => {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    const btn = document.getElementById('editToggleBtn');
    btn.textContent = editMode ? '✕' : '✏️';
    btn.classList.toggle('active', editMode);

    // Enable/disable draggable on cards
    document.querySelectorAll('.link-card').forEach(card => {
        card.draggable = editMode;
    });
});

// ── Drag & drop reordering ────────────────────────────────────────────────────
function setupCardDrag(card, catIndex) {
    card.addEventListener('dragstart', e => {
        if (!editMode) { e.preventDefault(); return; }
        dragSrcCard = card;
        dragSrcCat  = catIndex;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
        // Create the placeholder
        placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        // Clean the placeholder if it remains (drag canceled, outside the drop zone)
        if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        placeholder = null;
        dragSrcCard = null;
        dragSrcCat  = null;
    });
}

// Manage drag and drop on each category
document.querySelectorAll('.links-category').forEach(container => {
    container.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!dragSrcCard || !placeholder) return;

        // Find the card closest to the cursor
        const cards = [...container.querySelectorAll('.link-card:not(.dragging)')];
        const addBtn = container.querySelector('.link-card-add');

        let inserted = false;
        for (const c of cards) {
            const rect = c.getBoundingClientRect();
            const midX = rect.left + rect.width / 2;
            if (e.clientX < midX) {
                container.insertBefore(placeholder, c);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            // Insert before the "+" button
            container.insertBefore(placeholder, addBtn);
        }
    });

    container.addEventListener('drop', e => {
        e.preventDefault();
        if (!dragSrcCard || !placeholder) return;

        const srcCatIndex = parseInt(dragSrcCard.dataset.cat);
        const dstCatIndex = parseInt(container.dataset.category);

        // Move the actual card into place of the placeholder
        container.insertBefore(dragSrcCard, placeholder);
        placeholder.parentNode.removeChild(placeholder);
        placeholder = null;

        // Update the data-cat if there is a line change
        dragSrcCard.dataset.cat = dstCatIndex;

        // Reattach drag events with the correct catIndex
        setupCardDrag(dragSrcCard, dstCatIndex);

        // Also update the pencil for the correct catIndex
        const pencil = dragSrcCard.querySelector('.edit-btn');
        if (pencil) {
            const id = dragSrcCard.dataset.id;
            pencil.onclick = async e => {
                e.preventDefault();
                e.stopPropagation();
                const res  = await fetch('links/api.php?action=get');
                const data = await res.json();
                for (let ci = 0; ci < data.categories.length; ci++) {
                    const found = data.categories[ci].find(l => l.id === id);
                    if (found) { openEditModal(found, dstCatIndex, dragSrcCard); break; }
                }
            };
        }

        // Save via the move action (handles empty categories and inter-line movement)
        const dstCatEl = document.querySelector(`.links-category[data-category="${dstCatIndex}"]`);
        const srcCatEl = document.querySelector(`.links-category[data-category="${srcCatIndex}"]`);
        const dstOrder = [...dstCatEl.querySelectorAll('.link-card')].map(c => c.dataset.id).filter(Boolean);
        const srcOrder = [...srcCatEl.querySelectorAll('.link-card')].map(c => c.dataset.id).filter(Boolean);

        fetch('links/api.php?action=move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: dragSrcCard.dataset.id,
                srcCat: srcCatIndex,
                dstCat: dstCatIndex,
                dstOrder,
                srcOrder
            })
        });
    });
});


// ── Helpers modal ─────────────────────────────────────────────────────────────
const addModal   = document.getElementById('addModal');
const modalTitle = document.getElementById('modalTitle');
const modalSaveBtn   = document.getElementById('modalSave');
const modalDeleteBtn = document.getElementById('modalDelete');

function resetModal() {
    document.getElementById('modalUrl').value  = '';
    document.getElementById('modalAlt').value  = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('previewImg').style.display = 'none';
    document.getElementById('dropLabel').style.display  = 'block';
    selectedFile = null;
}

function openAddModal() {
    modalMode = 'add';
    editingCard = null;
    resetModal();
    modalTitle.textContent    = 'Add a link';
    modalSaveBtn.textContent  = 'Add';
    modalDeleteBtn.style.display = 'none';
    addModal.classList.add('open');
}

function openEditModal(link, catIndex, cardEl) {
    modalMode   = 'edit';
    editingCard = { id: link.id, catIndex, cardEl, currentImg: link.img };
    resetModal();
    document.getElementById('modalUrl').value = link.url;
    document.getElementById('modalAlt').value = link.alt;
    // Pre-fill the preview with the current image
    if (link.img) {
        const prev = document.getElementById('previewImg');
        prev.src = link.img;
        prev.style.display = 'block';
        document.getElementById('dropLabel').style.display = 'none';
    }
    modalTitle.textContent   = 'Edit the link';
    modalSaveBtn.textContent = 'Save';
    modalDeleteBtn.style.display = 'inline-flex';
    addModal.classList.add('open');
}

document.getElementById('modalCancel').addEventListener('click', () => {
    addModal.classList.remove('open');
});
addModal.addEventListener('click', e => {
    if (e.target === addModal) addModal.classList.remove('open');
});

// ── Drag & drop image into the modal ──────────────────────────────────────────
const dropZone   = document.getElementById('dropZone');
const fileInput  = document.getElementById('fileInput');
const previewImg = document.getElementById('previewImg');
const dropLabel  = document.getElementById('dropLabel');

function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    // If editing and the chosen filename matches the existing img (not in uploads/), don't re-upload
    if (modalMode === 'edit' && editingCard?.currentImg) {
        const existingName = editingCard.currentImg.split('/').pop().split('?')[0];
        if (file.name === existingName && !editingCard.currentImg.startsWith('img/uploads/')) {
            selectedFile = null;
            previewImg.src = editingCard.currentImg;
            previewImg.style.display = 'block';
            dropLabel.style.display  = 'none';
            return;
        }
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        dropLabel.style.display  = 'none';
    };
    reader.readAsDataURL(file);
}

dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleImageFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => handleImageFile(fileInput.files[0]));

// ── Save (add or edit) ────────────────────────────────────────────────────────
modalSaveBtn.addEventListener('click', async () => {
    const url = document.getElementById('modalUrl').value.trim();
    const alt = document.getElementById('modalAlt').value.trim() || 'Lien';
    if (!url) { document.getElementById('modalUrl').focus(); return; }

    if (modalMode === 'add') {
        const formData = new FormData();
        formData.append('category', targetCatIndex);
        formData.append('url', url);
        formData.append('alt', alt);
        if (selectedFile) formData.append('image', selectedFile);

        const res  = await fetch('links/api.php?action=add', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            const container = document.querySelector(`.links-category[data-category="${targetCatIndex}"]`);
            const addBtn = container.querySelector('.link-card-add');
            appendCard(container, data.entry, targetCatIndex);
            if (editMode) container.querySelector('.link-card:last-of-type').draggable = true;
            container.appendChild(addBtn);
            addModal.classList.remove('open');
        } else { alert('Erreur : ' + (data.error || 'inconnue')); }

    } else {
        // Edit
        const formData = new FormData();
        formData.append('id',       editingCard.id);
        formData.append('category', editingCard.catIndex);
        formData.append('url',      url);
        formData.append('alt',      alt);
        if (selectedFile) formData.append('image', selectedFile);

        const res  = await fetch('links/api.php?action=edit', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            // Update the card in the DOM
            const card = editingCard.cardEl;
            card.href = url;
            const img = card.querySelector('img');
            img.alt = alt;
            if (data.entry.img) {
                img.src = data.entry.img + '?t=' + Date.now(); // cache-bust
                img.style.display = '';
            }
            addModal.classList.remove('open');
        } else { alert('Erreur : ' + (data.error || 'inconnue')); }
    }
});

// ── Delete from the modal ─────────────────────────────────────────────────────
modalDeleteBtn.addEventListener('click', () => {
    if (!editingCard) return;
    cardToDelete = editingCard;
    addModal.classList.remove('open');
    document.getElementById('confirmOverlay').classList.add('open');
});

document.getElementById('confirmCancel').addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.remove('open');
    cardToDelete = null;
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (!cardToDelete) return;
    const res  = await fetch('links/api.php?action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cardToDelete.id, category: cardToDelete.catIndex })
    });
    const data = await res.json();
    if (data.success) {
        cardToDelete.cardEl.remove();
        cardToDelete = null;
        document.getElementById('confirmOverlay').classList.remove('open');
    } else { alert('Erreur : ' + (data.error || 'inconnue')); }
});

document.getElementById('confirmOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('confirmOverlay')) {
        document.getElementById('confirmOverlay').classList.remove('open');
        cardToDelete = null;
    }
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadLinks);