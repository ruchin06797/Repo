document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: Replace 'YOUR_TMDB_API_KEY' with your actual TMDB API key
    const TMDB_API_KEY = 'ada8572dee53fb8cf20d9bcf0affdd0b';

    // NEW: Add your backend API URL here
    const BASE_API_URL = 'http://65.2.175.194:3000/api/content';
    // --- Admin Login Elements ---
    const adminLoginSection = document.getElementById('admin-login-section');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminPasswordInput = document.getElementById('admin-password');
    const loginErrorMessage = document.getElementById('login-error-message');
    const adminContentWrapper = document.getElementById('admin-content-wrapper');

    // --- Input Mode Selector Elements ---
    const showTmdbInputButton = document.getElementById('show-tmdb-input');
    const showManualInputButton = document.getElementById('show-manual-input');
    const tmdbInputSection = document.getElementById('tmdb-input-section');
    const manualInputSection = document.getElementById('manual-input-section');

    // --- TMDB Input Elements ---
    const tmdbForm = document.getElementById('tmdb-form');
    const tmdbIdInput = document.getElementById('tmdb-id');
    const contentTypeSelect = document.getElementById('content-type');

    // --- Manual Input Elements ---
    const manualForm = document.getElementById('manual-form');
    const manualContentTitleInput = document.getElementById('manual-content-title');
    const manualContentTypeSelect = document.getElementById('manual-content-type');
    const manualPosterUrlInput = document.getElementById('manual-poster-url');
    const manualBackdropUrlInput = document.getElementById('manual-backdrop-url');
    const manualOverviewTextarea = document.getElementById('manual-overview');
    const manualMovieVideoLabel = document.getElementById('manual-movie-video-label');
    const manualVideoUrlInput = document.getElementById('manual-video-url');
    const manualEpisodesInputSection = document.getElementById('manual-episodes-input-section');
    const manualEpisodesContainer = document.getElementById('manual-episodes-container');
    const addManualEpisodeButton = document.getElementById('add-manual-episode-button');
    const addManualContentButton = document.getElementById('add-manual-content-button');

    // --- Shared Content Preview Elements (used by both TMDB and Manual) ---
    const tmdbDetailsDiv = document.getElementById('tmdb-details'); // Renamed from tmdb-data-preview
    const tmdbPoster = document.getElementById('tmdb-poster');
    const tmdbTitle = document.getElementById('tmdb-title');
    const tmdbOverview = document.getElementById('tmdb-overview');
    const tmdbEpisodesDiv = document.getElementById('tmdb-episodes'); // This is for TMDB-fetched episodes' M3U8 inputs
    const movieM3u8Label = document.getElementById('movie-m3u8-label');
    const movieM3u8LinkInput = document.getElementById('m3u8-link');
    const addToListButton = document.getElementById('add-to-library'); // TMDB specific "Add to Library" button

    // --- Manage Content Elements ---
    const contentList = document.getElementById('content-list');

    let currentFetchedContent = null; // To store TMDB data temporarily before saving

    // --- PASSWORD CHECK LOGIC ---
    const CORRECT_PASSWORD = "api"; // **CHANGE THIS TO A STRONG PASSWORD**

    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPassword = adminPasswordInput.value;

        if (enteredPassword === CORRECT_PASSWORD) {
            adminLoginSection.style.display = 'none'; // Hide login form
            adminContentWrapper.style.display = 'block'; // Show admin content
            loginErrorMessage.textContent = ''; // Clear any error messages
            renderContentList(); // Load content after successful login
        } else {
            loginErrorMessage.textContent = 'Incorrect password. Please try again.';
            adminPasswordInput.value = ''; // Clear password field
        }
    });

    // --- INPUT MODE SELECTION LOGIC ---
    function showInputMode(mode) {
        showTmdbInputButton.classList.remove('active');
        showManualInputButton.classList.remove('active');
        tmdbInputSection.style.display = 'none';
        manualInputSection.style.display = 'none';
        tmdbDetailsDiv.style.display = 'none'; // Hide preview when switching modes

        if (mode === 'tmdb') {
            showTmdbInputButton.classList.add('active');
            tmdbInputSection.style.display = 'block';
            tmdbForm.reset(); // Clear TMDB form fields
            currentFetchedContent = null; // Clear any pending TMDB data
        } else { // mode === 'manual'
            showManualInputButton.classList.add('active');
            manualInputSection.style.display = 'block';
            manualForm.reset(); // Clear manual form fields
            manualEpisodesContainer.innerHTML = ''; // Clear manual episodes
            manualEpisodesInputSection.style.display = 'none'; // Hide episode section initially
            updateManualFormForContentType(); // Reset manual form for default movie type
        }
    }

    showTmdbInputButton.addEventListener('click', () => showInputMode('tmdb'));
    showManualInputButton.addEventListener('click', () => showInputMode('manual'));

    // Update manual form based on selected content type (movie/tv)
    manualContentTypeSelect.addEventListener('change', updateManualFormForContentType);

    function updateManualFormForContentType() {
        if (manualContentTypeSelect.value === 'movie') {
            manualMovieVideoLabel.style.display = 'block';
            manualVideoUrlInput.style.display = 'block';
            manualVideoUrlInput.setAttribute('required', 'true');
            manualEpisodesInputSection.style.display = 'none';
            manualEpisodesContainer.innerHTML = ''; // Clear episodes when switching to movie
        } else { // tv
            manualMovieVideoLabel.style.display = 'none';
            manualVideoUrlInput.style.display = 'none';
            manualVideoUrlInput.removeAttribute('required');
            manualEpisodesInputSection.style.display = 'block';
        }
    }

    // --- Manual Episode Addition for TV Shows ---
    let manualEpisodeCounter = 0; // To give unique IDs to manually added episodes

    addManualEpisodeButton.addEventListener('click', () => {
        manualEpisodeCounter++;
        const episodeGroup = document.createElement('div');
        episodeGroup.classList.add('episode-input-group');
        episodeGroup.innerHTML = `
            <span>Season: <input type="number" class="manual-episode-season" value="1" min="1" required style="width: 50px;"> Episode: <input type="number" class="manual-episode-number" value="${manualEpisodeCounter}" min="1" required style="width: 50px;"></span>
            <input type="url" class="manual-episode-link" placeholder="M3U8 link" required>
            <button type="button" class="delete-episode-button">Delete</button>
        `;
        manualEpisodesContainer.appendChild(episodeGroup);

        episodeGroup.querySelector('.delete-episode-button').addEventListener('click', (e) => {
            e.target.closest('.episode-input-group').remove();
        });
    });


    // --- Shared Content Storage Functions ---

    /**
     * Generates a unique ID for manually added content.
     * Could be more robust (e.g., UUID), but for client-side demo, timestamp + random is okay.
     * @returns {string} A unique ID.
     */
    function generateUniqueId() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Saves a content item to the backend API. (UPDATED)
     * @param {object} content - The content object to save.
     */
    async function saveContent(content) {
        try {
            const response = await fetch(`${BASE_API_URL}/api/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content)
            });

            if (response.status === 409) { // Conflict: content already exists
                alert('Content with this TMDB ID or generated ID and type already exists in your library!');
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Content saved:', data);
            alert('Content added successfully to your library!');
            renderContentList(); // Re-render the list after saving
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Failed to add content. Please try again.');
        }
    }

    /**
     * Removes a content item from the backend API based on its ID and type. (UPDATED)
     * @param {string} id - The ID of the content (could be TMDB ID or generated).
     * @param {string} type - The type of content ('movie' or 'tv').
     */
    async function removeContent(id, type) {
        try {
            const response = await fetch(`${BASE_API_URL}/api/content/${id}/${type}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Content removed:', data.message);
            alert('Content removed successfully!');
            renderContentList(); // Re-render the list after removal
        } catch (error) {
            console.error('Error removing content:', error);
            alert('Failed to remove content. Please try again.');
        }
    }

    /**
     * Renders the list of all content currently stored in the backend API. (UPDATED)
     */
    async function renderContentList() {
        contentList.innerHTML = '<li>Loading content...</li>'; // Show loading state
        try {
            const response = await fetch(`${BASE_API_URL}/api/content`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const storedContent = await response.json();

            contentList.innerHTML = ''; // Clear existing list items

            if (storedContent.length === 0) {
                contentList.innerHTML = '<li>No content added yet.</li>';
                return;
            }

            storedContent.forEach(item => {
                const listItem = document.createElement('li');
                const title = item.title || item.name; // Use 'title' for movies, 'name' for TV shows
                const contentTypeDisplay = item.type === 'movie' ? 'Movie' : 'Web Series'; // Consistent display

                listItem.innerHTML = `
                    <span>${title} (${contentTypeDisplay})</span>
                    <button data-id="${item.id}" data-type="${item.type}">Remove</button>
                `;
                contentList.appendChild(listItem);
            });

            // Add event listeners to all 'Remove' buttons
            contentList.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', async (e) => { // Added async keyword here
                    const id = e.target.dataset.id; // Get ID as string
                    const type = e.target.dataset.type;
                    const contentTitle = e.target.previousElementSibling.textContent.split('(')[0].trim(); // Get title for confirmation

                    if (confirm(`Are you sure you want to remove "${contentTitle}"?`)) {
                        await removeContent(id, type); // Await the removeContent call
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching content list:', error);
            contentList.innerHTML = '<li>Failed to load content.</li>';
        }
    }

    // --- TMDB Input Logic (largely unchanged, but uses currentFetchedContent) ---
    tmdbForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tmdbId = tmdbIdInput.value.trim();
        const contentType = contentTypeSelect.value;

        if (!tmdbId) {
            alert('Please enter a TMDB ID.');
            return;
        }

        try {
            let apiUrl;
            if (contentType === 'movie') {
                apiUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
            } else { // 'tv'
                apiUrl = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}`;
            }

            const response = await fetch(apiUrl);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Content with TMDB ID ${tmdbId} not found. Please check the ID and type.`);
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            // Store fetched data temporarily
            currentFetchedContent = {
                id: data.id,
                type: contentType,
                title: data.title || data.name,
                overview: data.overview,
                poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'assets/images/placeholder.jpg',
                backdrop_path: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
                release_date: data.release_date || data.first_air_date,
                vote_average: data.vote_average,
                genres: data.genres,
                runtime: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null),
                seasons: contentType === 'tv' ? data.seasons : undefined
            };

            // Populate shared preview area
            tmdbPoster.src = currentFetchedContent.poster_path;
            tmdbPoster.alt = currentFetchedContent.title;
            tmdbTitle.textContent = currentFetchedContent.title;
            tmdbOverview.textContent = currentFetchedContent.overview || 'No overview available.';

            // Reset and configure M3U8 input fields based on content type
            tmdbEpisodesDiv.innerHTML = '<h4>Seasons and Episodes (for TV Shows)</h4><p>Enter M3U8 links for each episode. (Leave blank for episodes without a link).</p>';
            movieM3u8LinkInput.value = '';

            if (contentType === 'tv' && data.seasons) {
                tmdbEpisodesDiv.style.display = 'block';
                movieM3u8Label.style.display = 'none';
                movieM3u8LinkInput.style.display = 'none';

                data.seasons.sort((a, b) => a.season_number - b.season_number).forEach(season => {
                    if (season.episode_count > 0 && season.season_number !== 0) {
                        const seasonDiv = document.createElement('div');
                        seasonDiv.innerHTML = `<h5>${season.name} (Season ${season.season_number})</h5>`;
                        tmdbEpisodesDiv.appendChild(seasonDiv);

                        fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`)
                            .then(res => res.json())
                            .then(seasonData => {
                                seasonData.episodes.sort((a, b) => a.episode_number - b.episode_number).forEach(episode => {
                                    const episodeGroup = document.createElement('div');
                                    episodeGroup.classList.add('episode-input-group');
                                    episodeGroup.innerHTML = `
                                        <span>S${season.season_number}E${episode.episode_number}: ${episode.name || 'Episode ' + episode.episode_number}</span>
                                        <input type="url" class="episode-m3u8-link"
                                               data-season="${season.season_number}"
                                               data-episode="${episode.episode_number}"
                                               placeholder="M3U8 link for this episode">
                                    `;
                                    seasonDiv.appendChild(episodeGroup);
                                });
                            })
                            .catch(error => {
                                console.error(`Error fetching season ${season.season_number} details:`, error);
                                const errorP = document.createElement('p');
                                errorP.style.color = 'orange';
                                errorP.textContent = `Could not load episodes for Season ${season.season_number}.`;
                                seasonDiv.appendChild(errorP);
                            });
                    }
                });
            } else {
                tmdbEpisodesDiv.style.display = 'none';
                movieM3u8Label.style.display = 'block';
                movieM3u8LinkInput.style.display = 'block';
            }

            tmdbDetailsDiv.style.display = 'block'; // Show the preview section

        } catch (error) {
            console.error('Error fetching TMDB data:', error);
            alert('Failed to fetch TMDB data: ' + error.message);
            tmdbDetailsDiv.style.display = 'none';
            currentFetchedContent = null;
        }
    });

    addToListButton.addEventListener('click', () => {
        if (!currentFetchedContent) {
            alert('Please fetch TMDB data first.');
            return;
        }

        const contentType = currentFetchedContent.type;
        let contentToSave = { ...currentFetchedContent };

        if (contentType === 'movie') {
            const m3u8Link = movieM3u8LinkInput.value.trim();
            if (!m3u8Link) {
                alert('Please enter an M3U8 link for the movie.');
                return;
            }
            contentToSave.video_url = m3u8Link;
        } else if (contentType === 'tv') {
            const episodesWithLinks = {};
            let hasAtLeastOneEpisodeLink = false;

            document.querySelectorAll('#tmdb-episodes .episode-m3u8-link').forEach(input => {
                const seasonNum = parseInt(input.dataset.season);
                const episodeNum = parseInt(input.dataset.episode);
                const link = input.value.trim();

                if (link) {
                    if (!episodesWithLinks[seasonNum]) {
                        episodesWithLinks[seasonNum] = {};
                    }
                    episodesWithLinks[seasonNum][episodeNum] = link;
                    hasAtLeastOneEpisodeLink = true;
                }
            });

            if (!hasAtLeastOneEpisodeLink) {
                alert('Please enter at least one M3U8 link for a TV episode, or switch to Movie type.');
                return;
            }
            contentToSave.episodes = episodesWithLinks;
        }

        saveContent(contentToSave);
        tmdbForm.reset();
        tmdbDetailsDiv.style.display = 'none';
        currentFetchedContent = null;
    });

    // --- Manual Input Logic ---
    manualForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const contentType = manualContentTypeSelect.value;
        const title = manualContentTitleInput.value.trim();
        const posterUrl = manualPosterUrlInput.value.trim();
        const backdropUrl = manualBackdropUrlInput.value.trim();
        const overview = manualOverviewTextarea.value.trim();
        const videoUrl = manualVideoUrlInput.value.trim();

        if (!title || !posterUrl) {
            alert('Please fill in at least the Title and Poster Image URL.');
            return;
        }

        const contentItem = {
            id: generateUniqueId(), // Generate unique ID for manual entry
            type: contentType,
            title: title,
            name: contentType === 'tv' ? title : undefined, // For TV type, also set 'name'
            overview: overview,
            poster_path: posterUrl,
            backdrop_path: backdropUrl || null, // Allow backdrop to be optional
            release_date: new Date().toISOString().split('T')[0], // Current date
            vote_average: null, // No rating for manual
            genres: [], // No genres for manual
            runtime: null, // No runtime for manual
        };

        if (contentType === 'movie') {
            if (!videoUrl) {
                alert('Please provide a Video URL (M3U8) for the movie.');
                return;
            }
            contentItem.video_url = videoUrl;
        } else { // tv
            const episodes = {};
            let hasAtLeastOneEpisode = false;

            document.querySelectorAll('#manual-episodes-container .episode-input-group').forEach(group => {
                const seasonInput = group.querySelector('.manual-episode-season');
                const episodeInput = group.querySelector('.manual-episode-number');
                const linkInput = group.querySelector('.manual-episode-link');

                const seasonNum = parseInt(seasonInput.value);
                const episodeNum = parseInt(episodeInput.value);
                const link = linkInput.value.trim();

                if (link && !isNaN(seasonNum) && !isNaN(episodeNum)) {
                    if (!episodes[seasonNum]) {
                        episodes[seasonNum] = {};
                    }
                    episodes[seasonNum][episodeNum] = link;
                    hasAtLeastOneEpisode = true;
                }
            });

            if (!hasAtLeastOneEpisode) {
                alert('Please add at least one episode with an M3U8 link for the TV show.');
                return;
            }
            contentItem.episodes = episodes;
        }

        saveContent(contentItem);
        manualForm.reset();
        manualEpisodesContainer.innerHTML = ''; // Clear manual episodes
        manualEpisodesInputSection.style.display = 'none'; // Hide episode section
        updateManualFormForContentType(); // Reset form state
        tmdbDetailsDiv.style.display = 'none'; // Hide preview after adding manual
    });


    // Initialize: Ensure the TMDB input section is shown by default on load
    showInputMode('tmdb');
});