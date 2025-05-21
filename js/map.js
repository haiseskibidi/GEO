console.log('[DEBUG] Начало инициализации MapModule');

if (typeof ol === 'undefined') {
    console.error('[ERROR] Библиотека OpenLayers (ol) не загружена перед MapModule');
}

console.log('[DEBUG] Зависимости от config:', typeof config !== 'undefined' ? 'Доступен' : 'Недоступен');

const MapModule = (function() {
    console.log('[DEBUG] Выполнение IIFE MapModule');
    
    let map;
    let view;
    
    let baseLayers = [];
    let boundaryLayer = null;
    let currentImageLayer = null;
    let secondImageLayer = null;
    
    let currentMode = 'single';
    
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
    
    function init() {
        console.log('[DEBUG] Вызов MapModule.init()');
        
        try {
            view = new ol.View({
                center: ol.proj.fromLonLat(config.map.center),
                zoom: config.map.zoom,
                minZoom: config.map.minZoom,
                maxZoom: config.map.maxZoom
            });
            
            const layers = createBaseLayers();
            
            map = new ol.Map({
                target: 'map',
                layers: layers,
                view: view,
                projection: 'EPSG:3857',
                controls: [
                    new ol.control.ScaleLine(),
                    new ol.control.Attribution(),
                    new ol.control.Rotate()
                ]
            });
            
            if (config.map.extent) {
                addBoundaryLayer();
            }
            
            setupMousePositionControl();
            setupScaleInfo();
            
            console.log('[DEBUG] MapModule.init() завершен успешно');
            
            return map;
        } catch (error) {
            console.error('[ERROR] Ошибка в MapModule.init():', error);
            throw error;
        }
    }
    
    function createBaseLayers() {
        return config.baseLayers.map(layerConfig => {
            let source;
            
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
                            return '';
                        }
                    });
                    break;
                default:
                    source = new ol.source.OSM();
            }
            
            let bgColor = '#FFFFFF';
            if (layerConfig.id === 'empty') {
                const savedColor = localStorage.getItem('emptyLayerBgColor');
                if (savedColor) {
                    bgColor = savedColor;
                }
                
                const colorPicker = document.getElementById('bg-color');
                if (colorPicker) {
                    colorPicker.value = bgColor;
                }
            }
            
            return new ol.layer.Tile({
                source: source,
                visible: layerConfig.visible,
                properties: {
                    id: layerConfig.id,
                    name: layerConfig.name,
                    type: 'base'
                },
                background: layerConfig.id === 'empty' ? bgColor : undefined
            });
        });
    }
    
    function addBoundaryLayer() {
        const extent = config.map.extent;
        
        const boundaryFeature = new ol.Feature({
            geometry: new ol.geom.Polygon([[
                ol.proj.fromLonLat([extent[0], extent[1]]),
                ol.proj.fromLonLat([extent[0], extent[3]]),
                ol.proj.fromLonLat([extent[2], extent[3]]),
                ol.proj.fromLonLat([extent[2], extent[1]]),
                ol.proj.fromLonLat([extent[0], extent[1]])
            ]])
        });
        
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
                    color: 'rgba(0, 0, 255, 0)'
                })
            })
        });
        
        map.addLayer(boundaryLayer);
    }
    
    function setupMousePositionControl() {
        const mousePositionElement = document.getElementById('mouse-position');
        
        map.on('pointermove', function(event) {
            if (event.dragging) return;
            
            const coordinates = ol.proj.toLonLat(event.coordinate);
            const lon = coordinates[0].toFixed(4);
            const lat = coordinates[1].toFixed(4);
            
            mousePositionElement.innerHTML = `Координаты: ${lon}°, ${lat}°`;
        });
    }
    
    function setupScaleInfo() {
        const scaleInfoElement = document.getElementById('scale-info');
        
        view.on('change:resolution', function() {
            const resolution = view.getResolution();
            const scale = Math.round(resolution * 3779.5275593333);
            scaleInfoElement.innerHTML = `Масштаб: 1:${scale}`;
        });
    }
    
    function addImageLayer(imageData, isSecondImage = false) {
        console.log('[DEBUG] Вызов MapModule.addImageLayer:', imageData ? imageData.id : 'неопределено', 'isSecondImage:', isSecondImage);
        
        if (!imageData) {
            console.error('[ERROR] Вызов addImageLayer с пустыми данными изображения');
            return;
        }
        
        try {
            showLoading(true);
            
            let imageUrl = imageData.url;
            
            if (!imageUrl) {
                console.error('[ERROR] URL изображения отсутствует в данных:', imageData);
                showLoading(false);
                return;
            }
            
            const loadImage = () => {
                try {
                    let source;
                    
                    if (imageUrl.toLowerCase().endsWith('.tif') || imageUrl.toLowerCase().endsWith('.tiff')) {
                        const baseLayers = map.getLayers().getArray().filter(layer => layer.get('type') === 'base' && layer.getVisible());
                        const currentBaseLayer = baseLayers.length > 0 ? baseLayers[0] : null;
                        if (!currentBaseLayer || currentBaseLayer.get('id') !== 'empty') {
                            alert('Просмотр TIFF доступен только на "Пустой слой". Пожалуйста, выберите пустой слой.');
                            showLoading(false);
                            return;
                        }
                        console.log('[DEBUG] Загрузка GeoTIFF:', imageUrl);
                        
                        source = new ol.source.GeoTIFF({
                            sources: [
                                { url: imageUrl }
                            ],
                            imageExtent: ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857')
                        });
                    } else {
                        source = new ol.source.ImageStatic({
                            url: imageUrl,
                            imageExtent: ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857'),
                            projection: 'EPSG:3857',
                            crossOrigin: 'anonymous'
                        });
                    }
                    
                    source.on('imageloaderror', function(error) {
                        console.error(`Ошибка загрузки изображения: ${imageUrl}`, error);
                        showLoading(false);
                        alert('Не удалось загрузить изображение. Пожалуйста, убедитесь, что файл существует и доступен.');
                    });
                    
                    source.on('imageloadend', function() {
                        showLoading(false);
                    });
                    
                    let layer;
                    if (imageUrl.toLowerCase().endsWith('.tif') || imageUrl.toLowerCase().endsWith('.tiff')) {
                        layer = new ol.layer.WebGLTile({
                            title: imageData.name || 'Спутниковое изображение',
                            source: source,
                            baseLayer: true,
                            visible: true,
                            style: {
                                brightness: 0,
                                contrast: 0,
                                saturation: 0,
                                gamma: 1.0,
                                operation: 'none'
                            }
                        });
                    } else {
                        layer = new ol.layer.Image({
                            title: imageData.name || 'Спутниковое изображение',
                            source: source,
                            visible: true,
                        });
                    }
                    
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
                    
                    map.addLayer(layer);
                    map.setView(source.getView());
                    
                    if (currentImageLayer && !secondImageLayer) {
                        map.getView().fit(ol.proj.transformExtent(imageData.extent, 'EPSG:4326', 'EPSG:3857'), {
                            padding: [50, 50, 50, 50]
                        });
                    } else if (currentImageLayer && secondImageLayer) {
                        if (document.getElementById('display-mode').value === 'swipe') {
                            setupSwipeMode();
                        }
                    }
                    
                    updateImageInfo(imageData, isSecondImage);
                    showLoading(false);
                    
                    
                } catch (error) {
                    console.error('[ERROR] Ошибка при добавлении слоя:', error);
                    showLoading(false);
                    alert('Произошла ошибка при добавлении слоя с изображением');
                }
            };
            
            if (!imageExists(imageUrl)) {
                console.warn(`Изображение ${imageUrl} не найдено или имеет неподдерживаемый формат`);
                showLoading(false);
                alert(`Изображение ${imageUrl.split('/').pop()} не найдено или имеет неподдерживаемый формат`);
                return;
            }
            
            loadImage();
            
            
        } catch (error) {
            console.error('[ERROR] Критическая ошибка в addImageLayer:', error);
            showLoading(false);
        }
    }
    
    function imageExists(url) {
        const validExtension = config.validExtensions.some(ext => url.toLowerCase().endsWith(ext));
        if (!validExtension) {
            console.warn(`URL не имеет допустимого расширения изображения: ${url}`);
            return false;
        }
        
        return true;
    }
    
    function setupSwipeMode() {
        if (!currentImageLayer || !secondImageLayer) {
            console.warn('Не могу настроить режим сравнения: отсутствуют слои');
            return;
        }
        
        currentImageLayer.setVisible(true);
        secondImageLayer.setVisible(true);
        
        document.getElementById('swipe-container').style.display = 'none';
        const verticalSwipe = document.getElementById('vertical-swipe');
        verticalSwipe.classList.remove('hidden');
        
        const mapContainer = map.getTargetElement();
        const mapWidth = mapContainer.offsetWidth;
        const mapHeight = mapContainer.offsetHeight;
        
        const initialPosition = 50;
        const swipeLine = document.querySelector('.swipe-line');
        const swipeHandle = document.getElementById('swipe-handle');
        
        swipeLine.style.left = initialPosition + '%';
        swipeHandle.style.left = initialPosition + '%';
        
        let isDragging = false;
        
        swipeHandle.addEventListener('mousedown', function(e) {
            isDragging = true;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const rect = mapContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = Math.min(100, Math.max(0, (x / mapWidth) * 100));
            
            swipeLine.style.left = percent + '%';
            swipeHandle.style.left = percent + '%';
            
            updateSwipePrerender(percent);
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        updateSwipePrerender(initialPosition);
    }
    
    function updateSwipePrerender(percent) {
        if (!currentImageLayer || !secondImageLayer) return;
        
        console.log('[DEBUG] Обновление шторки, процент:', percent);
        
        const mapContainer = map.getTargetElement();
        
        const canvases = Array.from(mapContainer.querySelectorAll('.ol-layer canvas'));
        
        if (canvases.length < 2) {
            console.warn('[WARN] Недостаточно canvas элементов для режима шторки:', canvases.length);
            return;
        }
        
        const firstCanvas = canvases[canvases.length - 2];
        const secondCanvas = canvases[canvases.length - 1];
        
        console.log('[DEBUG] Найдено canvas элементов:', canvases.length);
        console.log('[DEBUG] Применяем clip-path к canvas элементам');
        
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
    
    function setMode(mode) {
        console.log('[DEBUG] Переключение режима отображения на:', mode);
        currentMode = mode;
        
        if ((mode === 'swipe' || mode === 'opacity') && (!currentImageLayer || !secondImageLayer)) {
            console.warn('Для режима сравнения рекомендуется выбрать два изображения');
            
            if (!currentImageLayer) {
                alert('Для полноценного использования режима сравнения рекомендуется выбрать основное изображение');
            document.getElementById('display-mode').value = 'single';
            currentMode = 'single';
            return;
            }
        }
        
        const swipeContainer = document.getElementById('swipe-container');
        const verticalSwipe = document.getElementById('vertical-swipe');
        
        if (swipeContainer) swipeContainer.style.display = 'none';
        if (verticalSwipe) verticalSwipe.classList.add('hidden');
        
        resetLayerStyles();
        
        if (mode === 'swipe') {
            if (currentImageLayer) {
                console.log('[DEBUG] Настройка режима шторки');
                
                currentImageLayer.setVisible(true);
                currentImageLayer.setOpacity(1);
                
                if (secondImageLayer) {
                    secondImageLayer.setVisible(true);
                secondImageLayer.setOpacity(1);
                
                setupSwipeMode();
                } else {
                    console.log('[DEBUG] Режим шторки с одним изображением');
                }
            }
        } else if (mode === 'opacity') {
            console.log('[DEBUG] Настройка режима прозрачности');
            
            if (currentImageLayer) {
                currentImageLayer.setVisible(true);
                currentImageLayer.setOpacity(1);
            
            if (secondImageLayer) {
                secondImageLayer.setVisible(true);
                secondImageLayer.setOpacity(0.5);
                    
                    if (swipeContainer) {
                        console.log('[DEBUG] Создание слайдера прозрачности');
                        
                const opacitySlider = document.createElement('input');
                opacitySlider.type = 'range';
                opacitySlider.min = '0';
                opacitySlider.max = '1';
                opacitySlider.step = '0.1';
                opacitySlider.value = '0.5';
                        opacitySlider.id = 'opacity-slider';
                opacitySlider.style.width = '100%';
                opacitySlider.style.margin = '10px 0';
                
                        swipeContainer.innerHTML = '';
                        const opacityControls = document.createElement('div');
                        opacityControls.className = 'opacity-controls';
                        
                        const label = document.createElement('p');
                        label.textContent = 'Прозрачность сравниваемого слоя:';
                        
                        opacityControls.appendChild(label);
                        opacityControls.appendChild(opacitySlider);
                        swipeContainer.appendChild(opacityControls);
                        
                        swipeContainer.style.display = 'block';
                
                opacitySlider.addEventListener('input', function() {
                    const opacity = parseFloat(this.value);
                    secondImageLayer.setOpacity(opacity);
                });
                        
                        console.log('[DEBUG] Слайдер прозрачности создан и отображен');
                    } else {
                        console.warn('[WARN] Не найден контейнер для слайдера прозрачности');
                    }
                } else {
                    console.log('[DEBUG] Режим прозрачности с одним изображением');
                }
            }
        } else {
            console.log('[DEBUG] Настройка одиночного режима');
            
            if (currentImageLayer) {
                currentImageLayer.setVisible(true);
                currentImageLayer.setOpacity(1);
            }
            
            if (secondImageLayer) {
                secondImageLayer.setVisible(true);
                secondImageLayer.setOpacity(1);
            }
        }
        
        updateModeUI(mode);
    }
    
    function resetLayerStyles() {
        const mapContainer = map.getTargetElement();
        const canvases = mapContainer.querySelectorAll('.ol-layer canvas');
        
        canvases.forEach(canvas => {
            canvas.style.clipPath = 'none';
        });
        
        if (currentImageLayer) currentImageLayer.setOpacity(1);
        if (secondImageLayer) secondImageLayer.setOpacity(1);
    }
    
    function updateModeUI(mode) {
        const modeSelector = document.getElementById('display-mode');
        if (modeSelector) {
            modeSelector.value = mode;
        }
    }
    
    function showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (!loadingElement) {
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
    
    function setBaseLayer(layerId) {
        console.log('[DEBUG] Установка базового слоя:', layerId);
        
        if (!map) return;
        
        const layers = map.getLayers().getArray();
        
        layers.forEach(layer => {
            if (layer.get('type') === 'base') {
                const isVisible = layer.get('id') === layerId;
                layer.setVisible(isVisible);
            }
        });
        
        if (boundaryLayer) {
            boundaryLayer.setVisible(layerId !== 'empty');
        }
        
        if (layerId !== 'empty') {
            if (secondImageLayer) {
                map.removeLayer(secondImageLayer);
                secondImageLayer = null;
            }
            
            if (currentImageLayer) {
                map.removeLayer(currentImageLayer);
                currentImageLayer = null;
            }
            
            console.log('[DEBUG] Сброс вида на координаты Приморского края:', config.map.center);
            
            const newView = new ol.View({
                center: ol.proj.fromLonLat(config.map.center),
                zoom: config.map.zoom,
                minZoom: config.map.minZoom,
                maxZoom: config.map.maxZoom
            });
            
            map.setView(newView);
            view = newView;
        }
        
        map.updateSize();
        map.renderSync();
    }
    
    function setBackgroundColor(color) {
        console.log('[DEBUG] Установка цвета фона пустого слоя:', color);
        
        if (!map) {
            console.error('[ERROR] Карта не инициализирована');
            return;
        }
        
        try {
            const layers = map.getLayers().getArray();
            const emptyLayer = layers.find(layer => layer.get('id') === 'empty');
            
            if (!emptyLayer) {
                console.error('[ERROR] Пустой слой не найден');
                return;
            }
            
            localStorage.setItem('emptyLayerBgColor', color);
            
            emptyLayer.setBackground(color);
            
            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
                mapContainer.style.backgroundColor = color;
            }
            
            try {
                const source = emptyLayer.getSource();
                const oldVisible = emptyLayer.getVisible();
                
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
                
                const layerIndex = layers.indexOf(emptyLayer);
                
                if (layerIndex >= 0) {
                    map.getLayers().removeAt(layerIndex);
                    map.getLayers().insertAt(layerIndex, newEmptyLayer);
                    console.log('[DEBUG] Пустой слой заменен для применения нового цвета фона');
                }
            } catch (replaceError) {
                console.warn('[WARN] Не удалось заменить слой:', replaceError);
            }
            
            map.updateSize();
            
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
    
    function setImageRenderParams(params) {
        if (!currentImageLayer) {
            console.warn('Нет выбранного изображения для настройки. Пожалуйста, сначала выберите изображение.');
            return;
        }
        
        let safeParams = {
            brightness: Math.max(-1.5, Math.min(0.7, params.brightness || 0)),
            contrast: Math.max(-4, Math.min(4, params.contrast || 0)),
            saturation: Math.max(-4, Math.min(4, params.saturation || 0))
        };

        if (params.hue !== undefined) {
            safeParams.hue = Math.max(-180, Math.min(180, params.hue));
        }
        if (params.sepia !== undefined) {
            safeParams.sepia = Math.max(0, Math.min(1, params.sepia));
        }
        
        console.log('[DEBUG] Применение фильтров к основному изображению:', safeParams);
        
        const isWebGLTileLayer = currentImageLayer instanceof ol.layer.WebGLTile;
        
        console.log('[DEBUG] Применение фильтров к изображению. Тип слоя:', isWebGLTileLayer ? 'WebGLTile' : 'Обычный');
        
        if (isWebGLTileLayer) {
            try {
                const oldLayer = currentImageLayer;
                const source = oldLayer.getSource();
                
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
                
                const layerIndex = map.getLayers().getArray().indexOf(oldLayer);
                if (layerIndex >= 0) {
                    map.getLayers().removeAt(layerIndex);
                    map.getLayers().insertAt(layerIndex, newLayer);
                    currentImageLayer = newLayer;
                    console.log('[DEBUG] WebGLTile слой заменен для обновления стиля');
                }
                
                setTimeout(() => {
                    map.updateSize();
                    map.renderSync();
                    console.log('[DEBUG] Карта принудительно обновлена после замены слоев');
                }, 10);
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении WebGLTile слоя:', error);
                
                applyCSS_Filters(safeParams, false);
            }
        } else {
            applyCSS_Filters(safeParams, false);
        }
        
        firstImageParams = safeParams;
    }
    
    function setSecondImageRenderParams(params) {
        if (!secondImageLayer) {
            console.warn('Нет выбранного второго изображения для настройки. Пожалуйста, сначала выберите второе изображение.');
            return;
        }
        
        let safeParams = {
            brightness: Math.max(-1.5, Math.min(0.7, params.brightness || 0)),
            contrast: Math.max(-4, Math.min(4, params.contrast || 0)),
            saturation: Math.max(-4, Math.min(4, params.saturation || 0))
        };

        if (params.hue !== undefined) {
            safeParams.hue = Math.max(-180, Math.min(180, params.hue));
        }
        if (params.sepia !== undefined) {
            safeParams.sepia = Math.max(0, Math.min(1, params.sepia));
        }
        
        console.log('[DEBUG] Применение фильтров ко второму изображению:', safeParams);
        
        const isWebGLTileLayer = secondImageLayer instanceof ol.layer.WebGLTile;
        
        if (isWebGLTileLayer) {
            try {
                const oldLayer = secondImageLayer;
                const source = oldLayer.getSource();
                
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
                    
                const layerIndex = map.getLayers().getArray().indexOf(oldLayer);
                if (layerIndex >= 0) {
                    map.getLayers().removeAt(layerIndex);
                    map.getLayers().insertAt(layerIndex, newLayer);
                    secondImageLayer = newLayer;
                        console.log('[DEBUG] Второй WebGLTile слой заменен для обновления стиля');
                }
                
                setTimeout(() => {
                    map.updateSize();
                    map.renderSync();
                    console.log('[DEBUG] Карта принудительно обновлена после замены слоев');
                }, 10);
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении WebGLTile слоя:', error);
                
                applyCSS_Filters(safeParams, true);
            }
        } else {
            applyCSS_Filters(safeParams, true);
        }
        
        secondImageParams = safeParams;
    }
    
    function applyCSS_Filters(params, isSecond = false) {
        const filters = [];
        
        if (params.brightness !== undefined) {
            filters.push(`brightness(${100 + params.brightness * 100}%)`);
        }
        
        if (params.contrast !== undefined) {
            const contrastValue = params.contrast < 0 
                ? Math.max(0.1, 1 / (Math.abs(params.contrast) + 1)) 
                : params.contrast;
            filters.push(`contrast(${contrastValue})`);
        }
        
        if (params.saturation !== undefined) {
            const saturationValue = params.saturation < 0 
                ? Math.max(0, 1 + params.saturation / 4) 
                : params.saturation;
            filters.push(`saturate(${saturationValue})`);
        }
        
        if (params.hue !== undefined) {
            filters.push(`hue-rotate(${params.hue}deg)`);
        }
        
        if (params.sepia !== undefined) {
            filters.push(`sepia(${params.sepia})`);
        }
        
        if (filters.length > 0) {
            const filterString = filters.join(' ');
            console.log(`[DEBUG] Применяем CSS фильтры к ${isSecond ? "второму" : "основному"} изображению:`, filterString);
            
            try {
                const targetLayer = isSecond ? secondImageLayer : currentImageLayer;
                
                if (!targetLayer) {
                    console.warn(`[WARN] ${isSecond ? "Второй" : "Основной"} слой не найден для применения фильтров`);
                    return;
                }
                
                const canvasElements = map.getTargetElement().querySelectorAll('.ol-layer canvas');
                
                if (canvasElements && canvasElements.length > 0) {
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
        
        map.render();
    }
    
    function zoom(delta) {
        const currentZoom = view.getZoom();
        view.setZoom(currentZoom + delta);
    }
    
    function resetView() {
        view.setCenter(ol.proj.fromLonLat(config.map.center));
        view.setZoom(config.map.zoom);
        console.log('[DEBUG] Вид сброшен к координатам Приморского края без анимации');
    }
    
    function updateImageInfo(imageData, isSecondImage) {
        console.log('[DEBUG] Вызов updateImageInfo:', imageData ? imageData.id : 'неопределено');
        
        if (typeof ImagesModule !== 'undefined') {
            console.log('[DEBUG] ImagesModule доступен в updateImageInfo');
        } else {
            console.warn('[WARNING] ImagesModule недоступен в updateImageInfo');
        }
    }
    
    console.log('[DEBUG] Определение публичного API MapModule');
    
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