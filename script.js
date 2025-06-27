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
    tableData: [
        { no: 1, provinsi: 'Aceh', tahun: 2015, airMinum: 5000000, total: 15000000 },
        { no: 2, provinsi: 'Sumatera Utara', tahun: 2016, airMinum: 7500000, total: 25000000 },
        { no: 3, provinsi: 'Jawa Barat', tahun: 2017, airMinum: 12000000, total: 45000000 },
        { no: 4, provinsi: 'DKI Jakarta', tahun: 2018, airMinum: 25000000, total: 80000000 },
        { no: 5, provinsi: 'Kalimantan Timur', tahun: 2019, airMinum: 9000000, total: 30000000 },
        { no: 6, provinsi: 'Papua', tahun: 2020, airMinum: 3000000, total: 10000000 },
        { no: 7, provinsi: 'Jawa Tengah', tahun: 2021, airMinum: 15000000, total: 50000000 },
        { no: 8, provinsi: 'Sulawesi Selatan', tahun: 2022, airMinum: 8000000, total: 28000000 },
        { no: 9, provinsi: 'Bali', tahun: 2023, airMinum: 18000000, total: 60000000 },
        { no: 10, provinsi: 'Nusa Tenggara Barat', tahun: 2024, airMinum: 6000000, total: 20000000 },
        { no: 11, provinsi: 'Riau', tahun: 2025, airMinum: 10000000, total: 35000000 },
    ]
};

// --- UTILITIES ---
/**
 * Format angka menjadi format mata uang IDR.
 * @param {number} number - Angka yang akan diformat.
 * @returns {string} - String mata uang yang diformat.
 */
const formatCurrency = (number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
}).format(number);

// --- STATE MANAGEMENT ---
// Variabel untuk menyimpan instance chart dan map agar tidak dibuat ulang
let doughnutChartInstance;
let lineChartInstance;
let mapInstance;
let timelapseInterval = null;

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
    views: {
        map: document.getElementById('map-view'),
        table: document.getElementById('table-view'),
        chart: document.getElementById('chart-view'),
    },
    tableBody: document.querySelector('.investment-table tbody'),
    timelapseButtons: document.querySelectorAll('.timelapse-btn'),
    timelapseSliders: document.querySelectorAll('.timelapse-slider'),
};

// --- FUNCTIONS ---

/**
 * Memperbarui jam yang berjalan di timestamp bar.
 */
function updateLiveTimestamp() {
    if (!elements.liveTimestamp) return;
    const now = new Date();
    const options = {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    };
    elements.liveTimestamp.textContent = `${new Intl.DateTimeFormat('id-ID', options).format(now)} WIB`;
}

/**
 * Menginisialisasi atau memperbarui Doughnut Chart di sidebar.
 */
function setupDoughnutChart(data) {
    const ctx = document.getElementById('investmentChart')?.getContext('2d');
    if (!ctx) return;
    
    elements.sidebarTotal.textContent = formatCurrency(data.total);
    elements.legendValues.airMinum.textContent = formatCurrency(data.sectors['air-minum']);
    elements.legendValues.airLimbah.textContent = formatCurrency(data.sectors['air-limbah']);
    elements.legendValues.persampahan.textContent = formatCurrency(data.sectors['persampahan']);
    elements.legendValues.strategis.textContent = formatCurrency(data.sectors['strategis']);
    elements.legendValues.bangunan.textContent = formatCurrency(data.sectors['bangunan']);

    if (doughnutChartInstance) {
        doughnutChartInstance.destroy();
    }

    doughnutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Air Minum', 'Air Limbah', 'Persampahan', 'Kawasan Strategis', 'Bangunan Gedung'],
            datasets: [{
                data: Object.values(data.sectors),
                backgroundColor: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { 
                    callbacks: {
                        label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
                    }
                }
            }
        }
    });
}

/**
 * Mengatur Line Chart: menghancurkan instance lama dan membuat yang baru.
 * @param {object} data - Data untuk ditampilkan di chart.
 */
function setupLineChart(data) {
    if (lineChartInstance) {
        lineChartInstance.destroy(); 
    }
    const ctx = document.getElementById('lineChart')?.getContext('2d');
    if (!ctx) return;

    const datasets = data.datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        pointBackgroundColor: ds.color,
        pointBorderColor: '#fff',
        fill: false,
        tension: 0.4
    }));

    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: data.labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => `${value} T` }
                },
                x: { grid: { display: false } }
            },
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { display: true, position: 'top' } },
            elements: { point: { radius: 5, hoverRadius: 7, borderWidth: 3 } }
        }
    });
}


/**
 * Mengisi tabel dengan data.
 */
function populateTable(data) {
    if (!elements.tableBody) return;
    elements.tableBody.innerHTML = ''; 
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.no}</td>
            <td>${row.provinsi}</td>
            <td>${row.tahun}</td>
            <td>${formatCurrency(row.airMinum)}</td>
            <td>${formatCurrency(row.total)}</td>
        `;
        elements.tableBody.appendChild(tr);
    });
}


/**
 * Menginisialisasi Peta Leaflet.
 */
function initMap() {
    if (mapInstance) return;
    if (!document.getElementById('map')) return;

    mapInstance = L.map('map').setView([-2.5, 118.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstance);
    
    L.marker([-6.2088, 106.8456]).addTo(mapInstance).bindPopup('<b>DKI Jakarta</b><br>Contoh penanda investasi.');

    const legend = L.control({position: 'bottomleft'});
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend-map');
        const grades = [
            { value: '> 40 M', color: '#663300' },
            { value: '30-40 M', color: '#994C00' },
            { value: '20-30 M', color: '#CC6600' },
            { value: '10-20 M', color: '#FF9933' },
            { value: '< 10 M', color: '#FFCC99' },
        ];
        div.innerHTML = '<h4>Legenda Investasi</h4>';
        grades.forEach(grade => {
            div.innerHTML += `<div class="legend-map-item"><i style="background:${grade.color}"></i> ${grade.value}</div>`;
        });
        return div;
    };
    legend.addTo(mapInstance);
}

/**
 * Memperbarui semua tampilan berdasarkan tahun yang dipilih dari slider.
 * @param {number|string} year - Tahun yang dipilih.
 */
function updateViewsForYear(year) {
    const numericYear = parseInt(year, 10);
    elements.sidebarYear.textContent = `s/d ${numericYear}`;

    // Filter dan perbarui tabel
    const filteredTableData = DUMMY_DATA.tableData.filter(d => d.tahun <= numericYear);
    if (!elements.views.table.classList.contains('view-hidden')) {
        populateTable(filteredTableData);
    }
    
    // Filter dan perbarui Line Chart
    const yearIndex = DUMMY_DATA.lineChart.labels.indexOf(String(numericYear));
    if (yearIndex > -1) {
        const slicedLabels = DUMMY_DATA.lineChart.labels.slice(0, yearIndex + 1);
        const slicedDatasets = DUMMY_DATA.lineChart.datasets.map(ds => ({
            ...ds,
            data: ds.data.slice(0, yearIndex + 1)
        }));
        if (!elements.views.chart.classList.contains('view-hidden')) {
             setupLineChart({ labels: slicedLabels, datasets: slicedDatasets });
        }
    }
}


/**
 * Mengatur pergantian tampilan antara Tabel, Peta, dan Grafik.
 * @param {string} viewName - Nama view yang akan ditampilkan ('table', 'map', 'chart').
 */
function switchView(viewName) {
    // Hentikan time-lapse yang sedang berjalan
    if (timelapseInterval) {
        clearInterval(timelapseInterval);
        timelapseInterval = null;
        elements.timelapseButtons.forEach(button => {
            button.innerHTML = `<i class="fa-solid fa-play"></i> <span>Mulai time-lapse</span>`;
        });
    }

    Object.values(elements.views).forEach(view => view.classList.add('view-hidden'));
    elements.viewButtons.forEach(btn => btn.classList.remove('active'));

    const viewToShow = elements.views[viewName];
    const activeButton = document.querySelector(`.view-btn[data-view="${viewName}"]`);

    if (viewToShow) viewToShow.classList.remove('view-hidden');
    if (activeButton) activeButton.classList.add('active');
    
    // Atur ulang slider ke tahun awal atau akhir tergantung view
    const startYear = elements.timelapseSliders[0].min;
    const endYear = elements.timelapseSliders[0].max;
    
    switch (viewName) {
        case 'map':
            initMap();
            setTimeout(() => mapInstance?.invalidateSize(), 10);
            elements.timelapseSliders.forEach(s => s.value = startYear);
            updateViewsForYear(startYear);
            break;
        case 'chart':
            // PEMBARUAN: Tampilkan data lengkap saat pertama kali dibuka
            setupLineChart(DUMMY_DATA.lineChart); 
            elements.timelapseSliders.forEach(s => s.value = endYear);
            elements.sidebarYear.textContent = `${startYear} - ${endYear}`;
            break;
        case 'table':
            elements.timelapseSliders.forEach(s => s.value = startYear);
            updateViewsForYear(startYear);
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
            const viewToDisplay = button.getAttribute('data-view');
            switchView(viewToDisplay);
        });
    });

    elements.timelapseSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const year = e.target.value;
            elements.timelapseSliders.forEach(s => s.value = year);
            updateViewsForYear(year);
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
                // Temukan slider yang terlihat
                let visibleSlider = Array.from(elements.timelapseSliders).find(s => !s.closest('.view-hidden'));
                if (!visibleSlider) visibleSlider = elements.timelapseSliders[0];
                
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
            }, 1200); // Kecepatan update (ms)
        });
    });

    // Atur tampilan default awal
    switchView('map');
}

main();
