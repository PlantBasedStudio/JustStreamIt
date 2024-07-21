document.addEventListener('DOMContentLoaded', async function() {
    await fetchBestMovie();
    await fetchBestRatedMovies();
    await fetchMovieCategory("mystery", 'category1');
    await fetchMovieCategory("animation", 'category2');
    await fetchMovieCategory("comedy", 'category3');
    await fetchCategories();
    await fetchMovieCategory("action", 'category-free');
});

document.addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('btn-details')) {
        const movieTitle = event.target.getAttribute('data-title');
        if (movieTitle) {
            openModal(movieTitle);
        } else {
            console.error('Titre du film manquant');
        }
    }
    if (event.target && event.target.classList.contains('btn-load-more')) {
        loadMoreMovies();
    }
});

const modal = document.getElementById('movie-modal');
const span = document.getElementsByClassName('close')[0];

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}
async function fetchData(url, queryParams = {}) {
    try {
        const queryString = Object.keys(queryParams).length > 0 ? '?' + new URLSearchParams(queryParams).toString() : '';
        const requestUrl = `${url}${queryString}`;

        const response = await fetch(requestUrl);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur:', error);
        return null;
    }
}

async function fetchBestMovie() {
    try {
        const apiUrl = 'http://localhost:8000/api/v1/titles/?sort_by=-imdb_score';
        const bestMovieData = await fetchData(apiUrl);

        if (bestMovieData && bestMovieData.results && bestMovieData.results.length > 0) {
            const bestMovie = bestMovieData.results[0];
            const movieDetailsUrl = `http://localhost:8000/api/v1/titles/${bestMovie.id}`;
            const bestMovieDetails = await fetchData(movieDetailsUrl);

            if (bestMovieDetails) {
                const imageUrl = bestMovieDetails.image_url ? bestMovieDetails.image_url : 'https://placehold.co/227x334';
                const altText = bestMovieDetails.title ? bestMovieDetails.title : 'Titre';

                const highlightSection = document.querySelector('.highlight .movie-highlight');
                highlightSection.innerHTML = `
                    <img src="${imageUrl}" alt="${altText}">
                    <div class="movie-info">
                        <h3>${bestMovieDetails.title}</h3>
                        <p>${bestMovieDetails.description}</p>
                        <button class="btn-details" data-id="${bestMovieDetails.id}">Détails</button>
                    </div>
                `;
            } else {
                console.error('Détails du meilleur film non trouvés');
            }
        } else {
            console.error('Aucun meilleur film trouvé');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du meilleur film:', error);
    }
}

async function fetchBestRatedMovies() {
    try {
        const apiUrl = 'http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&limit=7&offset=1';
        const data = await fetchData(apiUrl);

        if (data && data.results && data.results.length > 0) {
            const movieList = document.querySelector('.best-rated-movies .movie-list');
            movieList.innerHTML = '';

            const moviesToShow = window.innerWidth >= 1024 ? data.results.slice(0, 6) : data.results.slice(0, 2);
            const moviesToLoad = window.innerWidth >= 1024 ? [] : data.results.slice(2);

            moviesToShow.forEach(movie => {
                const imageUrl = movie.image_url ? movie.image_url : 'https://placehold.co/227x334';
                const movieItem = `
                    <div class="movie">
                        <img src="${imageUrl}" alt="${movie.title}">
                        <div class="movie-info-category">
                            <h3>${movie.title}</h3>
                            <button class="btn-details" data-title="${movie.title}">Détails</button>
                        </div>
                    </div>
                `;
                movieList.innerHTML += movieItem;
            });

            window.moviesToLoad = moviesToLoad;

            if (window.innerWidth >= 1024) {
                document.querySelector('.btn-load-more').style.display = 'none';
            }
        } else {
            console.error('Aucun film trouvé');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des films:', error);
    }
}

function loadMoreMovies() {
    const movieList = document.querySelector('.best-rated-movies .movie-list');
    const moviesToLoad = window.moviesToLoad || [];

    if (moviesToLoad.length > 0) {
        const nextMovies = moviesToLoad.splice(0, 2);

        nextMovies.forEach(movie => {
            const imageUrl = movie.image_url ? movie.image_url : 'https://placehold.co/227x334';
            const movieItem = `
                <div class="movie">
                    <img src="${imageUrl}" alt="${movie.title}">
                    <div class="movie-info-category">
                        <h3>${movie.title}</h3> 
                        <button class="btn-details" data-title="${movie.title}">Détails</button>
                    </div>
                </div>
            `;
            movieList.innerHTML += movieItem;
        });

        if (moviesToLoad.length === 0) {
            document.querySelector('.btn-load-more').style.display = 'none';
        }
    }
}

async function fetchMovieCategory(category, sectionClass) {
    try {
        const apiUrl = `http://localhost:8000/api/v1/titles/?genre=${category}&sort_by=-imdb_score&limit=6`;
        const data = await fetchData(apiUrl);

        if (data && data.results && data.results.length > 0) {
            const movieList = document.querySelector(`.${sectionClass} .movie-list`);
            movieList.innerHTML = ""
            data.results.forEach(movie => {
                const imageUrl = movie.image_url ? movie.image_url : 'https://placehold.co/227x334';
                const movieItem = `
                    <div class="movie">
                        <img src="${imageUrl}" alt="${movie.title}">
                        <div class="movie-info-category">
                            <h3>${movie.title}</h3>
                            <button class="btn-details" data-title="${movie.title}">Détails</button>
                        </div>
                    </div>
                `;
                movieList.innerHTML += movieItem;
            });
        } else {
            console.error(`Aucun film trouvé pour la catégorie ${category}`);
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération des films de la catégorie ${category}:`, error);
    }
}

async function fetchAllCategories(apiUrl) {
    const allCategories = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
        while (currentPage <= totalPages) {
            const data = await fetchData(`${apiUrl}?page=${currentPage}`);
            
            if (data && data.results) {
                allCategories.push(...data.results);

                
                if (data.count && currentPage === 1) {
                    totalPages = Math.ceil(data.count / data.results.length);
                }

                currentPage++;
            } else {
                break;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
    }

    return allCategories;
}

async function fetchCategories() {
    try {
        const apiUrl = 'http://localhost:8000/api/v1/genres/';
        const allCategories = await fetchAllCategories(apiUrl);

        if (allCategories.length > 0) {
            const categoryDropdown = document.getElementById('category-dropdown');
            allCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                console.log("Catégorie trouvée", option);
                categoryDropdown.appendChild(option);
            });

            categoryDropdown.addEventListener('change', function() {
                const selectedCategory = categoryDropdown.value;
                fetchMovieCategory(selectedCategory, 'category-free');
            });
        } else {
            console.error('Aucune catégorie trouvée');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
    }
}

async function openModal(movieTitle) {
    try {
        const apiUrl = `http://localhost:8000/api/v1/titles/?title_contains=${movieTitle}`;
        const movieData = await fetchData(apiUrl);

        if (movieData && movieData.results && movieData.results.length > 0) {
            const movie = movieData.results[0]; 
            console.log('Données du film:', movie);
            const modalBody = document.querySelector('.modal-body');
            const imageUrl = movie.image_url ? movie.image_url : 'https://placehold.co/227x334';

            modalBody.innerHTML = `
                <img src="${imageUrl}" alt="${movie.title}">
                <h3>${movie.title}</h3>
                <p>${movie.description}</p>
                <p>Année: ${movie.year}</p>
                <p>Score IMDb: ${movie.imdb_score}</p>
                <p>Réalisateur: ${movie.directors.join(', ')}</p>
                <p>Acteurs: ${movie.actors.join(', ')}</p>
                <p>Genres: ${movie.genres.join(', ')}</p>
                <p>Durée: ${movie.duration} minutes</p>
            `;

            const modal = document.getElementById('movie-modal');
            modal.style.display = "block";
        } else {
            console.error('Film non trouvé');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du film:', error);
    }
}
