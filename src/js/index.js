import '../cass/index.scss';

import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

// === SEARCH BAR ===
// --- ініциалізація констант
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');
const galleryDiv = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');
let lightbox = new SimpleLightbox('.gallery a');

const API_KEY = '35066841-52545c4d4852ad26238ef3ed2'; //особистий ключ регістрації на pixabay.com

// початковий стан змінних і констант
const perPage = 40;
let page = 1;

//--- HTTP-запит через бібліотеку axios.
async function getVideo(searchText) {
  try {
    const response = await axios.get(
      `https://pixabay.com/api/videos?key=${API_KEY}&q=${searchText}&orientation=horizontal&safesearch=true&video_type=film&per_page=${perPage}&page=${page}`
    );
    if (response.status === 404) {
      return [];
    }
    return await response.data;
  } catch (error) {
    return console.error(error);
  }
}

// -- встановлення кнопки запуску нескінченного скролу
document
  .querySelector('.search-bar')
  .insertAdjacentHTML(
    'afterend',
    `<button id='btn-endless-scroll' class="js-off"> Infinite scroll</button>`
  );

// ініціалізація і керування запуском нескінченного скролу
const endlessScroll = document.getElementById('btn-endless-scroll');

let isOnEndlessScroll = false;      // контроль стану кнопки нескінченного скролу

// --- прослуховування натискання кнопки нескінченного скролу
endlessScroll.addEventListener('click', () => {
  if (isOnEndlessScroll) {
    endlessScroll.setAttribute('class', 'js-off');
    isOnEndlessScroll = false;
  } else {
    endlessScroll.setAttribute('class', 'js-on');
    isOnEndlessScroll = true;
  }
});

// --- прослуховування натискання кнопки пошуку на панелі "SEARCH BAR"
searchBtn.addEventListener('click', evt => {
  evt.preventDefault();
  searchCleanup();
  messageOutput();
});

// --- очищення знайдених даних
function searchCleanup() {
  page = 1;
  galleryDiv.innerHTML = '';
  loadMoreBtn.style.display = 'none';
  oldPageYOffset = 0;
}

let oldPageYOffset = 0; // змінна для визначення напрямку прокрутки

// --- прослуховування натискання кнопки завантаження наступної сторінки пагінації
// i виклик функції переходу
loadMoreBtn.addEventListener('click',nextPage);

// --- створення галереї фото
function galleryCreation(photos) {
  galleryDiv.insertAdjacentHTML(
    'beforeend',
    photos.reduce((acc, el) => {
      const htmlCode = `<div class="photo-card">
        <a href="${el.videos.large.url}">
          <video class="photo" src="${el.videos.small.url}" alt="${el.tags}" title="${el.tags}" loading="lazy" /></video>         
          <div class="info">
            <p class="info-item">
              <b>Likes</b> <span> ${el.likes} </span>
            </p>
            <p class="info-item">
              <b>Views</b> <span>${el.views}</span>  
            </p>
            <p class="info-item">
              <b>Comments</b> <span>${el.comments}</span>  
            </p>
            <p class="info-item">
              <b>Downloads</b> <span>${el.downloads}</span> 
            </p>
          </div>
        </a>
      </div>`;
      return acc + htmlCode;
    }, '')
  );
};

let coefficient;  // для визначення напрямку скрола і швидкості (при збільшенні значення швидкість зменшується)

// --- прослуховування кліку миші для визначення напрямку скрола
// якщо у вехній половині екрану по горизонталі - скрол "вгору", якщо в нижній - "вниз"
// клік спрацьовує за межами галереї
window.addEventListener('click', evt => {
  // фільтр для спрацьовування кліка поза галереєю
  if (evt.target.className !== 'gallery' && evt.target.tagName !== 'BODY') {
    return;
  }

  // перевірка наявності eлементів в галереї
  if (galleryDiv.childElementCount < 1) {
    return;
  }

  // задає напрям скрола
  coefficient = evt.pageY < window.pageYOffset + window.innerHeight / 2 ? -50 : 50;

  smoothScroll();
});

let counter = 0;  // лічильник (визначає довжину прокрутки)
function smoothScroll() {
  if (counter++ > 80) {
    oldPageYOffset = window.pageYOffset;
    return counter = 0;
  }
  
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  oldPageYOffset = window.pageYOffset;

  window.scrollBy({
    top: cardHeight / coefficient,
    // behavior: 'smooth',
  });
}

// --- прослуховування скрола
window.addEventListener('scroll', () => {
  // якщо скрол у кінці останньої сторінки, то виводиться сповіщення
  if (document.documentElement.offsetHeight - window.pageYOffset - 1 <document.documentElement.clientHeight && // якщо кінець сторінки
    oldPageYOffset < window.pageYOffset) {    // і напрям скролу "вниз"

    if (loadMoreBtn.style.display === 'none') {
      // скрита кнопка, як індикатор останньої сторінки
      Notiflix.Notify.failure(
        "We're sorry, but you've reached the end of search results."
      );

      oldPageYOffset = window.pageYOffset - 1; // запис нового положення позиції скрола
      return;
    }
    if (endlessScroll.getAttribute('class') === 'js-on') {    // якщо включено нескінченний скрол
      nextPage();   // виклик функції переходу на наступну сторінку пагінації
    }
  } else {
    if (oldPageYOffset === window.pageYOffset) {
      return;
    }    
  
    // перевірка наявності єлементів в галереї
    if (galleryDiv.childElementCount < 1) {
      return;
    }

    coefficient = oldPageYOffset > window.pageYOffset ? -50 : 50; 

    smoothScroll();    
  }
});

// -- функція автоматичного переходу на наступну сторінку при пагінації
function nextPage() {
  if (loadMoreBtn.style.display !== 'none') {       // якщо кнопка присутня (виступає індикатором кінця сторінки)
    page++;
    loadMoreBtn.style.display = 'none';
    messageOutput();    
  }
  oldPageYOffset = window.pageYOffset;  // запис нового положення позиції скрола
}

// -- функція виведення повідомлень
function messageOutput() {
  const inputTxt = searchInput.value.trim();
  if (inputTxt !== '') {
    getVideo(inputTxt)
      .then(photos => {
        if (photos.totalHits > 0) {
          
          galleryCreation(photos.hits);
          
          loadMoreBtn.style.display = Math.ceil(photos.totalHits / perPage) > page ? 'block' : 'none';
          
          Notiflix.Notify.success(`Hooray! We found ${photos.totalHits} images.`);

          lightbox.refresh();

        } else {
          Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');
        }
      })
      .catch(error => {
        console.error(error);
      });
  }  
}
