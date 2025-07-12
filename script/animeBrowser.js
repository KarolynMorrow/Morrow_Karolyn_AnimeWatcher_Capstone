const API_BASE_URL = 'https://kitsu.io/api/edge';

    document.addEventListener('DOMContentLoaded', () => {
        const animeListContainer = document.getElementById('anime-list');
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const modalBodyContent = document.getElementById('modal-body-content');
        const modalLoadingSpinner = document.getElementById('modal-loading-spinner');
        //Get all genre links
        const genreLinks = document.querySelectorAll('.genre-link');

// Fetches anime from Kitsu API
        async function fetchAnime(query = '', genre = '') {
        try {
        let url = `${API_BASE_URL}/anime?page[limit]=15&page[offset]=0&sort=-userCount`;

        if (query) {
            url = `${API_BASE_URL}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=15&page[offset]=0`;
        } else if (genre) {
            url = `${API_BASE_URL}/anime?filter[categories]=${encodeURIComponent(genre)}&page[limit]=15&page[offset]=0&sort=-userCount`;
        }

        console.log('fetchAnime: Requesting URL:', url);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error response:', errorText);
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetched anime data:', data);

        if (data.data && data.data.length > 0) {
            displayAnime(data.data);
        } else {
            console.log('fetchAnime: No anime data found in response.');
            animeListContainer.innerHTML = '<p class="text-muted">No anime found for your search.</p>';
        }

        //displayAnime(data.data);
        } catch (error) {
        console.error('Could not fetch anime:', error);
        animeListContainer.innerHTML = `<p class="error">Error loading anime: Please try again later.</p>`;
        }
        }


        // Fetches anime data by ID
        async function fetchAnimeDetails(animeId) {
        modalBodyContent.innerHTML = '';
        modalLoadingSpinner.style.display = 'block'; //show loading spinner

        try {
        //Request to include additional details like producers, and streaming links
        const url = `${API_BASE_URL}/anime/${animeId}?include=animeProductions,animeProductions.producer,streamingLinks.streamer`;

        console.log('fetchAnimeDetails: Requesting URL:', url);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        console.log(`FetchAnimeDetails response status: ${animeId}:`, response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error response:', errorText);
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`fetchAnimeDetails: Recieved data for ID ${animeId}:`, data);

        modalLoadingSpinner.style.display = 'none';

        if (data.data) {
            displayAnimeDetailsInModal(data.data, data.included || []);
        } else {
            console.error(`fetchAnimeDetails: No data found for ID ${animeId}.`);
            modalBodyContent.innerHTML = `<p class="error">No details found for this anime.</p>`;
        }

        } catch (error) {
        console.error('Could not fetch anime details:', error);
        modalBodyContent.innerHTML = `<p class="error">Error loading anime details: Please try again later.</p>`;
        } finally {
        modalLoadingSpinner.style.display = 'none'; //hide loading spinner
        }
        }

        //Displays anime data in Bootstrap cards
        function displayAnime(animeData) {
        animeListContainer.innerHTML = '';

        if (animeData.length === 0) {
        animeListContainer.innerHTML = '<p class="text-muted">No anime found.</p>';
        return;
        }

        animeData.forEach(anime => {
        const attributes = anime.attributes;
        const canonicalTitle = attributes.canonicalTitle || attributes.titles.en || 'No Title Available';
        const posterImage = attributes.posterImage ? attributes.posterImage.small : 'https://via.placeholder.com/200x250?text=No+Image+Available';
        const synopsis = attributes.synopsis ? attributes.synopsis.substring(0, 150) + '...' : 'No synopsis available';

        const animeCard = document.createElement('div');
        animeCard.classList.add('col');
        animeCard.innerHTML = `
            <div class="card h-100">
                <img src=${posterImage} class="card-img-top" alt="${canonicalTitle} poster">
                <div class="card-body">
                    <h5 class="card-title">${canonicalTitle}</h5>
                    <p class="card-text">${synopsis}</p>
                    <div class="mt-3">
                        <button type="button" class="btn btn-info btn-sm view-details-button" data-toggle="modal" data-target="#animeDetailModal" data-anime-id="${anime.id}">
                            View More Information
                        </button>
                    </div>
                </div>
            </div>
        `;
        animeListContainer.appendChild(animeCard);
        });

        // Add event listeners to the "View More Information" buttons
        document.querySelectorAll('.view-details-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const animeId = event.target.dataset.animeId;
            fetchAnimeDetails(animeId);
        });
        });

        }

        // Displays anime details in the modal
        function displayAnimeDetailsInModal(anime, included) {
        modalBodyContent.innerHTML = ''; // Clear previous content

        const attributes = anime.attributes;
        const canonicalTitle = attributes.canonicalTitle || attributes.titles.en || 'No Title Available';
        const posterImage = attributes.posterImage ? attributes.posterImage.original : 'https://via.placeholder.com/400x500?text=No+Image+Available';
        const synopsis = attributes.synopsis || 'No synopsis available';
        const startDate = attributes.startDate ? new Date(attributes.startDate).toLocaleDateString() : 'Unknown';
        const endDate = attributes.endDate ? new Date(attributes.endDate).toLocaleDateString() : 'Ongoing';
        const episodeCount = attributes.episodeCount || 'Unknown';
        const averageRating = attributes.averageRating ? `${attributes.averageRating}%` : 'No rating available';

        // Find producers, studios, and streaming links from included data
        const producers = [];
        //const studios = [];
        const streamingLinks = [];

        included.forEach(item => {
        if (item.type === 'animeProductions') {
            //Check for producer relationship
            if (item.relationships.producer && item.relationships.producer.data) {
                const producerId = item.relationships.producer.data.id;
                //find the producer in the included array
                const producer = included.find(i => i.id === producerId && i.type === 'producers');
                if (producer && producer.attributes && producer.attributes.name) {
                    producers.push(producer.attributes.name);
                }
            }
        } else if (item.type === 'streamingLinks') {
        if (item.relationships.streamer && item.relationships.streamer.data) {
            const streamerId = item.relationships.streamer.data.id;
            const streamer = included.find(i => i.id === streamerId && i.type === 'streamers');
            if (streamer && streamer.attributes && streamer.attributes.siteName && item.attributes.url) {
                streamingLinks.push({
                    name: streamer.attributes.siteName, 
                    url: item.attributes.url
                });
                }
            }
        }
        });
        console.log('displayAnimeDetailsInModal: Found producers:', producers);
        console.log('displayAnimeDetailsInModal: Found streaming links:', streamingLinks);

        const producerList = producers.length > 0 ? producers.join(', ') : 'No producers available';
        const studioList = 'NA'; // Studios are not included in the current API response

        let streamingLinksHTML = '<p>No streaming links available.</p>';
        if (streamingLinks.length > 0) {
        streamingLinksHTML = '<ul class="list-unstyles">';
        streamingLinks.forEach(link => {
            streamingLinksHTML += `<li><a href="${link.url}" target="_blank">${link.name}</a></li>`;
        });
        streamingLinksHTML += '</ul>';
        }

        // Set the modal content
        modalBodyContent.innerHTML = `
        <img src="${posterImage}" class="img-fluid rounded mb-3" alt="${canonicalTitle} poster">
        <h3 class="modal-title text-center mb-3">${canonicalTitle}</h3>
        <p><strong>Synopsis:</strong> ${synopsis}</p>
        <p><strong>Start Date:</strong> ${startDate} - ${endDate}</p>
        <p><strong>Episode Count:</strong> ${episodeCount}</p>
        <p><strong>Average Rating:</strong> ${averageRating}</p>
        <p><strong>Producers:</strong> ${producerList}</p>
        <p><strong>Studios:</strong> ${studioList}</p>
        <p><strong>Where to watch:</strong> ${streamingLinksHTML}</p>    
        `;
        }

        // Event listener for the search button
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            fetchAnime(searchTerm);
        });

        // Event listener for genre links
        genreLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const genreSlug = event.target.dataset.genreSlug;
                console.log(`Genre link clicked: ${genreSlug}`);
                searchInput.value = ''; // Clear search input when a genre is selected
                fetchAnime('', genreSlug);
            });
        });


        //Initial fetch to load anime on page load
        fetchAnime();
        });