/**
 * Модуль для работы с изображениями ДЗЗ
 */
const ImagesModule = (function() {
    let availableImages = [];
    let selectedImage = null;
    let secondSelectedImage = null;
    
    function searchImages(params) {
        console.log('Поиск изображений с параметрами:', params);
        
        return new Promise((resolve, reject) => {
            // Загружаем JSON с информацией о снимках
            fetch('data/img/images.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Не удалось загрузить данные о снимках.');
                    }
                    return response.json();
                })
                .then(data => {
                    // Получаем массив снимков из JSON
                    const realImages = data.images;

                    // Фильтруем снимки по параметрам поиска
                    let filteredImages = realImages;
                    
                    if (params.dateFrom) {
                        const dateFrom = new Date(params.dateFrom);
                        filteredImages = filteredImages.filter(img => new Date(img.date) >= dateFrom);
                    }
                    
                    if (params.dateTo) {
                        const dateTo = new Date(params.dateTo);
                        filteredImages = filteredImages.filter(img => new Date(img.date) <= dateTo);
                    }
                    
                    if (params.cloudCoverage !== undefined) {
                        const maxCloud = parseInt(params.cloudCoverage);
                        filteredImages = filteredImages.filter(img => img.cloudCoverage <= maxCloud);
                    }
                    
                    filteredImages.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    availableImages = filteredImages;
                    resolve(filteredImages);
                })
                .catch(error => {
                    console.error('Ошибка при загрузке снимков:', error);
                    // В случае ошибки возвращаем пустой массив
                    availableImages = [];
                    resolve([]);
                });
        });
    }
    
    function renderImageList(images) {
        const imageListElement = document.getElementById('image-list');
        const noImagesElement = document.getElementById('no-images-message');
        
        imageListElement.innerHTML = '';
        
        if (images.length === 0) {
            noImagesElement.classList.remove('hidden');
            return;
        }
        
        noImagesElement.classList.add('hidden');
        
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ru-RU');
        };
        
        images.forEach(image => {
            const imageElement = document.createElement('div');
            imageElement.className = 'image-item';
            imageElement.dataset.id = image.id;
            
            imageElement.innerHTML = `
                <div class="image-content">
                    <div class="image-name">${image.name}</div>
                    <div class="image-date">${formatDate(image.date)}</div>
                    <div class="image-info">
                        <span>Облачность: ${image.cloudCoverage}%</span>
                        <span>Сенсор: ${image.sensor}</span>
                        <span>Файл: ${image.url.split('/').pop()}</span>
                    </div>
                    <div class="image-actions">
                        <button class="btn-select-image" data-action="select1" title="Выбрать как основное изображение">
                            Основное
                        </button>
                        <button class="btn-select-image" data-action="select2" title="Выбрать как изображение для сравнения">
                            Сравнение
                        </button>
                    </div>
                </div>
            `;
            
            imageListElement.appendChild(imageElement);
            
            const selectBtn1 = imageElement.querySelector('button[data-action="select1"]');
            const selectBtn2 = imageElement.querySelector('button[data-action="select2"]');
            
            selectBtn1.addEventListener('click', () => {
                selectImage(image);
            });
            
            selectBtn2.addEventListener('click', () => {
                selectSecondImage(image);
            });
        });
    }
    
    function selectImage(image) {
        console.log('Выбрано изображение #1:', image);
        
        selectedImage = image;
        
        MapModule.addImageLayer(image);
        
        updateSelectedImageUI();
    }
    
    function selectSecondImage(image) {
        console.log('Выбрано изображение #2:', image);
        
        secondSelectedImage = image;
        
        MapModule.addImageLayer(image, true);
        
        updateSelectedImageUI();
    }
    
    function updateSelectedImageUI() {
        const imageItems = document.querySelectorAll('.image-item');
        imageItems.forEach(item => {
            item.classList.remove('selected');
            item.classList.remove('second-selected');
        });
        
        if (selectedImage) {
            const selectedItem = document.querySelector(`.image-item[data-id="${selectedImage.id}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        }
        
        if (secondSelectedImage) {
            const secondSelectedItem = document.querySelector(`.image-item[data-id="${secondSelectedImage.id}"]`);
            if (secondSelectedItem) {
                secondSelectedItem.classList.add('second-selected');
            }
        }
    }
    
    return {
        searchImages: searchImages,
        renderImageList: renderImageList,
        selectImage: selectImage,
        selectSecondImage: selectSecondImage,
        getSelectedImage: function() { return selectedImage; },
        getSecondSelectedImage: function() { return secondSelectedImage; }
    };
})(); 