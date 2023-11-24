// variables
let iOffset = 0;
let iLimit = 10;
let iPageCur = 1;
let iPageNum = 1;
const URL_API = 'https://pokeapi.co/api/v2/pokemon/';
// images
const sDefaultPokemonImg = '404.png';
const sDefaultPokemonAlt = 'Not found';
const sLoadingImg = 'loading.png';
// buttons
const btnPrev = document.getElementById('prev');
const btnNext = document.getElementById('next');
const btnSelect = document.getElementById('select');
// elements
const ePageNum = document.getElementById('pageNum');
const ePageCurrent = document.getElementById('pageCurrent');
const eList = document.getElementById('list');

// functions
const refreshPagination = () => {
    iPageCur = Math.ceil(iOffset / iLimit) + 1;
    ePageNum.textContent = iPageNum;
    ePageCurrent.textContent = iPageCur;

    btnSelect.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= iPageNum; i++) {
        const eItem = document.createElement('option');
        eItem.value = i;
        eItem.textContent = i;
        eItem.selected = i === iPageCur;
        fragment.appendChild(eItem);
    }
    btnSelect.appendChild(fragment);
}

// Event listeners
btnPrev.addEventListener('click', () => {
    if (iOffset >= iLimit) {
        iOffset -= iLimit;
        fetchData().then(data => showList(data));
    }
});

btnNext.addEventListener('click', () => {
    if (iOffset < iPageNum * iLimit - iLimit) {
        iOffset += iLimit;
        fetchData().then(data => showList(data));
    }
});

btnSelect.addEventListener('change', (e) => {
    iOffset = (e.target.value - 1) * iLimit;
    fetchData().then(data => showList(data));
});

// Fetches data from the API with optional offset and limit parameters
// Объект для кеширования данных
const cache = {};

const fetchData = async () => {
    try {
        // Ключ кеша на основе текущих параметров запроса
        const cacheKey = `offset=${iOffset}&limit=${iLimit}`;

        // Проверяем, есть ли данные в кеше
        if (cache[cacheKey]) {
            console.log(cache);
            return cache[cacheKey];
        }

        // Виконуємо запит до API
        const response = await fetch(`${URL_API}?${cacheKey}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        iPageNum = Math.ceil(data.count / iLimit);

        const pokemonArray = Array.isArray(data) ? data : data.results;

        // Получаем необходимые данные и сохраняем их в кеше
        const result = await Promise.all(pokemonArray.map(async ({ name, url }) => {
            const pokemon = await fetchPokemon(url);
            return {
                name,
                src: pokemon.src
            };
        }));

        cache[cacheKey] = result;
        return result;

    }
    catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        throw error;
    }
    finally {
        refreshPagination();
    }
};

const fetchPokemon = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { sprites: { other: { 'official-artwork': { front_default: src } } } } = await response.json();
        return { src };
    } catch (error) {
        return { src: sDefaultPokemonImg }; // Повертаємо дефолтне зображення
    }
};

const showList = (data) => {
    if (!data) return; // Проверка на существование данных

    eList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    data.forEach(item => {
        const eItem = document.createElement('li');
        const eImg = document.createElement('img');

        // Встановлення дефолтних значень
        eImg.src = sLoadingImg;
        eImg.alt = 'Loading...';
        eImg.title = 'Loading...';

        eItem.appendChild(eImg);
        fragment.appendChild(eItem);

        const imageSrc = item.src || sDefaultPokemonImg;
        const imgAltTitle = item.name || sDefaultPokemonAlt;

        eImg.onload = () => {
            eImg.src = imageSrc;
            eImg.alt = imgAltTitle;
            eImg.title = imgAltTitle;
        };

        eImg.onerror = () => {
            eImg.src = sDefaultPokemonImg; // В случае ошибки загрузки изображения
        };

    });
    eList.appendChild(fragment);
}

fetchData().then(data => showList(data));
