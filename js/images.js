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
                    </div>
                    <div class="image-actions">
                        <button class="btn-select-image" data-action="select1" title="Выбрать как основное изображение">
                            Основное
                        </button>
                        <button class="btn-select-image" data-action="select2" title="Выбрать как изображение для сравнения">
                            Сравнение
                        </button>
                    </div>
                    <div class="remove-btn-container" style="display: none; margin-top: 5px;">
                        <button class="btn-select-image btn-remove-second" data-action="remove2" title="Убрать из сравнения" style="background-color: var(--danger-color); width: 100%;">
                            Удалить из сравнения
                        </button>
                    </div>
                </div>
            `;
            
            imageListElement.appendChild(imageElement);
            
            const selectBtn1 = imageElement.querySelector('button[data-action="select1"]');
            const selectBtn2 = imageElement.querySelector('button[data-action="select2"]');
            const removeBtn = imageElement.querySelector('button[data-action="remove2"]');
            
            selectBtn1.addEventListener('click', () => {
                selectImage(image);
            });
            
            selectBtn2.addEventListener('click', () => {
                selectSecondImage(image);
            });
            
            removeBtn.addEventListener('click', () => {
                removeSecondImage();
            });
        });
        
        // Обновляем видимость кнопок удаления
        updateSelectedImageUI();
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
            
            // Скрываем кнопку удаления на всех элементах
            const removeBtnContainer = item.querySelector('.remove-btn-container');
            if (removeBtnContainer) {
                removeBtnContainer.style.display = 'none';
            }
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
                
                // Показываем кнопку удаления только для второго выбранного изображения
                const removeBtnContainer = secondSelectedItem.querySelector('.remove-btn-container');
                if (removeBtnContainer) {
                    removeBtnContainer.style.display = 'block';
                }
            }
        }
    }
    
    /**
     * Удаляет второе изображение из сравнения
     */
    function removeSecondImage() {
        console.log('Удаление второго изображения из сравнения');
        
        if (!secondSelectedImage) {
            console.log('Второе изображение не выбрано, нечего удалять');
            return;
        }
        
        // Сохраняем ссылку на текущий режим отображения перед удалением
        const currentDisplayMode = MapModule.getCurrentMode();
        
        // Получаем слой второго изображения и удаляем его с карты
        const map = MapModule.getMap();
        const secondLayer = MapModule.getSecondImageLayer();
        
        if (secondLayer) {
            console.log('[DEBUG] Удаляем слой второго изображения с карты');
            map.removeLayer(secondLayer);
        }
        
        // Сбрасываем ссылку на второе изображение
        secondSelectedImage = null;
        
        // Явно сообщаем модулю карты, что второй слой удален
        MapModule.resetSecondImageLayer();
        
        // Переключаемся в режим одиночного изображения
        if (currentDisplayMode !== 'single') {
            const displayModeSelect = document.getElementById('display-mode');
            if (displayModeSelect) {
                displayModeSelect.value = 'single';
            }
            MapModule.setMode('single');
        }
        
        // Обновляем UI
        updateSelectedImageUI();
        
        return true;
    }
    
    /**
     * Удаляет все выбранные изображения с карты
     */
    function removeAllImages() {
        console.log('Удаление всех изображений с карты');
        
        // Получаем карту
        const map = MapModule.getMap();
        
        // Удаляем второе изображение, если оно выбрано
        if (secondSelectedImage) {
            // Получаем второй слой и удаляем его с карты
            const secondLayer = MapModule.getSecondImageLayer();
            if (secondLayer) {
                map.removeLayer(secondLayer);
            }
            // Сбрасываем ссылку на второе изображение
            secondSelectedImage = null;
            // Сообщаем модулю карты, что второй слой удален
            MapModule.resetSecondImageLayer();
        }
        
        // Удаляем основное изображение, если оно выбрано
        if (selectedImage) {
            // Так как у нас нет прямого метода для получения основного слоя,
            // мы просто сбрасываем ссылку на изображение в нашем модуле
            selectedImage = null;
        }
        
        // Переключаемся в режим одиночного изображения
        const displayModeSelect = document.getElementById('display-mode');
        if (displayModeSelect) {
            displayModeSelect.value = 'single';
        }
        MapModule.setMode('single');
        
        // Обновляем UI
        updateSelectedImageUI();
        
        return true;
    }
    
    return {
        searchImages: searchImages,
        renderImageList: renderImageList,
        selectImage: selectImage,
        selectSecondImage: selectSecondImage,
        removeSecondImage: removeSecondImage,
        removeAllImages: removeAllImages,
        getSelectedImage: function() { return selectedImage; },
        getSecondSelectedImage: function() { return secondSelectedImage; },
        updateSelectedImageUI: updateSelectedImageUI
    };
})(); 