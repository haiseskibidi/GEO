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
            setTimeout(() => {
                const testImages = [
                    {
                        id: 'img_2023_09_15',
                        name: 'Снимок от 15.09.2023',
                        date: '2023-09-15',
                        url: 'data/img/sample_image_1.jpg',
                        cloudCoverage: 5,
                        extent: [131.5, 42.8, 132.5, 43.8],
                        sensor: 'Landsat 8'
                    },
                    {
                        id: 'img_2023_08_20',
                        name: 'Снимок от 20.08.2023',
                        date: '2023-08-20',
                        url: 'data/img/sample_image_2.jpg',
                        cloudCoverage: 22,
                        extent: [131.9, 43.6, 132.6, 44.3],
                        sensor: 'Landsat 8'
                    },
                    {
                        id: 'img_2023_07_12',
                        name: 'Снимок от 12.07.2023',
                        date: '2023-07-12',
                        url: 'data/img/sample_image_3.jpg',
                        cloudCoverage: 45,
                        extent: [132.7, 42.6, 133.2, 43.0],
                        sensor: 'Landsat 8'
                    },
                    {
                        id: 'img_2023_06_30',
                        name: 'Снимок от 30.06.2023',
                        date: '2023-06-30',
                        url: 'data/img/sample_image_4.jpg',
                        cloudCoverage: 0,
                        extent: [132.0, 43.2, 132.5, 43.7],
                        sensor: 'Landsat 8'
                    },
                    {
                        id: 'img_2023_05_15',
                        name: 'Снимок от 15.05.2023',
                        date: '2023-05-15',
                        url: 'data/img/sample_image_5.jpg',
                        cloudCoverage: 78,
                        extent: [132.3, 43.0, 132.8, 43.5],
                        sensor: 'Landsat 8'
                    },
                    {
                        id: 'img_2024_01_20',
                        name: 'Снимок от 20.01.2024',
                        date: '2024-01-20',
                        url: 'data/img/sample_image_6.jpg',
                        cloudCoverage: 15,
                        extent: [135.0, 44.3, 135.5, 44.8],
                        sensor: 'Landsat 9'
                    },
                    {
                        id: 'img_2024_02_15',
                        name: 'Снимок от 15.02.2024',
                        date: '2024-02-15',
                        url: 'data/img/sample_image_7.jpg',
                        cloudCoverage: 85,
                        extent: [135.2, 43.7, 135.7, 44.2],
                        sensor: 'Landsat 9'
                    },
                    {
                        id: 'img_2024_03_05',
                        name: 'Снимок от 05.03.2024',
                        date: '2024-03-05',
                        url: 'data/img/sample_image_8.jpg',
                        cloudCoverage: 30,
                        extent: [132.9, 43.0, 133.4, 43.5],
                        sensor: 'Landsat 9'
                    }
                ];
                
                let filteredImages = testImages;
                
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
            }, 500);
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
                <div class="image-thumbnail">
                    <img src="${image.url}" alt="${image.name}">
                </div>
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