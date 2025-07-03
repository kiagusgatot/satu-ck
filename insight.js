document.addEventListener('DOMContentLoaded', () => {

    /**
     * Memperbarui jam yang berjalan di timestamp bar.
     */
    function updateLiveTimestamp() {
        const timestampEl = document.getElementById('live-timestamp');
        if (!timestampEl) return;

        const now = new Date();
        const options = {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        };
        timestampEl.textContent = `${new Intl.DateTimeFormat('id-ID', options).format(now)} WIB`;
    }

    /**
     * Menangani logika pencarian/filter pada halaman Insight.
     */
    function setupInsightSearch() {
        const searchInput = document.getElementById('insight-search-input');
        const allCards = document.querySelectorAll('.insight-card');
        
        if (!searchInput || allCards.length === 0) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            allCards.forEach(card => {
                const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const summary = card.querySelector('.card-summary')?.textContent.toLowerCase() || '';
                
                // Jika judul atau ringkasan mengandung kata kunci, tampilkan. Jika tidak, sembunyikan.
                if (title.includes(searchTerm) || summary.includes(searchTerm)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    }

    // --- Inisialisasi ---
    updateLiveTimestamp();
    setInterval(updateLiveTimestamp, 1000);
    setupInsightSearch();

});
