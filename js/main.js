document.addEventListener('DOMContentLoaded', () => {
    const mixedContentGrid = document.getElementById('mixed-content-grid');
    const moviesGrid = document.getElementById('movies-grid');
    const webseriesGrid = document.getElementById('webseries-grid');
    const searchResultsGrid = document.getElementById('search-results-grid'); // New: Get search results grid

    const navButtons = document.querySelectorAll('.nav-button');
    const contentSections = document.querySelectorAll('.content-section');

    const searchInput = document.getElementById('search-input'); // New: Get search input
    const searchButton = document.getElementById('search-button'); // New: Get search button

    let currentSearchTerm = ''; // To store the last search term

    // NEW: Add your backend API URL here
    const BASE_API_URL = 'http://65.2.175.194:3000/api/content';

    /**
     * Creates a modular movie/series card HTML element.
     * @param {object} item - The content item object from localStorage.
     * @returns {HTMLElement} The created movie card div.
     */
    function createMovieCard(item) {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'assets/images/placeholder.jpg';
        const title = item.title || item.name; // For movies or TV series
        const type = item.type === 'movie' ? 'Movie' : 'Web Series'; // Correctly display type

        movieCard.innerHTML = `
            <img src="${imageUrl}" alt="${title}" class="movie-card-thumbnail">
            <div class="movie-card-info">
                <h3 class="movie-card-title">${title}</h3>
                <p class="movie-card-type">${type}</p>
            </div>
        `;

        movieCard.addEventListener('click', () => {
            // Pass the content ID and type to the info page
            window.location.href = `info.html?id=${item.id}&type=${item.type}`;
        });

        return movieCard;
    }

    /**
     * Loads and displays content into the specified grid from the backend API. (UPDATED)
     * @param {HTMLElement} gridElement - The DOM element to append cards to.
     * @param {string} filterType - 'all', 'movie', or 'tv' to filter content.
     * @param {string} searchTerm - Optional search term to filter by title.
     */
    async function loadContent(gridElement, filterType = 'all', searchTerm = '') {
        gridElement.innerHTML = '<p class="loading-message">Loading content...</p>'; // Show loading state
        try {
            const response = await fetch(`${BASE_API_URL}/api/content`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const storedContent = await response.json();

            gridElement.innerHTML = ''; // Clear existing content

            let filteredContent = storedContent.filter(item => {
                if (filterType === 'all') return true;
                return item.type === filterType;
            });

            // Apply search term filter if provided
            if (searchTerm) {
                const lowerCaseSearchTerm = searchTerm.toLowerCase();
                filteredContent = filteredContent.filter(item => {
                    const title = (item.title || item.name || '').toLowerCase();
                    const overview = (item.overview || '').toLowerCase();
                    // Search in title OR overview
                    return title.includes(lowerCaseSearchTerm) || overview.includes(lowerCaseSearchTerm);
                });
            }

            if (filteredContent.length === 0) {
                if (searchTerm) {
                    gridElement.innerHTML = `<p class="loading-message">No results found for "${searchTerm}".</p>`;
                } else {
                    gridElement.innerHTML = '<p class="loading-message">No content added yet. Go to the <a href="admin.html">Admin Panel</a> to add movies or series.</p>';
                }
                return;
            }

            filteredContent.forEach(item => {
                const card = createMovieCard(item);
                gridElement.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading content:', error);
            gridElement.innerHTML = '<p class="loading-message">Failed to load content.</p>';
        }
    }

    /**
     * Performs a search and displays results.
     * @param {string} term - The search term.
     */
    function performSearch(term) {
        currentSearchTerm = term.trim(); // Store the cleaned term
        if (currentSearchTerm) {
            showSection('search-results-section'); // Switch to search results view
            loadContent(searchResultsGrid, 'all', currentSearchTerm);
        } else {
            // If search input is cleared, go back to home
            showSection('home-section');
            loadContent(mixedContentGrid, 'all');
        }
    }


    /**
     * Handles navigation between sections.
     * @param {string} targetSectionId - The ID of the section to activate.
     */
    function showSection(targetSectionId) {
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(targetSectionId).classList.add('active');

        navButtons.forEach(button => {
            button.classList.remove('active');
            // Deactivate search results button if it's not the current section
            if (button.dataset.section === targetSectionId) {
                button.classList.add('active');
            }
        });

        // Load content dynamically when section becomes active
        if (targetSectionId === 'home-section') {
            loadContent(mixedContentGrid, 'all');
            searchInput.value = ''; // Clear search input when returning to home
            currentSearchTerm = '';
        } else if (targetSectionId === 'movies-section') {
            loadContent(moviesGrid, 'movie');
            searchInput.value = ''; // Clear search input
            currentSearchTerm = '';
        } else if (targetSectionId === 'webseries-section') {
            loadContent(webseriesGrid, 'tv');
            searchInput.value = ''; // Clear search input
            currentSearchTerm = '';
        } else if (targetSectionId === 'search-results-section') {
            // For search results, ensure the current search term is used if section is directly activated (e.g., from search button click)
            // If coming from another nav button, currentSearchTerm might be empty, so no results will show
            if (currentSearchTerm) {
                loadContent(searchResultsGrid, 'all', currentSearchTerm);
            } else {
                 // If no search term, prompt user
                searchResultsGrid.innerHTML = '<p class="loading-message">Enter a search term in the box above to find content.</p>';
            }
        }
        // 'my-ntflix-section' doesn't need dynamic content loading here
    }

    // --- Event Listeners for Search ---
    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });

    // Optional: Clear search and go home if input becomes empty
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '' && document.getElementById('search-results-section').classList.contains('active')) {
            showSection('home-section'); // Go back to home if search is cleared
        }
    });


    // Initialize: Load content for the default 'home' section
    showSection('home-section');

    // Add event listeners for bottom navigation
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSectionId = button.dataset.section;
            showSection(targetSectionId);
        });
    });
});