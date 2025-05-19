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
    
    // Основные объекты карты
    let map;
    let view;
    
    // Слои
    let baseLayers = [];
    let boundaryLayer = null;
    let currentImageLayer = null;
    let secondImageLayer = null;
    
    // Хранение текущего режима отображения
    let currentMode = 'single';
    
    // Добавляем хранение параметров для обоих изображений
    let firstImageParams = {
        brightness: 0,
        contrast: 0,
        saturation: 0
    };
    
    let secondImageParams = {
        brightness: 0,
        contrast: 0,
        saturation: 0
    };
    
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
                maxZoom: config.map.maxZoom
            });
            
            // Создаем базовые слои
            const layers = createBaseLayers();
            
            // Создаем карту с базовыми элементами управления
            map = new ol.Map({
                target: 'map',
                layers: layers,
                view: view,
                projection: 'EPSG:3857',
                controls: [
                    // Добавляем только нужные элементы управления
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
                case 'empty':
                    source = new ol.source.XYZ({
                        tileUrlFunction: function() {
                            return ''; // возвращает пустой URL, создавая пустой базовый слой
                        }
                    });
                    break;
                default:
                    source = new ol.source.OSM();
            }
            
            // Получаем цвет фона для пустого слоя
            // Используем значение из localStorage, если оно есть, или белый по умолчанию
            let bgColor = '#FFFFFF';
            if (layerConfig.id === 'empty') {
                const savedColor = localStorage.getItem('emptyLayerBgColor');
                if (savedColor) {
                    bgColor = savedColor;
                }
                
                // Обновляем цвет в элементе выбора цвета, если он существует
                const colorPicker = document.getElementById('bg-color');
                if (colorPicker) {
                    colorPicker.value = bgColor;
                }
            }
            
            // Создаем слой
            return new ol.layer.Tile({
                source: source,
                visible: layerConfig.visible,
                properties: {
                    id: layerConfig.id,
                    name: layerConfig.name,
                    type: 'base'
                },
                // Добавляем цвет фона для пустого слоя
                background: layerConfig.id === 'empty' ? bgColor : undefined
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
                // Удаляем заливку, чтобы был только контур
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0)' // Полная прозрачность
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
            
            // Проверяем наличие URL изображения
            let imageUrl = imageData.url;
            
            if (!imageUrl) {
                console.error('[ERROR] URL изображения отсутствует в данных:', imageData);
                showLoading(false);
                return;
            }
            
            // Создаем функцию загрузки изображения с обработкой ошибок
            const loadImage = () => {
                try {
                    let source;
                    
                    // Проверяем расширение файла и устанавливаем источник данных
                    if (imageUrl.toLowerCase().endsWith('.tif') || imageUrl.toLowerCase().endsWith('.tiff')) {
                        // Проверяем, что текущий базовый слой является 'Пустым слоем'
                        const baseLayers = map.getLayers().getArray().filter(layer => layer.get('type') === 'base' && layer.getVisible());
                        const currentBaseLayer = baseLayers.length > 0 ? baseLayers[0] : null;
                        if (!currentBaseLayer || currentBaseLayer.get('id') !== 'empty') {
                            alert('Просмотр TIFF доступен только на "Пустой слой". Пожалуйста, выберите пустой слой.');
                            showLoading(false);
                            return;
                        }
                        console.log('[DEBUG] Загрузка GeoTIFF:', imageUrl);
                        
                        // Для GeoTIFF файлов используем специальный источник данных
                        source = new ol.source.GeoTIFF({
                            sources: [
                                { url: imageUrl }
                            ],
                            imageExtent: ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857')
                        });
                    } else {
                        // Для других форматов используем стандартный источник
                        source = new ol.source.ImageStatic({
                            url: imageUrl,
                            imageExtent: ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857'),
                            projection: 'EPSG:3857',
                            crossOrigin: 'anonymous'
                        });
                    }
                    
                    // Обработчик ошибок при загрузке
                    source.on('imageloaderror', function(error) {
                        console.error(`Ошибка загрузки изображения: ${imageUrl}`, error);
                        showLoading(false);
                        alert('Не удалось загрузить изображение. Пожалуйста, убедитесь, что файл существует и доступен.');
                    });
                    
                    // Обработчик успешной загрузки
                    source.on('imageloadend', function() {
                        showLoading(false);
                    });
                    
                    // Создаем слой изображения
                    let layer;
                    if (imageUrl.toLowerCase().endsWith('.tif') || imageUrl.toLowerCase().endsWith('.tiff')) {
                        // Для TIFF файлов используем WebGLTile
                        layer = new ol.layer.WebGLTile({
                            title: imageData.name || 'Спутниковое изображение',
                            source: source,
                            baseLayer: true,
                            visible: true,
                            // Настройки фильтров через стиль
                            style: {
                                brightness: 0,     // Начальная яркость
                                contrast: 0,       // Начальный контраст (без изменений)
                                saturation: 0,     // Начальная насыщенность (без изменений)
                                gamma: 1.0,        // Гамма-коррекция (без изменений)
                                operation: 'none'  // Операция с каналами (без изменений)
                            }
                        });
                    } else {
                        // Для других форматов используем обычный слой изображений
                        layer = new ol.layer.Image({
                            title: imageData.name || 'Спутниковое изображение',
                            source: source,
                            //opacity: 0.9,
                            visible: true,
                            //zIndex: 10
                        });
                    }
                    
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
                    map.setView(source.getView());
                    
                    // Если оба слоя существуют, приближаем карту к экстенту изображения
                    if (currentImageLayer && !secondImageLayer) {
                        // Если только один слой, просто приблизим к его экстенту без анимации
                        map.getView().fit(ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857'), {
                            padding: [50, 50, 50, 50]
                        });
                    } else if (currentImageLayer && secondImageLayer) {
                        // Если есть оба слоя и включен режим сравнения, настроим swipe
                        if (document.getElementById('display-mode').value === 'swipe') {
                            setupSwipeMode();
                        }
                    }
                    
                    // Обновляем информацию о текущем изображении
                    updateImageInfo(imageData, isSecondImage);
                    showLoading(false);
                    
                    
                } catch (error) {
                    console.error('[ERROR] Ошибка при добавлении слоя:', error);
                    showLoading(false);
                    alert('Произошла ошибка при добавлении слоя с изображением');
                }
            };
            
            // Проверяем существование изображения
            if (!imageExists(imageUrl)) {
                console.warn(`Изображение ${imageUrl} не найдено или имеет неподдерживаемый формат`);
                showLoading(false);
                alert(`Изображение ${imageUrl.split('/').pop()} не найдено или имеет неподдерживаемый формат`);
                return;
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
        
        console.log('[DEBUG] Обновление шторки, процент:', percent);
        
        // Получаем контейнер карты
        const mapContainer = map.getTargetElement();
        
        // Более надежный способ получения canvas элементов слоев
        // Сначала получаем все canvas элементы
        const canvases = Array.from(mapContainer.querySelectorAll('.ol-layer canvas'));
        
        if (canvases.length < 2) {
            console.warn('[WARN] Недостаточно canvas элементов для режима шторки:', canvases.length);
            return;
        }
        
        // Первый canvas - для первого изображения
        const firstCanvas = canvases[canvases.length - 2]; // Предпоследний
        // Второй canvas - для второго изображения
        const secondCanvas = canvases[canvases.length - 1]; // Последний
        
        // Выводим отладочную информацию
        console.log('[DEBUG] Найдено canvas элементов:', canvases.length);
        console.log('[DEBUG] Применяем clip-path к canvas элементам');
        
        // Применяем обрезку с помощью clip-path
        if (firstCanvas) {
            firstCanvas.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
            console.log('[DEBUG] Первый canvas обновлен');
        } else {
            console.warn('[WARN] Первый canvas не найден');
        }
        
        if (secondCanvas) {
            secondCanvas.style.clipPath = `inset(0 0 0 ${percent}%)`;
            console.log('[DEBUG] Второй canvas обновлен');
        } else {
            console.warn('[WARN] Второй canvas не найден');
        }
    }
    
    /**
     * Установка режима отображения
     * @param {string} mode - режим отображения ('single', 'swipe', 'opacity')
     */
    function setMode(mode) {
        console.log('[DEBUG] Переключение режима отображения на:', mode);
        currentMode = mode;
        
        // Проверяем, есть ли два слоя для режимов сравнения
        if ((mode === 'swipe' || mode === 'opacity') && (!currentImageLayer || !secondImageLayer)) {
            console.warn('Для режима сравнения рекомендуется выбрать два изображения');
            
            // Показываем предупреждение, но не блокируем выбор режима
            if (!currentImageLayer) {
                alert('Для полноценного использования режима сравнения рекомендуется выбрать основное изображение');
            document.getElementById('display-mode').value = 'single';
            currentMode = 'single';
            return;
            }
            
            // Если есть основное изображение, то позволяем использовать режим даже без второго
        }
        
        // Сначала сбросим состояние всех элементов
        const swipeContainer = document.getElementById('swipe-container');
        const verticalSwipe = document.getElementById('vertical-swipe');
        
        // Скрываем оба контейнера по умолчанию
        if (swipeContainer) swipeContainer.style.display = 'none';
        if (verticalSwipe) verticalSwipe.classList.add('hidden');
        
        // Сбрасываем clip-path и другие стили на слоях изображений
        resetLayerStyles();
        
        if (mode === 'swipe') {
            // Настраиваем вертикальную шторку для режима swipe
            if (currentImageLayer) {
                console.log('[DEBUG] Настройка режима шторки');
                
                // Убеждаемся, что основной слой виден
                currentImageLayer.setVisible(true);
                currentImageLayer.setOpacity(1);
                
                // Если есть второй слой, настраиваем его тоже
                if (secondImageLayer) {
                    secondImageLayer.setVisible(true);
                secondImageLayer.setOpacity(1);
                
                    // Больше не синхронизируем стили между изображениями
                    // для возможности их независимой настройки
                
                setupSwipeMode();
                } else {
                    // Если второго слоя нет, просто показываем основной слой
                    console.log('[DEBUG] Режим шторки с одним изображением');
                }
            }
        } else if (mode === 'opacity') {
            // Для режима прозрачности
            console.log('[DEBUG] Настройка режима прозрачности');
            
            if (currentImageLayer) {
                currentImageLayer.setVisible(true);
                currentImageLayer.setOpacity(1);
            
                // Добавляем управление прозрачностью только если есть второй слой
            if (secondImageLayer) {
                secondImageLayer.setVisible(true);
                // Устанавливаем прозрачность для второго слоя
                secondImageLayer.setOpacity(0.5);
                
                    // Больше не синхронизируем стили между изображениями
                    // для возможности их независимой настройки
                    
                    // Создаем элементы управления прозрачностью
                    if (swipeContainer) {
                        console.log('[DEBUG] Создание слайдера прозрачности');
                        
                        // Создаем слайдер для управления прозрачностью
                const opacitySlider = document.createElement('input');
                opacitySlider.type = 'range';
                opacitySlider.min = '0';
                opacitySlider.max = '1';
                opacitySlider.step = '0.1';
                opacitySlider.value = '0.5';
                        opacitySlider.id = 'opacity-slider';
                opacitySlider.style.width = '100%';
                opacitySlider.style.margin = '10px 0';
                
                        // Очищаем контейнер и добавляем новое содержимое
                        swipeContainer.innerHTML = '';
                        const opacityControls = document.createElement('div');
                        opacityControls.className = 'opacity-controls';
                        
                        const label = document.createElement('p');
                        label.textContent = 'Прозрачность сравниваемого слоя:';
                        
                        opacityControls.appendChild(label);
                        opacityControls.appendChild(opacitySlider);
                        swipeContainer.appendChild(opacityControls);
                        
                        // Показываем контейнер со слайдером
                        swipeContainer.style.display = 'block';
                
                // Добавляем обработчик изменения прозрачности
                opacitySlider.addEventListener('input', function() {
                    const opacity = parseFloat(this.value);
                    secondImageLayer.setOpacity(opacity);
                });
                        
                        console.log('[DEBUG] Слайдер прозрачности создан и отображен');
                    } else {
                        console.warn('[WARN] Не найден контейнер для слайдера прозрачности');
                    }
                } else {
                    // Если второго слоя нет, просто показываем основной слой
                    console.log('[DEBUG] Режим прозрачности с одним изображением');
                }
            }
        } else {
            // Для режима одиночного изображения
            console.log('[DEBUG] Настройка одиночного режима');
            
            if (currentImageLayer) {
                currentImageLayer.setVisible(true);
                currentImageLayer.setOpacity(1);
            }
            
            if (secondImageLayer) {
                // Теперь показываем второе изображение также в обычном режиме
                secondImageLayer.setVisible(true);
                secondImageLayer.setOpacity(1);
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
     * Устанавливает базовый слой по его ID
     * @param {string} layerId - идентификатор слоя
     */
    function setBaseLayer(layerId) {
        console.log('[DEBUG] Установка базового слоя:', layerId);
        
        if (!map) return;
        
        const layers = map.getLayers().getArray();
        
        // Находим и устанавливаем видимость для базовых слоев
        layers.forEach(layer => {
            if (layer.get('type') === 'base') {
                const isVisible = layer.get('id') === layerId;
                layer.setVisible(isVisible);
            }
        });
        
        // Скрываем или показываем слой границы в зависимости от выбранного базового слоя
        if (boundaryLayer) {
            boundaryLayer.setVisible(layerId !== 'empty');
        }
        
        // Если переключаемся на любой слой, кроме пустого - удаляем все изображения и сбрасываем вид
        if (layerId !== 'empty') {
            // Очищаем все изображения и сбрасываем вид к Приморскому краю
            
            // Удаляем слой второго изображения, если он есть
            if (secondImageLayer) {
                map.removeLayer(secondImageLayer);
                secondImageLayer = null;
            }
            
            // Удаляем слой основного изображения, если он есть
            if (currentImageLayer) {
                map.removeLayer(currentImageLayer);
                currentImageLayer = null;
            }
            
            // Принудительно создаем новый объект view с координатами центра Приморского края
            console.log('[DEBUG] Сброс вида на координаты Приморского края:', config.map.center);
            
            // Создаем новый объект View и устанавливаем его для карты
            const newView = new ol.View({
                center: ol.proj.fromLonLat(config.map.center),
                zoom: config.map.zoom,
                minZoom: config.map.minZoom,
                maxZoom: config.map.maxZoom
            });
            
            // Устанавливаем новый объект view для карты
            map.setView(newView);
            view = newView;
        }
        
        // Обновляем размер карты, чтобы избежать проблем с отображением
        map.updateSize();
        
        // Принудительное обновление вида без задержки
        map.renderSync();
    }
    
    /**
     * Устанавливает цвет фона для пустого слоя
     * @param {string} color - Цвет в формате hex (#RRGGBB)
     */
    function setBackgroundColor(color) {
        console.log('[DEBUG] Установка цвета фона пустого слоя:', color);
        
        if (!map) {
            console.error('[ERROR] Карта не инициализирована');
            return;
        }
        
        try {
            // Находим пустой слой среди всех слоев карты
            const layers = map.getLayers().getArray();
            const emptyLayer = layers.find(layer => layer.get('id') === 'empty');
            
            if (!emptyLayer) {
                console.error('[ERROR] Пустой слой не найден');
                return;
            }
            
            // Сохраняем цвет в localStorage для его восстановления при следующей загрузке
            localStorage.setItem('emptyLayerBgColor', color);
            
            // Устанавливаем цвет фона для пустого слоя
            emptyLayer.setBackground(color);
            
            // Устанавливаем цвет фона для контейнера карты
            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
                mapContainer.style.backgroundColor = color;
            }
            
            // Более активный метод обновления - создаем новый слой с тем же источником
            // и новым фоном, затем заменяем старый слой
            try {
                const source = emptyLayer.getSource();
                const oldVisible = emptyLayer.getVisible();
                
                // Создаем новый слой с тем же источником, но новым цветом фона
                const newEmptyLayer = new ol.layer.Tile({
                    source: source,
                    visible: oldVisible,
                    properties: {
                        id: 'empty',
                        name: 'Пустой',
                        type: 'base'
                    },
                    background: color
                });
                
                // Находим индекс пустого слоя
                const layerIndex = layers.indexOf(emptyLayer);
                
                // Заменяем старый слой новым
                if (layerIndex >= 0) {
                    map.getLayers().removeAt(layerIndex);
                    map.getLayers().insertAt(layerIndex, newEmptyLayer);
                    console.log('[DEBUG] Пустой слой заменен для применения нового цвета фона');
                }
            } catch (replaceError) {
                console.warn('[WARN] Не удалось заменить слой:', replaceError);
                // Продолжаем с методом setBackground
            }
            
            // Обновляем размер карты для принудительного перерисовывания
            map.updateSize();
            
            // Дополнительно вызываем render для более надежного обновления
            setTimeout(() => {
                map.render();
                console.log('[DEBUG] Цвет фона обновлен и карта перерисована');
            }, 100);
            
            return true;
        } catch (error) {
            console.error('[ERROR] Ошибка при установке цвета фона:', error);
            return false;
        }
    }
    
    /**
     * Применяет настройки рендеринга к основному изображению
     * @param {Object} params - Параметры рендеринга (brightness, contrast, saturation и т.д.)
     */
    function setImageRenderParams(params) {
        if (!currentImageLayer) {
            console.warn('Нет выбранного изображения для настройки. Пожалуйста, сначала выберите изображение.');
            return;
        }
        
        // Добавляем ограничения значений, чтобы избежать слишком ярких изображений
        let safeParams = {
            brightness: Math.max(-1.5, Math.min(0.7, params.brightness || 0)),
            contrast: Math.max(-4, Math.min(4, params.contrast || 0)),
            saturation: Math.max(-4, Math.min(4, params.saturation || 0))
        };

        // Добавляем другие параметры, если они есть, с ограничениями
        if (params.hue !== undefined) {
            safeParams.hue = Math.max(-180, Math.min(180, params.hue));
        }
        if (params.sepia !== undefined) {
            safeParams.sepia = Math.max(0, Math.min(1, params.sepia));
        }
        
        console.log('[DEBUG] Применение фильтров к основному изображению:', safeParams);
        
        // Проверяем, является ли слой WebGLTile (используется для TIFF)
        const isWebGLTileLayer = currentImageLayer instanceof ol.layer.WebGLTile;
        
        console.log('[DEBUG] Применение фильтров к изображению. Тип слоя:', isWebGLTileLayer ? 'WebGLTile' : 'Обычный');
        
        if (isWebGLTileLayer) {
            // Для WebGLTile слоев применяем параметры напрямую через свойство style
            try {
                // Делаем копию текущего слоя перед изменением
                const oldLayer = currentImageLayer;
                // Получаем настройки и источник данных
                const source = oldLayer.getSource();
                
                // Создаем новый слой с теми же параметрами, но обновленным стилем
                const newLayer = new ol.layer.WebGLTile({
                    title: oldLayer.get('title') || 'Спутниковое изображение',
                    source: source,
                    baseLayer: oldLayer.get('baseLayer'),
                    visible: oldLayer.getVisible(),
                    style: {
                        brightness: safeParams.brightness,
                        contrast: safeParams.contrast,
                        saturation: safeParams.saturation,
                        gamma: 1.0,
                        operation: 'none'
                    }
                });
                
                // Заменяем слой в карте
                const layerIndex = map.getLayers().getArray().indexOf(oldLayer);
                if (layerIndex >= 0) {
                    map.getLayers().removeAt(layerIndex);
                    map.getLayers().insertAt(layerIndex, newLayer);
                    currentImageLayer = newLayer;
                    console.log('[DEBUG] WebGLTile слой заменен для обновления стиля');
                }
                
                // Принудительное обновление карты
                setTimeout(() => {
                    map.updateSize();
                    map.renderSync();
                    console.log('[DEBUG] Карта принудительно обновлена после замены слоев');
                }, 10);
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении WebGLTile слоя:', error);
                
                // Запасной вариант - используем CSS фильтры
                applyCSS_Filters(safeParams, false);
            }
        } else {
            // Для обычных слоев используем CSS фильтры
            applyCSS_Filters(safeParams, false);
        }
        
        // Сохраняем текущие параметры фильтров
        firstImageParams = safeParams;
    }
    
    /**
     * Применяет настройки рендеринга ко второму (сравниваемому) изображению
     * @param {Object} params - Параметры рендеринга (brightness, contrast, saturation и т.д.)
     */
    function setSecondImageRenderParams(params) {
        if (!secondImageLayer) {
            console.warn('Нет выбранного второго изображения для настройки. Пожалуйста, сначала выберите второе изображение.');
            return;
        }
        
        // Добавляем ограничения значений, чтобы избежать слишком ярких изображений
        let safeParams = {
            brightness: Math.max(-1.5, Math.min(0.7, params.brightness || 0)),
            contrast: Math.max(-4, Math.min(4, params.contrast || 0)),
            saturation: Math.max(-4, Math.min(4, params.saturation || 0))
        };

        // Добавляем другие параметры, если они есть, с ограничениями
        if (params.hue !== undefined) {
            safeParams.hue = Math.max(-180, Math.min(180, params.hue));
        }
        if (params.sepia !== undefined) {
            safeParams.sepia = Math.max(0, Math.min(1, params.sepia));
        }
        
        console.log('[DEBUG] Применение фильтров ко второму изображению:', safeParams);
        
        // Проверяем, является ли слой WebGLTile (используется для TIFF)
        const isWebGLTileLayer = secondImageLayer instanceof ol.layer.WebGLTile;
        
        if (isWebGLTileLayer) {
            // Для WebGLTile слоев применяем параметры напрямую через свойство style
            try {
                // Делаем копию текущего слоя перед изменением
                const oldLayer = secondImageLayer;
                // Получаем настройки и источник данных
                const source = oldLayer.getSource();
                
                // Создаем новый слой с теми же параметрами, но обновленным стилем
                const newLayer = new ol.layer.WebGLTile({
                    title: oldLayer.get('title') || 'Спутниковое изображение (сравнение)',
                    source: source,
                    baseLayer: oldLayer.get('baseLayer'),
                    visible: oldLayer.getVisible(),
                        style: {
                            brightness: safeParams.brightness,
                            contrast: safeParams.contrast,
                            saturation: safeParams.saturation,
                            gamma: 1.0,
                            operation: 'none'
                        }
                    });
                    
                // Заменяем слой в карте
                const layerIndex = map.getLayers().getArray().indexOf(oldLayer);
                if (layerIndex >= 0) {
                    map.getLayers().removeAt(layerIndex);
                    map.getLayers().insertAt(layerIndex, newLayer);
                    secondImageLayer = newLayer;
                        console.log('[DEBUG] Второй WebGLTile слой заменен для обновления стиля');
                }
                
                // Принудительное обновление карты
                setTimeout(() => {
                    map.updateSize();
                    map.renderSync();
                    console.log('[DEBUG] Карта принудительно обновлена после замены слоев');
                }, 10);
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении WebGLTile слоя:', error);
                
                // Запасной вариант - используем CSS фильтры
                applyCSS_Filters(safeParams, true);
            }
        } else {
            // Для обычных слоев используем CSS фильтры
            applyCSS_Filters(safeParams, true);
        }
        
        // Сохраняем текущие параметры фильтров для второго изображения
        secondImageParams = safeParams;
    }
    
    /**
     * Применяет CSS-фильтры к изображению
     * @param {Object} params - параметры фильтров (brightness, contrast, saturation)
     * @param {boolean} isSecond - флаг, указывающий, что обрабатывается второе изображение
     */
    function applyCSS_Filters(params, isSecond = false) {
        const filters = [];
        
        // Добавляем фильтры на основе параметров
        if (params.brightness !== undefined) {
            filters.push(`brightness(${100 + params.brightness * 100}%)`);
        }
        
        if (params.contrast !== undefined) {
            // Обработка отрицательных значений контраста
            const contrastValue = params.contrast < 0 
                ? Math.max(0.1, 1 / (Math.abs(params.contrast) + 1)) 
                : params.contrast;
            filters.push(`contrast(${contrastValue})`);
        }
        
        if (params.saturation !== undefined) {
            // Обработка отрицательных значений насыщенности
            const saturationValue = params.saturation < 0 
                ? Math.max(0, 1 + params.saturation / 4) 
                : params.saturation;
            filters.push(`saturate(${saturationValue})`);
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
            console.log(`[DEBUG] Применяем CSS фильтры к ${isSecond ? "второму" : "основному"} изображению:`, filterString);
            
            try {
                // Определяем, какой слой нужно настроить
                const targetLayer = isSecond ? secondImageLayer : currentImageLayer;
                
                if (!targetLayer) {
                    console.warn(`[WARN] ${isSecond ? "Второй" : "Основной"} слой не найден для применения фильтров`);
                    return;
                }
                
                // Получаем все HTML-элементы изображения
                const canvasElements = map.getTargetElement().querySelectorAll('.ol-layer canvas');
                
                if (canvasElements && canvasElements.length > 0) {
                    // Находим индекс нужного слоя в массиве слоев карты
                    const layerIndex = map.getLayers().getArray().indexOf(targetLayer);
                        if (layerIndex >= 0 && canvasElements[layerIndex]) {
                            canvasElements[layerIndex].style.filter = filterString;
                        console.log(`[DEBUG] Фильтры применены к ${isSecond ? "второму" : "основному"} слою, индекс:`, layerIndex);
                        } else {
                        console.warn(`[WARN] Не найден canvas элемент для слоя с индексом ${layerIndex}`);
                    }
                } else {
                    console.warn('[WARN] Не найдены canvas элементы слоев');
                }
            } catch (error) {
                console.error('[ERROR] Ошибка при установке фильтров:', error);
            }
        }
        
        // Принудительное обновление карты
        map.render();
    }
    
    /**
     * Масштабирование карты
     * @param {number} delta - Изменение масштаба (положительное - приближение, отрицательное - отдаление)
     */
    function zoom(delta) {
        const currentZoom = view.getZoom();
        // Мгновенное изменение масштаба без анимации
        view.setZoom(currentZoom + delta);
    }
    
    /**
     * Сброс вида карты к начальному
     */
    function resetView() {
        // Мгновенный сброс вида без анимации
        view.setCenter(ol.proj.fromLonLat(config.map.center));
        view.setZoom(config.map.zoom);
        console.log('[DEBUG] Вид сброшен к координатам Приморского края без анимации');
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
    
    console.log('[DEBUG] Определение публичного API MapModule');
    
    // Публичный API модуля
    return {
        init: init,
        addImageLayer: addImageLayer,
        setMode: setMode,
        setBaseLayer: setBaseLayer,
        setBackgroundColor: setBackgroundColor,
        setImageRenderParams: setImageRenderParams,
        setSecondImageRenderParams: setSecondImageRenderParams,
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
        getCurrentMode: function() { return currentMode; },
        getSecondImageLayer: function() { return secondImageLayer; },
        resetSecondImageLayer: function() { 
            console.log('[DEBUG] Сброс ссылки на второй слой изображения');
            secondImageLayer = null;
        }
    };
})();

console.log('[DEBUG] MapModule инициализирован:', typeof MapModule !== 'undefined' ? 'Успешно' : 'Ошибка'); 