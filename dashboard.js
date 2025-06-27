/**
 * Konfigurasi dan Inisialisasi Aplikasi Dashboard Investasi
 */

// Data Dummy - Di dunia nyata, ini akan datang dari API
const DUMMY_DATA = {
    sidebar: {
        total: 328640820,
        sectors: {
            'air-minum': 20100000,
            'air-limbah': 180750000,
            'persampahan': 12830500,
            'strategis': 12060000,
            'bangunan': 102900320
        }
    },
    lineChart: {
        labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
        datasets: [
            { label: 'Air Minum', data: [40, 40, 30, 30, 70, 20, 20, 50, 40, 60, 20], color: '#e74c3c' },
            { label: 'Air Limbah', data: [10, 60, 20, 40, 10, 10, 10, 10, 80, 30, 20], color: '#3498db' },
            { label: 'Persampahan', data: [0, 10, 30, 60, 10, 0, 0, 0, 30, 10, 0], color: '#f1c40f' },
            { label: 'Kawasan Strategis', data: [10, 10, 10, 10, 20, 20, 20, 10, 0, 0, 0], color: '#2ecc71' },
            { label: 'Bangunan Gedung', data: [20, 20, 20, 20, 20, 20, 20, 20, 0, 40, 10], color: '#9b59b6' }
        ]
    },
    // Menambahkan lebih banyak data untuk menguji paginasi
    tableData: Array.from({ length: 150 }, (_, i) => ({
        no: i + 1,
        provinsi: `Provinsi ${String.fromCharCode(65 + (i % 26))}`,
        tahun: 2015 + (i % 11),
        airMinum: 5000000 + (i * 100000),
        total: 15000000 + (i * 300000)
    }))
};

// --- UTILITIES ---
const formatCurrency = (number) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(number);

// --- STATE MANAGEMENT ---
let doughnutChartInstance, lineChartInstance, mapInstance, timelapseInterval = null;
let paginationState = {
    currentPage: 1,
    rowsPerPage: 10,
    currentFilteredData: [...DUMMY_DATA.tableData]
};


// --- DOM ELEMENTS ---
const elements = {
    liveTimestamp: document.getElementById('live-timestamp'),
    sidebarTotal: document.getElementById('sidebar-total-investment'),
    sidebarYear: document.getElementById('sidebar-year'),
    legendValues: {
        airMinum: document.getElementById('legend-air-minum'),
        airLimbah: document.getElementById('legend-air-limbah'),
        persampahan: document.getElementById('legend-persampahan'),
        strategis: document.getElementById('legend-strategis'),
        bangunan: document.getElementById('legend-bangunan'),
    },
    viewButtons: document.querySelectorAll('.view-switcher .view-btn'),
    dashboardViews: {
        map: document.getElementById('map-view'),
        table: document.getElementById('table-view'),
        chart: document.getElementById('chart-view'),
    },
    tableBody: document.querySelector('.investment-table tbody'),
    timelapseButtons: document.querySelectorAll('.timelapse-btn'),
    timelapseSliders: document.querySelectorAll('.timelapse-slider'),
    paginationControls: document.querySelector('.pagination'),
    rowsPerPageSelect: document.querySelector('.pagination-select'),
    totalDataSpan: document.querySelector('.pagination-controls span'),
};

// --- FUNCTIONS ---

function updateLiveTimestamp() {
    if (!elements.liveTimestamp) return;
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    elements.liveTimestamp.textContent = `${new Intl.DateTimeFormat('id-ID', options).format(now)} WIB`;
}

function setupDoughnutChart(data) {
    const ctx = document.getElementById('investmentChart')?.getContext('2d');
    if (!ctx) return;
    if (doughnutChartInstance) doughnutChartInstance.destroy();
    
    elements.sidebarTotal.textContent = formatCurrency(data.total);
    elements.legendValues.airMinum.textContent = formatCurrency(data.sectors['air-minum']);
    elements.legendValues.airLimbah.textContent = formatCurrency(data.sectors['air-limbah']);
    elements.legendValues.persampahan.textContent = formatCurrency(data.sectors['persampahan']);
    elements.legendValues.strategis.textContent = formatCurrency(data.sectors['strategis']);
    elements.legendValues.bangunan.textContent = formatCurrency(data.sectors['bangunan']);

    doughnutChartInstance = new Chart(ctx, { 
        type: 'doughnut',
        data: {
            labels: ['Air Minum', 'Air Limbah', 'Persampahan', 'Kawasan Strategis', 'Bangunan Gedung'],
            datasets: [{ data: Object.values(data.sectors), backgroundColor: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'], borderWidth: 0, cutout: '80%' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.parsed)}` } } } }
     });
}

function setupLineChart(data) {
    if (lineChartInstance) lineChartInstance.destroy();
    const ctx = document.getElementById('lineChart')?.getContext('2d');
    if (!ctx) return;
    const datasets = data.datasets.map(ds => ({ ...ds, borderColor: ds.color, pointBackgroundColor: ds.color, pointBorderColor: '#fff', fill: false, tension: 0.4 }));
    lineChartInstance = new Chart(ctx, { type: 'line', data: { labels: data.labels, datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (value) => `${value} T` } }, x: { grid: { display: false } } }, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: true, position: 'top' } }, elements: { point: { radius: 5, hoverRadius: 7, borderWidth: 3 } } } });
}

function populateTable(data) {
    if (!elements.tableBody) return;
    elements.tableBody.innerHTML = ''; 
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.no}</td><td>${row.provinsi}</td><td>${row.tahun}</td><td>${formatCurrency(row.airMinum)}</td><td>${formatCurrency(row.total)}</td>`;
        elements.tableBody.appendChild(tr);
    });
}

function initMap() {
    if (mapInstance) return;
    if (!document.getElementById('map')) return;
    mapInstance = L.map('map').setView([-2.5, 118.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapInstance);
}

// --- PAGINATION LOGIC ---
function setupPagination(totalItems, wrapper) {
    wrapper.innerHTML = "";
    const totalPages = Math.ceil(totalItems / paginationState.rowsPerPage);

    const createButton = (content, page) => {
        const button = document.createElement('button');
        button.innerHTML = content;
        if (page) {
            button.dataset.page = page;
            if (page === paginationState.currentPage) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                paginationState.currentPage = page;
                renderTablePage();
            });
        }
        return button;
    };

    // Tombol Previous
    const prevButton = createButton('<i class="fa-solid fa-chevron-left"></i>', paginationState.currentPage - 1);
    if (paginationState.currentPage === 1) prevButton.classList.add('disabled');
    wrapper.appendChild(prevButton);

    // Tombol Halaman Angka
    let pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (paginationState.currentPage > 3) pages.push('...');
        
        let start = Math.max(2, paginationState.currentPage - 1);
        let end = Math.min(totalPages - 1, paginationState.currentPage + 1);

        for (let i = start; i <= end; i++) pages.push(i);
        
        if (paginationState.currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }
    
    pages.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.textContent = '...';
            span.classList.add('pagination-ellipsis');
            wrapper.appendChild(span);
        } else {
            wrapper.appendChild(createButton(p, p));
        }
    });

    // Tombol Next
    const nextButton = createButton('<i class="fa-solid fa-chevron-right"></i>', paginationState.currentPage + 1);
    if (paginationState.currentPage === totalPages) nextButton.classList.add('disabled');
    wrapper.appendChild(nextButton);

    elements.totalDataSpan.textContent = `Total Data: ${totalItems}`;
}

function renderTablePage() {
    const start = (paginationState.currentPage - 1) * paginationState.rowsPerPage;
    const end = start + paginationState.rowsPerPage;
    const paginatedItems = paginationState.currentFilteredData.slice(start, end);
    
    populateTable(paginatedItems);
    setupPagination(paginationState.currentFilteredData.length, elements.paginationControls);
}

// --- VIEW LOGIC ---
function updateDashboardViewsForYear(year) {
    const numericYear = parseInt(year, 10);
    elements.sidebarYear.textContent = `s/d ${numericYear}`;
    
    paginationState.currentFilteredData = DUMMY_DATA.tableData.filter(d => d.tahun <= numericYear);
    paginationState.currentPage = 1;

    if (!elements.dashboardViews.table.classList.contains('view-hidden')) {
        renderTablePage();
    }
    
    const yearIndex = DUMMY_DATA.lineChart.labels.indexOf(String(numericYear));
    if (yearIndex > -1) {
        const slicedLabels = DUMMY_DATA.lineChart.labels.slice(0, yearIndex + 1);
        const slicedDatasets = DUMMY_DATA.lineChart.datasets.map(ds => ({ ...ds, data: ds.data.slice(0, yearIndex + 1) }));
        if (!elements.dashboardViews.chart.classList.contains('view-hidden')) {
             setupLineChart({ labels: slicedLabels, datasets: slicedDatasets });
        }
    }
}

function switchDashboardView(viewName) {
    if (timelapseInterval) {
        clearInterval(timelapseInterval);
        timelapseInterval = null;
        elements.timelapseButtons.forEach(button => button.innerHTML = `<i class="fa-solid fa-play"></i> <span>Mulai time-lapse</span>`);
    }

    Object.values(elements.dashboardViews).forEach(view => view.classList.add('view-hidden'));
    elements.viewButtons.forEach(btn => btn.classList.remove('active'));

    const viewToShow = elements.dashboardViews[viewName];
    const activeButton = document.querySelector(`.view-btn[data-view="${viewName}"]`);
    if (viewToShow) viewToShow.classList.remove('view-hidden');
    if (activeButton) activeButton.classList.add('active');
    
    const startYear = elements.timelapseSliders[0].min;
    const endYear = elements.timelapseSliders[0].max;
    
    switch (viewName) {
        case 'map':
            initMap();
            setTimeout(() => mapInstance?.invalidateSize(), 10);
            elements.timelapseSliders.forEach(s => s.value = startYear);
            updateDashboardViewsForYear(startYear);
            break;
        case 'chart':
            setupLineChart(DUMMY_DATA.lineChart); 
            elements.timelapseSliders.forEach(s => s.value = endYear);
            elements.sidebarYear.textContent = `${startYear} - ${endYear}`;
            break;
        case 'table':
            paginationState.currentFilteredData = [...DUMMY_DATA.tableData];
            paginationState.currentPage = 1;
            renderTablePage();
            elements.timelapseSliders.forEach(s => s.value = endYear);
            elements.sidebarYear.textContent = `${startYear} - ${endYear}`;
            break;
    }
}

// --- INITIALIZATION ---
function main() {
    updateLiveTimestamp();
    setInterval(updateLiveTimestamp, 1000);
    setupDoughnutChart(DUMMY_DATA.sidebar);
    
    elements.viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');
            switchDashboardView(viewName);
        });
    });

    elements.timelapseSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const year = e.target.value;
            elements.timelapseSliders.forEach(s => s.value = year);
            updateDashboardViewsForYear(year);
        });
    });

    elements.timelapseButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (timelapseInterval) {
                clearInterval(timelapseInterval);
                timelapseInterval = null;
                button.innerHTML = `<i class="fa-solid fa-play"></i> <span>Mulai time-lapse</span>`;
                return;
            }
            button.innerHTML = `<i class="fa-solid fa-pause"></i> <span>Jeda</span>`;
            timelapseInterval = setInterval(() => {
                let visibleSlider = Array.from(elements.timelapseSliders).find(s => !s.closest('.view-hidden'));
                if (!visibleSlider) return;
                let year = parseInt(visibleSlider.value);
                const maxYear = parseInt(visibleSlider.max);
                if (year < maxYear) {
                    year++;
                    visibleSlider.value = year;
                    visibleSlider.dispatchEvent(new Event('input'));
                } else {
                    clearInterval(timelapseInterval);
                    timelapseInterval = null;
                    button.innerHTML = `<i class="fa-solid fa-play"></i> <span>Mulai time-lapse</span>`;
                }
            }, 1200);
        });
    });
    
    elements.rowsPerPageSelect.addEventListener('change', (e) => {
        paginationState.rowsPerPage = parseInt(e.target.value, 10);
        paginationState.currentPage = 1;
        renderTablePage();
    });

    // Atur tampilan default awal
    switchDashboardView('map');
}

main();
