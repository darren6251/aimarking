/* --- File Upload Logic --- */
const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        showModal('File Uploaded', `File "${file.name}" is ready for grading.`);
    }
});

/* --- Modal Logic --- */
const modalContainer = document.getElementById('modalContainer');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalCloseBtn = document.querySelector('.modal-content .close-btn');

function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalContainer.style.display = 'flex';
}

modalCloseBtn.addEventListener('click', () => {
    modalContainer.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modalContainer) {
        modalContainer.style.display = 'none';
    }
});

/* --- Section Toggling Logic --- */
const sections = {
    home: document.getElementById('homeSection'),
    grading: document.getElementById('gradingSection'),
    chat: document.getElementById('chatSection')
};
const tabs = {
    home: document.getElementById('toggleHomeButton'),
    grading: document.getElementById('toggleGradingButton'),
    chat: document.getElementById('toggleChatButton')
};

function showSection(sectionName) {
    for (const name in sections) {
        sections[name].style.display = 'none';
        tabs[name].classList.remove('active');
    }
    sections[sectionName].style.display = 'block';
    tabs[sectionName].classList.add('active');
}

// Initial state
showSection('home');

// Add event listeners for toggling sections
tabs.home.addEventListener('click', () => showSection('home'));
tabs.grading.addEventListener('click', () => showSection('grading'));
tabs.chat.addEventListener('click', () => showSection('chat'));


/* --- Finder Window Logic --- */
const finderWindow = document.getElementById('finderWindow');
const closeFinderBtn = document.getElementById('closeFinderBtn');
const openFinderBtn = document.getElementById('openFinderBtn');
const finderTitle = document.querySelector('.finder-title');
const finderContent = document.getElementById('finderContent');

// Dragging functionality
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

finderTitle.addEventListener('mousedown', dragStart);
finderTitle.addEventListener('mouseup', dragEnd);
finderTitle.addEventListener('mousemove', drag);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, finderWindow);
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

// Open and Close Finder
openFinderBtn.addEventListener('click', () => {
    finderWindow.style.display = 'flex';
});

closeFinderBtn.addEventListener('click', () => {
    finderWindow.style.display = 'none';
});

// Mock Finder Data (Replace with real data fetching)
const files = [
    { name: 'Thesis_Final.pdf', date: '2023-10-26', size: '2.5MB' },
    { name: 'Assignment_1.pdf', date: '2023-10-25', size: '800KB' },
    { name: 'Research_Paper.pdf', date: '2023-10-20', size: '1.2MB' },
    { name: 'Student_Report.pdf', date: '2023-10-18', size: '500KB' },
];

const finderResultsContainer = document.getElementById('finderResults');

function renderFiles(fileList) {
    finderResultsContainer.innerHTML = '';
    fileList.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        fileItem.innerHTML = `
            <div class="file-icon"><i class="fas fa-file-pdf"></i></div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">Created: ${file.date} | ${file.size}</div>
            </div>
        `;
        finderResultsContainer.appendChild(fileItem);
    });
}

// Initial render
renderFiles(files);

// Search functionality
const finderSearchInput = document.getElementById('finderSearch');
finderSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchTerm));
    renderFiles(filteredFiles);
});


/* --- PDF Viewer Logic --- */
const pdfViewer = document.getElementById('pdfViewer');
const pdfCanvasContainer = document.getElementById('pdfCanvasContainer');
const pdfCanvas = document.getElementById('pdfCanvas');
const prevPdfPageBtn = document.getElementById('prevPdfPageBtn');
const nextPdfPageBtn = document.getElementById('nextPdfPageBtn');
const pdfPageNum = document.getElementById('pdfPageNum');
const pdfPageCount = document.getElementById('pdfPageCount');

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let pdfScale = 1.5;
let canvasContext = pdfCanvas.getContext('2d');

// Load PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function loadPdf(url) {
    return pdfjsLib.getDocument(url).promise;
}

function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: pdfScale });
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        const renderContext = {
            canvasContext: canvasContext,
            viewport: viewport
        };

        const renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            updatePdfNavButtons();
        });
    }).catch(error => {
        console.error('Error rendering PDF page:', error);
        showModal('PDF Render Error', `Failed to render page ${num}: ${error.message}`);
        pageRendering = false;
        pageNumPending = null;
        updatePdfNavButtons();
    });
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function updatePdfNavButtons() {
    prevPdfPageBtn.disabled = pageNum <= 1;
    nextPdfPageBtn.disabled = pageNum >= pdfDoc.numPages;
}

// Show the login wrapper when the page has fully loaded
window.addEventListener('load', function() {
    const authWrapper = document.getElementById('authWrapper');
    if (authWrapper) {
        authWrapper.style.opacity = '1';
    }
});