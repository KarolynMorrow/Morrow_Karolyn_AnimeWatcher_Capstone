const API_BASE_URL = 'https://kitsu.io/api/edge';
//console.log("index.js loaded (top of file confirmation)");

document.addEventListener('DOMContentLoaded', () => {
    //console.log("DOMContentLoaded event listener activated. Starting DOM element checks.");

    const spotlightImg = document.getElementById('spotlight-img');
    //console.log("Spotlight Image Element:", spotlightImg);
    const spotlightTitle = document.getElementById('spotlight-anime-title'); // Corrected ID
    //console.log("Spotlight Title Element:", spotlightTitle);
    const spotlightDescription = document.getElementById('spotlight-synopsis');
    //console.log("Spotlight Description Element:", spotlightDescription);
    const spotLightRevealBtn = document.getElementById('spotlightRevealBtn');
    //console.log("Spotlight Reveal Button Element:", spotLightRevealBtn);
    const mostWatchedList = document.getElementById('most-watched-list');
    //console.log("Most Watched List Element:", mostWatchedList);

    let fullSpotlightSynopsis = '';
    const specificAnimeTitles = [
        "Solo Leveling",
        "One Piece",
        "Demon Slayer: Kimetsu no Yaiba",
        "Hunter x Hunter",
        "Dragon Ball Z"
    ];
    //console.log("Specific Anime Titles (declared):", specificAnimeTitles); // Log here


    async function fetchIndexPageAnime() {
        const fetchedSpecificAnime = [];

        try {
            //console.log("fetchIndexPageAnime: Attempting to fetch specific anime data..."); // This log goes here

            for (const title of specificAnimeTitles) {
                const url = `${API_BASE_URL}/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`;

                //console.log(`Index Page: Requesting URL for "${title}":`, url);

                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/vnd.api+json',
                        'Accept': 'application/vnd.api+json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Index Page Error Response for "${title}": ${response.status} - ${errorText}`);
                    continue;
                }

                const data = await response.json();
                console.log(`Index Page: Received Data for "${title}":`, data);

                if (data.data && data.data.length > 0) {
                    fetchedSpecificAnime.push(data.data[0]);
                } else {
                    console.warn(`No anime data found for specific title: "${title}" in the response.`);
                }
            } // End of for loop

            if (fetchedSpecificAnime.length > 0) {
                populateIndexPageSections(fetchedSpecificAnime);
            } else {
                displayIndexError('No specific anime data could be retrieved.');
            }

        } catch (error) {
            console.error('Error fetching index page anime:', error);
            displayIndexError(`Error loading specific anime for home page: ${error.message}`);
        }
    }


    function populateIndexPageSections(animeData) {
        console.log("Starting to populate index page sections..."); // This log goes here
        if (!animeData || animeData.length === 0) {
            displayIndexError('No anime data available.');
            return;
        }

        const spotlightAnime = animeData[0];
        if (spotlightAnime) {
            const attributes = spotlightAnime.attributes;
            const canonicalTitle = attributes.canonicalTitle || attributes.titles.en || 'Featured Anime';
            const posterImage = attributes.posterImage ? attributes.posterImage.large : 'https://via.placeholder.com/300x450?text=No+Image+Available';
            const synopsis = attributes.synopsis || 'No synopsis available.';

            spotlightImg.src = posterImage;
            spotlightImg.alt = `${canonicalTitle} poster`;
            spotlightTitle.textContent = canonicalTitle;

            const truncatedSynopsis = synopsis.substring(0, 200);
            spotlightDescription.innerHTML = `${truncatedSynopsis}...<span class="hidden-text"></span>`;
            fullSpotlightSynopsis = synopsis;

            spotLightRevealBtn.style.display = 'block';
            spotLightRevealBtn.textContent = 'Reveal More >>';
            spotLightRevealBtn.classList.remove('active');
        } else {
            console.error('No spotlight anime data found.');
            spotlightTitle.textContent = 'No Featured Anime';
            spotlightDescription.textContent = 'No synopsis available.';
            const fallbackSpotlightImg = 'https://via.placeholder.com/300x450?text=No+Image+Available';
            spotlightImg.src = fallbackSpotlightImg;
            spotLightRevealBtn.style.display = 'none';
        }

        mostWatchedList.innerHTML = '';

        const mostWatchedAnime = animeData.slice(1);

        if (mostWatchedAnime.length > 0) {
            mostWatchedAnime.forEach(anime => {
                const attributes = anime.attributes;
                const canonicalTitle = attributes.canonicalTitle || attributes.titles.en || 'Untitled';
                const posterImage = attributes.posterImage ? attributes.posterImage.tiny : 'https://via.placeholder.com/100x150?text=Anime';
                const synopsis = attributes.synopsis || 'No synopsis available.';

                const mostWatchedItem = document.createElement('div');
                mostWatchedItem.classList.add('col', 'mb-4');
                mostWatchedItem.innerHTML = `
                    <div class="most-watched-item">
                        <img class="img-fluid mr-3" src="${posterImage}" alt="${canonicalTitle} poster">
                        <div class="most-watched-description">
                            <h3>${canonicalTitle}</h3>
                            <p>${synopsis.substring(0, 100)}...</p>
                        </div>
                    </div>
                `;
                mostWatchedList.appendChild(mostWatchedItem);
            });
        } else {
            mostWatchedList.innerHTML = '<p class="text-muted col-12">No "Most Watched" anime available.</p>';
        }
    }


    function displayIndexError(message) {
        console.error('Index Page Error:', message);
        const indexErrorMessageElement = document.getElementById('index-error-message');
        if (indexErrorMessageElement) {
            indexErrorMessageElement.textContent = message;
            indexErrorMessageElement.style.display = 'block';
        }
    }


    spotLightRevealBtn.addEventListener('click', () => {
        if (spotLightRevealBtn.classList.contains('active')) {
            spotlightDescription.innerHTML = `${fullSpotlightSynopsis.substring(0, 200)}...<span class="hidden-text"></span>`;
            spotLightRevealBtn.textContent = 'Reveal More >>';
        } else {
            spotlightDescription.innerHTML = fullSpotlightSynopsis;
            spotLightRevealBtn.textContent = 'Show Less <<';
        }
        spotLightRevealBtn.classList.toggle('active');
    });

    console.log("Calling fetchIndexPageAnime() for initial page load...");
    fetchIndexPageAnime();
    console.log("fetchIndexPageAnime() initial call completed.");

}); 