document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const contentId = params.get('id');
    const contentType = params.get('type');

    // NEW: Add your backend API URL here
    const BASE_API_URL = 'http://65.2.175.194:3000/api/content';
    const loadingMessage = document.getElementById('loading-message');
    const notFoundMessage = document.getElementById('not-found-message');
    const contentDisplayArea = document.querySelector('.content-display-area');
    const contentTitleElem = document.getElementById('content-title');
    const contentOverviewElem = document.getElementById('content-overview');
    const contentPosterElem = document.getElementById('content-poster');
    const contentBackdropElem = document.getElementById('content-backdrop');
    const contentDetailsElem = document.getElementById('content-details');
    const watchButtonsContainer = document.getElementById('watch-buttons-container');

    // Initial state
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (contentDisplayArea) contentDisplayArea.style.display = 'none';
    if (notFoundMessage) notFoundMessage.style.display = 'none';

    // NEW: Function to load content details from the API
    async function loadContentDetails() {
        if (!contentId || !contentType) {
            showError('Invalid content link. Please go back to the homepage.');
            return;
        }

        try {
            // Fetch ALL content and then filter, or fetch specific content if backend supports it
            // For simplicity, we'll fetch all and find, but a direct API call for one item is better
            const response = await fetch(`${BASE_API_URL}/api/content`);
            if (!response.ok) {
                if (response.status === 404) {
                    showError('Content not found in your library. Please go back to the homepage.');
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const storedContent = await response.json();

            // Find the requested content from the fetched array
            const foundContent = storedContent.find(item =>
                String(item.id) === contentId && item.type === contentType
            );

            if (!foundContent) {
                showError('Content not found in your library. Please go back to the homepage.');
                return;
            }

            displayContent(foundContent);
        } catch (e) {
            showError('Error loading content data. Please try again.');
            console.error("Error fetching content details:", e);
        }
    }

    // Call the new function to load content when the page loads
    loadContentDetails();


    function displayContent(content) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (contentDisplayArea) contentDisplayArea.style.display = 'block';

        // Set title
        if (contentTitleElem) {
            contentTitleElem.textContent = content.title || content.name;
            contentTitleElem.style.display = 'block';
        }

        // Set overview
        if (contentOverviewElem) {
            contentOverviewElem.textContent = content.overview || 'No overview available.';
            contentOverviewElem.style.display = 'block';
        }

        // Set poster image
        if (contentPosterElem) {
            if (content.poster_path) {
                contentPosterElem.src = content.poster_path;
                contentPosterElem.alt = content.title || content.name;
                contentPosterElem.style.display = 'block';
                contentPosterElem.onerror = function() {
                    this.style.display = 'none';
                    console.error('Failed to load poster image:', this.src);
                };
            } else {
                contentPosterElem.style.display = 'none';
            }
        }

        // Set backdrop image
        if (contentBackdropElem) {
            if (content.backdrop_path) {
                contentBackdropElem.src = content.backdrop_path;
                contentBackdropElem.alt = content.title || content.name;
                contentBackdropElem.style.display = 'block';
                contentBackdropElem.onerror = function() {
                    this.style.display = 'none';
                    console.error('Failed to load backdrop image:', this.src);
                };
            } else {
                contentBackdropElem.style.display = 'none';
            }
        }

        // Set details
        if (contentDetailsElem) {
            let detailsHtml = '';
            if (content.release_date) detailsHtml += `<p><strong>Release Date:</strong> ${content.release_date}</p>`;
            if (content.vote_average) detailsHtml += `<p><strong>Rating:</strong> ${content.vote_average.toFixed(1)} / 10</p>`;
            if (content.genres) {
                const genreNames = Array.isArray(content.genres)
                    ? content.genres.map(g => typeof g === 'object' ? g.name : g).join(', ')
                    : content.genres;
                detailsHtml += `<p><strong>Genres:</strong> ${genreNames}</p>`;
            }
            if (content.runtime) detailsHtml += `<p><strong>Runtime:</strong> ${content.runtime} minutes</p>`;
            contentDetailsElem.innerHTML = detailsHtml;
            contentDetailsElem.style.display = 'block';
        }

        // Set watch buttons
        setupWatchButtons(content);
    }

    function setupWatchButtons(content) {
        if (!watchButtonsContainer) return;
        watchButtonsContainer.innerHTML = '';

        if (content.type === 'movie') {
            if (content.video_url) {
                const watchButton = document.createElement('button');
                watchButton.textContent = 'Watch Movie Now';
                watchButton.classList.add('play-button');
                watchButton.onclick = () => {
                    // Open the video_url directly in a new tab/window
                    window.open(content.video_url, '_blank');
                };
                watchButtonsContainer.appendChild(watchButton);
            } else {
                watchButtonsContainer.innerHTML = '<p>No video available for this movie.</p>';
            }
        } else if (content.type === 'tv' && content.episodes) {
            const episodeListWrapper = document.createElement('div');
            episodeListWrapper.classList.add('season-list');
            episodeListWrapper.innerHTML = '<h3>Episodes</h3>';

            Object.keys(content.episodes)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach(seasonNum => {
                    const seasonDiv = document.createElement('div');
                    seasonDiv.classList.add('season-item');
                    seasonDiv.innerHTML = `<h4>Season ${seasonNum}</h4><ul class="episode-list"></ul>`;
                    const ul = seasonDiv.querySelector('ul');

                    Object.keys(content.episodes[seasonNum])
                        .sort((a, b) => parseInt(a) - parseInt(b))
                        .forEach(episodeNum => {
                            const episodeLink = content.episodes[seasonNum][episodeNum];
                            if (episodeLink) {
                                const li = document.createElement('li');
                                li.innerHTML = `
                                    <span>Episode ${episodeNum}</span>
                                    <button class="play-button" data-src="${episodeLink}">Play</button>
                                `;
                                li.querySelector('button').addEventListener('click', (e) => {
                                    // Open the episodeLink directly in a new tab/window
                                    window.open(e.target.dataset.src, '_blank');
                                });
                                ul.appendChild(li);
                            }
                        });
                    episodeListWrapper.appendChild(seasonDiv);
                });
            watchButtonsContainer.appendChild(episodeListWrapper);
        }
    }

    function showError(message) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (notFoundMessage) {
            notFoundMessage.textContent = message;
            notFoundMessage.style.display = 'block';
        }
    }
});