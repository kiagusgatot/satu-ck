document.addEventListener('DOMContentLoaded', () => {
    // --- DATA DUMMY KHUSUS UNTUK HALAMAN DETAIL ---
    const DETAIL_DATA = {
        lineChart: {
            labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
            datasets: [{
                label: 'Nilai SPM Air Minum (%)',
                data: [68, 70, 72, 75, 74, 78, 80, 82, 85, 88, 90],
                color: '#3498db'
            }]
        },
        tableData: Array.from({ length: 1774 }, (_, i) => ({
            no: i + 1,
            provinsi: `Provinsi #${(i % 34) + 1}`,
            tahun: 2015 + (i % 11),
            nilai: 65 + (i % 35),
            status: (65 + (i % 35)) > 80 ? 'Tercapai' : 'Belum Tercapai'
        }))
    };

    // --- STATE MANAGEMENT ---
    let lineChartInstance, mapInstance, timelapseInterval = null;
    let paginationState = {
        currentPage: 1,
        rowsPerPage: 10,
        currentFilteredData: [...DETAIL_DATA.tableData]
    };

    // --- DOM ELEMENTS ---
    const elements = {
        liveTimestamp: document.getElementById('live-timestamp'),
        viewButtons: document.querySelectorAll('.view-switcher .view-btn'),
        views: {
            map: document.getElementById('map-view'),
            table: document.getElementById('table-view'),
            chart: document.getElementById('chart-view'),
        },
        tableBody: document.querySelector('.investment-table tbody'),
        // Time-lapse elements
        timelapseButtons: document.querySelectorAll('.timelapse-btn'),
        timelapseSliders: document.querySelectorAll('.timelapse-slider'),
        // Paginasi elements
        paginationControls: document.querySelector('.pagination'),
        rowsPerPageSelect: document.querySelector('.pagination-select'),
        totalDataSpan: document.querySelector('.total-data-span'),
    };

    // --- FUNCTIONS ---
    function updateLiveTimestamp() {
        if (!elements.liveTimestamp) return;
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        elements.liveTimestamp.textContent = `${new Intl.DateTimeFormat('id-ID', options).format(now)} WIB`;
    }

    function setupLineChart(data) {
        if (lineChartInstance) lineChartInstance.destroy();
        const ctx = document.getElementById('lineChart')?.getContext('2d');
        if (!ctx) return;
        const datasets = data.datasets.map(ds => ({ ...ds, borderColor: ds.color, backgroundColor: ds.color, pointBackgroundColor: ds.color, pointBorderColor: '#fff', fill: false, tension: 0.4 }));
        lineChartInstance = new Chart(ctx, { type: 'line', data: { labels: data.labels, datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, ticks: { callback: (value) => `${value}%` } } } } });
    }

    function populateTable(data) {
        if (!elements.tableBody) return;
        elements.tableBody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${row.no}</td><td>${row.provinsi}</td><td>${row.tahun}</td><td>${row.nilai}%</td><td>${row.status}</td>`;
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
        if (totalItems === 0) {
            elements.totalDataSpan.textContent = "Total Data: 0";
            return;
        }
        const totalPages = Math.ceil(totalItems / paginationState.rowsPerPage);
        const createButton = (content, page) => {
            const button = document.createElement('button');
            button.innerHTML = content;
            if (page) {
                button.dataset.page = page;
                if (page === paginationState.currentPage) button.classList.add('active');
                button.addEventListener('click', () => {
                    paginationState.currentPage = page;
                    renderTablePage();
                });
            }
            return button;
        };
        const prevButton = createButton('<i class="fa-solid fa-chevron-left"></i>', paginationState.currentPage - 1);
        if (paginationState.currentPage === 1) prevButton.classList.add('disabled');
        wrapper.appendChild(prevButton);
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
        const nextButton = createButton('<i class="fa-solid fa-chevron-right"></i>', paginationState.currentPage + 1);
        if (paginationState.currentPage === totalPages || totalPages === 0) nextButton.classList.add('disabled');
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
    
    // --- VIEW & TIME-LAPSE LOGIC ---
    function updateViewsForYear(year) {
        const numericYear = parseInt(year, 10);
        
        // Filter data for table and map
        paginationState.currentFilteredData = DETAIL_DATA.tableData.filter(d => d.tahun <= numericYear);
        paginationState.currentPage = 1; 

        if (!elements.views.table.classList.contains('view-hidden')) {
            renderTablePage();
        }

        // Filter data for line chart
        const yearIndex = DETAIL_DATA.lineChart.labels.indexOf(String(numericYear));
        if (yearIndex > -1 && !elements.views.chart.classList.contains('view-hidden')) {
            const slicedLabels = DETAIL_DATA.lineChart.labels.slice(0, yearIndex + 1);
            const slicedDatasets = DETAIL_DATA.lineChart.datasets.map(ds => ({
                ...ds,
                data: ds.data.slice(0, yearIndex + 1)
            }));
            setupLineChart({ labels: slicedLabels, datasets: slicedDatasets });
        }
    }

    function switchView(viewName) {
        if (timelapseInterval) {
            clearInterval(timelapseInterval);
            timelapseInterval = null;
            elements.timelapseButtons.forEach(button => button.innerHTML = `<i class="fa-solid fa-play"></i> <span>Mulai time-lapse</span>`);
        }

        Object.values(elements.views).forEach(view => view.classList.add('view-hidden'));
        elements.viewButtons.forEach(btn => btn.classList.remove('active'));

        const viewToShow = elements.views[viewName];
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
                updateViewsForYear(startYear);
                break;
            case 'chart':
                setupLineChart(DETAIL_DATA.lineChart);
                elements.timelapseSliders.forEach(s => s.value = endYear);
                break;
            case 'table':
                paginationState.currentFilteredData = [...DETAIL_DATA.tableData];
                renderTablePage();
                elements.timelapseSliders.forEach(s => s.value = endYear);
                break;
        }
    }

    // --- INITIALIZATION ---
    function main() {
        updateLiveTimestamp();
        setInterval(updateLiveTimestamp, 1000);

        elements.viewButtons.forEach(button => {
            button.addEventListener('click', () => switchView(button.getAttribute('data-view')));
        });
        
        elements.rowsPerPageSelect.addEventListener('change', () => {
            paginationState.rowsPerPage = parseInt(elements.rowsPerPageSelect.value, 10);
            paginationState.currentPage = 1;
            renderTablePage();
        });

        elements.timelapseSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                 updateViewsForYear(e.target.value);
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

        // Default view
        switchView('table');
    }

    main();
});
