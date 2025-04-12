/**
 * Модуль для управления картой и слоями
 */
console.log('[DEBUG] Начало инициализации MapModule');

// Проверяем зависимости перед инициализацией
if (typeof ol === 'undefined') {
    console.error('[ERROR] Библиотека OpenLayers (ol) не загружена перед MapModule');
}

console.log('[DEBUG] Зависимости от config:', typeof config !== 'undefined' ? 'Доступен' : 'Недоступен');

const MapModule = (function() {
    console.log('[DEBUG] Выполнение IIFE MapModule');
    
    // Приватные переменные модуля
    let map;
    let view;
    let currentImageLayer = null;
    let secondImageLayer = null;
    
    // Слой для отображения границы региона
    let boundaryLayer = null;
    
    // Текущий режим отображения (single, swipe)
    let currentMode = 'single';
    
    /**
     * Инициализация карты OpenLayers
     */
    function init() {
        console.log('[DEBUG] Вызов MapModule.init()');
        
        try {
            // Создаем основное представление карты
            view = new ol.View({
                center: ol.proj.fromLonLat(config.map.center),
                zoom: config.map.zoom,
                minZoom: config.map.minZoom,
                maxZoom: config.map.maxZoom,
                extent: config.map.extent ? ol.proj.transformExtent(config.map.extent, 'EPSG:4326', 'EPSG:3857') : undefined
            });
            
            // Создаем базовые слои
            const layers = createBaseLayers();
            
            // Создаем карту с базовыми элементами управления
            map = new ol.Map({
                target: 'map',
                layers: layers,
                view: view,
                controls: [
                    // Удаляем стандартный элемент управления масштабированием
                    new ol.control.ScaleLine(),
                    new ol.control.Attribution(),
                    new ol.control.Rotate()
                ]
            });
            
            // Добавляем границу региона, если указаны границы
            if (config.map.extent) {
                addBoundaryLayer();
            }
            
            // Настраиваем отображение координат
            setupMousePositionControl();
            
            // Настраиваем отображение масштаба
            setupScaleInfo();
            
            console.log('[DEBUG] MapModule.init() завершен успешно');
            
            return map;
        } catch (error) {
            console.error('[ERROR] Ошибка в MapModule.init():', error);
            throw error;
        }
    }
    
    /**
     * Создание базовых слоев карты
     */
    function createBaseLayers() {
        return config.baseLayers.map(layerConfig => {
            let source;
            
            // Создаем источник данных в зависимости от типа
            switch (layerConfig.source) {
                case 'osm':
                    source = new ol.source.OSM();
                    break;
                case 'satellite':
                    source = new ol.source.XYZ({
                        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    });
                    break;
                default:
                    source = new ol.source.OSM();
            }
            
            // Создаем слой
            return new ol.layer.Tile({
                source: source,
                visible: layerConfig.visible,
                properties: {
                    id: layerConfig.id,
                    name: layerConfig.name,
                    type: 'base'
                }
            });
        });
    }
    
    /**
     * Добавление слоя с границей региона
     */
    function addBoundaryLayer() {
        const extent = config.map.extent;
        
        // Создаем геометрию полигона из координат границ
        const boundaryFeature = new ol.Feature({
            geometry: new ol.geom.Polygon([[
                ol.proj.fromLonLat([extent[0], extent[1]]),
                ol.proj.fromLonLat([extent[0], extent[3]]),
                ol.proj.fromLonLat([extent[2], extent[3]]),
                ol.proj.fromLonLat([extent[2], extent[1]]),
                ol.proj.fromLonLat([extent[0], extent[1]])
            ]])
        });
        
        // Создаем векторный слой
        boundaryLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [boundaryFeature]
            }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.05)'
                })
            })
        });
        
        map.addLayer(boundaryLayer);
    }
    
    /**
     * Настройка отображения текущих координат курсора
     */
    function setupMousePositionControl() {
        const mousePositionElement = document.getElementById('mouse-position');
        
        // Обработчик движения мыши по карте
        map.on('pointermove', function(event) {
            if (event.dragging) return;
            
            const coordinates = ol.proj.toLonLat(event.coordinate);
            const lon = coordinates[0].toFixed(4);
            const lat = coordinates[1].toFixed(4);
            
            mousePositionElement.innerHTML = `Координаты: ${lon}°, ${lat}°`;
        });
    }
    
    /**
     * Настройка отображения текущего масштаба
     */
    function setupScaleInfo() {
        const scaleInfoElement = document.getElementById('scale-info');
        
        // Обновление масштаба при изменении вида карты
        view.on('change:resolution', function() {
            const resolution = view.getResolution();
            const scale = Math.round(resolution * 3779.5275593333);
            scaleInfoElement.innerHTML = `Масштаб: 1:${scale}`;
        });
    }
    
    /**
     * Добавляет слой с изображением на карту
     * @param {Object} imageData - данные изображения
     * @param {boolean} isSecondImage - флаг, указывающий, что это второе изображение для сравнения
     */
    function addImageLayer(imageData, isSecondImage = false) {
        console.log('[DEBUG] Вызов MapModule.addImageLayer:', imageData ? imageData.id : 'неопределено', 'isSecondImage:', isSecondImage);
        
        if (!imageData) {
            console.error('[ERROR] Вызов addImageLayer с пустыми данными изображения');
            return;
        }
        
        try {
            // Показываем индикатор загрузки
            showLoading(true);
            
            // Для тестовых целей - проверяем наличие изображения
            let imageUrl = imageData.url;
            
            if (!imageUrl) {
                console.error('[ERROR] URL изображения отсутствует в данных:', imageData);
                showLoading(false);
                return;
            }
            
            // Создаем функцию загрузки изображения с обработкой ошибок
            const loadImage = () => {
                try {
                    // Создаем источник изображения
                    const source = new ol.source.ImageStatic({
                        url: imageUrl,
                        imageExtent: ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857'),
                        projection: 'EPSG:3857',
                        crossOrigin: 'anonymous' // Разрешаем кросс-доменные запросы
                    });
                    
                    // Обработчик ошибок при загрузке
                    source.on('imageloaderror', function() {
                        console.error(`Ошибка загрузки изображения: ${imageUrl}`);
                        showLoading(false);
                        alert('Не удалось загрузить изображение. Пожалуйста, убедитесь, что вы запустили скрипт для создания тестовых изображений.');
                    });
                    
                    // Обработчик успешной загрузки
                    source.on('imageloadend', function() {
                        showLoading(false);
                    });
                    
                    // Создаем слой изображения
                    const layer = new ol.layer.Image({
                        title: imageData.title || 'Спутниковое изображение',
                        source: source,
                        opacity: 0.9, // Немного прозрачности для лучшей видимости на фоне карты
                        visible: true,
                        zIndex: 10 // Выше базовых слоев
                    });
                    
                    // Удаляем предыдущий слой, если он существует
                    if (isSecondImage) {
                        if (secondImageLayer) {
                            map.removeLayer(secondImageLayer);
                        }
                        secondImageLayer = layer;
                    } else {
                        if (currentImageLayer) {
                            map.removeLayer(currentImageLayer);
                        }
                        currentImageLayer = layer;
                    }
                    
                    // Добавляем слой на карту
                    map.addLayer(layer);
                    
                    // Если оба слоя существуют, приближаем карту к экстенту изображения
                    if (currentImageLayer && !secondImageLayer) {
                        // Если только один слой, просто приблизим к его экстенту
                        map.getView().fit(ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857'), {
                            padding: [50, 50, 50, 50],
                            duration: 1000
                        });
                    } else if (currentImageLayer && secondImageLayer) {
                        // Если есть оба слоя и включен режим сравнения, настроим swipe
                        if (document.getElementById('display-mode').value === 'swipe') {
                            setupSwipeMode();
                        }
                    }
                    
                    // Обновляем информацию о текущем изображении
                    updateImageInfo(imageData, isSecondImage);
                    
                } catch (error) {
                    console.error('[ERROR] Ошибка при добавлении слоя:', error);
                    showLoading(false);
                    alert('Произошла ошибка при добавлении слоя с изображением');
                }
            };
            
            // Проверяем существование изображения
            if (!imageExists(imageUrl)) {
                console.warn(`Изображение ${imageUrl} не найдено, возможно вам нужно запустить скрипт генерации тестовых изображений`);
                
                // Пробуем найти другие изображения в той же директории
                const fileName = imageUrl.split('/').pop();
                const baseUrl = imageUrl.substring(0, imageUrl.lastIndexOf('/') + 1);
                
                // Проверяем наличие файла с другим расширением
                for (const ext of config.validExtensions) {
                    const newUrl = baseUrl + fileName.replace(/\.[^/.]+$/, ext);
                    if (imageExists(newUrl)) {
                        imageUrl = newUrl;
                        console.log(`Найден альтернативный файл: ${imageUrl}`);
                        break;
                    }
                }
            }
            
            // Загружаем изображение
            loadImage();
        } catch (error) {
            console.error('[ERROR] Критическая ошибка в addImageLayer:', error);
            showLoading(false);
        }
    }
    
    /**
     * Проверяет существование изображения по URL
     * @param {string} url - URL изображения
     * @returns {boolean} - существует или нет
     */
    function imageExists(url) {
        // Проверяем, является ли URL допустимым изображением по расширению
        const validExtension = config.validExtensions.some(ext => url.toLowerCase().endsWith(ext));
        if (!validExtension) {
            console.warn(`URL не имеет допустимого расширения изображения: ${url}`);
            return false;
        }
        
        return true; // Для демо предполагаем, что файл существует
    }
    
    /**
     * Настраивает режим сравнения с ползунком
     */
    function setupSwipeMode() {
        if (!currentImageLayer || !secondImageLayer) {
            console.warn('Не могу настроить режим сравнения: отсутствуют слои');
            return;
        }
        
        // Устанавливаем видимость обоих слоев
        currentImageLayer.setVisible(true);
        secondImageLayer.setVisible(true);
        
        // Скрываем стандартный горизонтальный слайдер и показываем вертикальную шторку
        document.getElementById('swipe-container').style.display = 'none';
        const verticalSwipe = document.getElementById('vertical-swipe');
        verticalSwipe.classList.remove('hidden');
        
        // Получаем размеры контейнера карты
        const mapContainer = map.getTargetElement();
        const mapWidth = mapContainer.offsetWidth;
        const mapHeight = mapContainer.offsetHeight;
        
        // Настраиваем начальное положение шторки (по центру)
        const initialPosition = 50; // процентов
        const swipeLine = document.querySelector('.swipe-line');
        const swipeHandle = document.getElementById('swipe-handle');
        
        // Устанавливаем начальное положение линии и ручки
        swipeLine.style.left = initialPosition + '%';
        swipeHandle.style.left = initialPosition + '%';
        
        // Добавляем обработчик перетаскивания
        let isDragging = false;
        
        swipeHandle.addEventListener('mousedown', function(e) {
            isDragging = true;
            e.preventDefault(); // Предотвращаем выделение текста
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            // Получаем координаты относительно карты
            const rect = mapContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = Math.min(100, Math.max(0, (x / mapWidth) * 100));
            
            // Обновляем положение линии и ручки
            swipeLine.style.left = percent + '%';
            swipeHandle.style.left = percent + '%';
            
            // Обновляем пре-рендер для эффекта обрезки
            updateSwipePrerender(percent);
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        // Устанавливаем начальный пре-рендер
        updateSwipePrerender(initialPosition);
    }
    
    /**
     * Обновляет пре-рендер для эффекта вертикальной шторки
     * @param {number} percent - положение шторки в процентах от ширины карты
     */
    function updateSwipePrerender(percent) {
        if (!currentImageLayer || !secondImageLayer) return;
        
        // Получаем контейнер карты
        const mapContainer = map.getTargetElement();
        const mapWidth = mapContainer.offsetWidth;
        const clipWidth = mapWidth * (percent / 100);
        
        // Получаем канвасы обоих слоев
        const firstCanvas = mapContainer.querySelector('.ol-layer:nth-child(1) canvas');
        const secondCanvas = mapContainer.querySelector('.ol-layer:nth-child(2) canvas');
        
        // Применяем обрезку с помощью clip-path
        if (firstCanvas) {
            firstCanvas.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
        }
        
        if (secondCanvas) {
            secondCanvas.style.clipPath = `inset(0 0 0 ${percent}%)`;
        }
    }
    
    /**
     * Установка режима отображения
     * @param {string} mode - режим отображения ('single', 'swipe', 'opacity')
     */
    function setMode(mode) {
        console.log('Переключение режима отображения на:', mode);
        currentMode = mode;
        
        // Проверяем, есть ли два слоя для режимов сравнения
        if ((mode === 'swipe' || mode === 'opacity') && (!currentImageLayer || !secondImageLayer)) {
            console.warn('Для режима сравнения необходимо выбрать два изображения');
            alert('Для режима сравнения необходимо выбрать два изображения (изображение #1 и изображение #2)');
            
            // Возвращаемся к режиму одиночного изображения
            document.getElementById('display-mode').value = 'single';
            currentMode = 'single';
            return;
        }
        
        // Сначала сбросим состояние всех элементов
        document.getElementById('swipe-container').style.display = 'none';
        document.getElementById('vertical-swipe').classList.add('hidden');
        
        // Сбрасываем clip-path и другие стили на слоях изображений
        resetLayerStyles();
        
        if (mode === 'swipe') {
            // Настраиваем вертикальную шторку для режима swipe
            if (currentImageLayer && secondImageLayer) {
                setupSwipeMode();
            }
        } else {
            // Для режима одиночного изображения или прозрачности
            if (currentImageLayer) currentImageLayer.setVisible(true);
            
            // Для режима прозрачности
            if (mode === 'opacity' && secondImageLayer) {
                secondImageLayer.setVisible(true);
                secondImageLayer.setOpacity(0.5);
            } else if (secondImageLayer) {
                // В режиме single скрываем второй слой
                secondImageLayer.setVisible(false);
            }
        }
        
        // Обновляем активные элементы UI
        updateModeUI(mode);
    }
    
    /**
     * Сбрасывает все стили слоев изображений
     */
    function resetLayerStyles() {
        const mapContainer = map.getTargetElement();
        const canvases = mapContainer.querySelectorAll('.ol-layer canvas');
        
        canvases.forEach(canvas => {
            canvas.style.clipPath = 'none';
        });
        
        // Восстанавливаем полную видимость слоев
        if (currentImageLayer) currentImageLayer.setOpacity(1);
        if (secondImageLayer) secondImageLayer.setOpacity(1);
    }
    
    /**
     * Обновление UI для отображения текущего режима
     */
    function updateModeUI(mode) {
        // Обновляем селектор режима, если он есть
        const modeSelector = document.getElementById('display-mode');
        if (modeSelector) {
            modeSelector.value = mode;
        }
        
        // Можно добавить дополнительное обновление UI здесь
    }
    
    /**
     * Показывает или скрывает индикатор загрузки
     * @param {boolean} show - показать или скрыть 
     */
    function showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (!loadingElement) {
            // Создаем элемент, если его нет
            const loader = document.createElement('div');
            loader.id = 'loading';
            loader.className = 'loading-spinner';
            loader.textContent = 'Загрузка...';
            document.body.appendChild(loader);
        }
        
        if (show) {
            document.getElementById('loading').style.display = 'block';
        } else {
            document.getElementById('loading').style.display = 'none';
        }
    }
    
    /**
     * Переключение между базовыми слоями карты
     * @param {string} layerId - идентификатор слоя из конфигурации
     */
    function setBaseLayer(layerId) {
        console.log('Переключение базового слоя на:', layerId);
        
        // Получаем все базовые слои
        const baseLayers = map.getLayers().getArray().filter(layer => 
            layer.get('type') === 'base'
        );
        
        // Скрываем все базовые слои
        baseLayers.forEach(layer => {
            layer.setVisible(false);
        });
        
        // Находим и показываем выбранный слой
        const selectedLayer = baseLayers.find(layer => layer.get('id') === layerId);
        if (selectedLayer) {
            selectedLayer.setVisible(true);
            console.log('Базовый слой установлен:', layerId);
        } else {
            console.error('Не найден базовый слой с ID:', layerId);
        }
    }
    
    /**
     * Настройка параметров отображения для изображения
     * @param {Object} params - Параметры отображения
     */
    function setImageRenderParams(params) {
        if (!currentImageLayer) {
            console.warn('Нет выбранного изображения для настройки. Пожалуйста, сначала выберите изображение.');
            return;
        }
        
        const filters = [];
        
        // Добавляем фильтры на основе параметров
        if (params.brightness !== undefined) {
            filters.push(`brightness(${100 + params.brightness * 100}%)`);
        }
        
        if (params.contrast !== undefined) {
            filters.push(`contrast(${params.contrast})`);
        }
        
        if (params.saturation !== undefined) {
            filters.push(`saturate(${params.saturation})`);
        }
        
        // Добавляем поддержку поворота оттенка (hue-rotate)
        if (params.hue !== undefined) {
            filters.push(`hue-rotate(${params.hue}deg)`);
        }
        
        // Добавляем поддержку эффекта сепии
        if (params.sepia !== undefined) {
            filters.push(`sepia(${params.sepia})`);
        }
        
        // Применяем фильтры к слою
        if (filters.length > 0) {
            const filterString = filters.join(' ');
            console.log('Применяем фильтры к изображению:', filterString);
            
            try {
                // Получаем HTML-элемент изображения
                const layerCanvas = map.getTargetElement().querySelector('.ol-layer canvas');
                if (layerCanvas) {
                    layerCanvas.style.filter = filterString;
                    console.log('Фильтры применены к слою');
                    
                    // Если есть второй слой и мы в режиме сравнения, применяем те же фильтры
                    if (secondImageLayer && secondImageLayer.getVisible() && currentMode === 'swipe') {
                        const secondCanvas = map.getTargetElement().querySelectorAll('.ol-layer canvas')[1];
                        if (secondCanvas) {
                            secondCanvas.style.filter = filterString;
                        }
                    }
                } else {
                    console.warn('Не найден canvas элемент слоя');
                }
            } catch (error) {
                console.error('Ошибка при установке фильтров:', error);
            }
        }
    }
    
    /**
     * Масштабирование карты
     * @param {number} delta - Изменение масштаба (положительное - приближение, отрицательное - отдаление)
     */
    function zoom(delta) {
        const currentZoom = view.getZoom();
        view.animate({
            zoom: currentZoom + delta,
            duration: 250
        });
    }
    
    /**
     * Сброс вида карты к начальному
     */
    function resetView() {
        view.animate({
            center: ol.proj.fromLonLat(config.map.center),
            zoom: config.map.zoom,
            duration: 500
        });
    }
    
    /**
     * Обновление информации об изображении
     * @param {Object} imageData - Данные изображения
     * @param {boolean} isSecondImage - Признак второго изображения
     */
    function updateImageInfo(imageData, isSecondImage) {
        console.log('[DEBUG] Вызов updateImageInfo:', imageData ? imageData.id : 'неопределено');
        
        // Проверяем наличие ImagesModule перед вызовом его методов
        if (typeof ImagesModule !== 'undefined') {
            console.log('[DEBUG] ImagesModule доступен в updateImageInfo');
            // В дальнейшем здесь может быть код для обновления интерфейса с информацией об изображении
        } else {
            console.warn('[WARNING] ImagesModule недоступен в updateImageInfo');
        }
    }
    
    /**
     * Применяет выбранный режим рендеринга к изображению
     * @param {string} modeId - Идентификатор режима рендеринга из конфигурации
     */
    function setRenderMode(modeId) {
        console.log('Применение режима рендеринга:', modeId);
        
        if (!currentImageLayer) {
            console.warn('Нет активного изображения для применения режима рендеринга');
            alert('Пожалуйста, выберите изображение перед применением режима рендеринга');
            return;
        }
        
        // Находим режим в конфигурации
        const renderMode = config.renderModes.find(mode => mode.id === modeId);
        if (!renderMode) {
            console.error('Не найден режим рендеринга с ID:', modeId);
            return;
        }
        
        // Применяем настройки фильтров
        setImageRenderParams(renderMode.filters);
        
        // Обновляем слайдеры настроек, чтобы они соответствовали выбранному режиму
        updateRenderControlSliders(renderMode.filters);
        
        console.log('Режим рендеринга применен:', modeId);
    }
    
    /**
     * Обновляет положение слайдеров в соответствии с выбранным режимом рендеринга
     * @param {Object} filters - Объект с параметрами фильтров
     */
    function updateRenderControlSliders(filters) {
        // Обновляем слайдер яркости
        if (filters.brightness !== undefined) {
            const brightnessSlider = document.getElementById('brightness');
            if (brightnessSlider) {
                brightnessSlider.value = filters.brightness;
            }
        }
        
        // Обновляем слайдер контраста
        if (filters.contrast !== undefined) {
            const contrastSlider = document.getElementById('contrast');
            if (contrastSlider) {
                contrastSlider.value = filters.contrast;
            }
        }
        
        // Обновляем слайдер насыщенности
        if (filters.saturation !== undefined) {
            const saturationSlider = document.getElementById('saturation');
            if (saturationSlider) {
                saturationSlider.value = filters.saturation;
            }
        }
        
        // В будущем можно добавить обработку других параметров, например hue или sepia
    }
    
    console.log('[DEBUG] Определение публичного API MapModule');
    
    // Публичный API модуля
    return {
        init: init,
        addImageLayer: addImageLayer,
        setMode: setMode,
        setBaseLayer: setBaseLayer,
        setImageRenderParams: setImageRenderParams,
        setRenderMode: setRenderMode,
        zoom: zoom,
        resetView: resetView,
        getMap: function() { return map; },
        updateSize: function() { 
            // Обновляем размер карты
            if (map) {
                setTimeout(() => {
                    map.updateSize();
                    console.log('[DEBUG] Размер карты обновлен');
                }, 50);
            }
        },
        getCurrentMode: function() { return currentMode; }
    };
})();

console.log('[DEBUG] MapModule инициализирован:', typeof MapModule !== 'undefined' ? 'Успешно' : 'Ошибка'); 