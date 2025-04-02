/**
 * Модуль для обработки элементов управления интерфейсом
 */
const ControlsModule = (function() {
    /**
     * Инициализация всех элементов управления
     */
    function init() {
        console.log('Инициализация элементов управления...');
        
        // Настройка обработчиков для поиска изображений
        setupSearchControls();
        
        // Настройка обработчиков режимов отображения
        setupDisplayModeControls();
        
        // Настройка обработчиков для элементов управления картой
        setupMapControls();
        
        // Настройка обработчиков для настроек изображения
        setupImageAdjustmentControls();
        
        // Настройка переключателя базовых слоев
        setupBaseLayerControls();
        
        // Настройка обработчика для режимов рендеринга
        setupRenderModeControls();
        
        console.log('Элементы управления инициализированы');
    }
    
    /**
     * Настройка обработчиков для поиска изображений
     */
    function setupSearchControls() {
        const searchButton = document.getElementById('search-images');
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                const dateFrom = document.getElementById('date-from').value;
                const dateTo = document.getElementById('date-to').value;
                
                // Проверка заполнения полей
                if (!dateFrom || !dateTo) {
                    alert('Пожалуйста, укажите диапазон дат для поиска');
                    return;
                }
                
                // Максимальная облачность (значение по умолчанию - 100%)
                const cloudCoverage = 100;
                
                // Выполняем поиск изображений
                ImagesModule.searchImages({
                    dateFrom: dateFrom,
                    dateTo: dateTo,
                    cloudCoverage: cloudCoverage
                }).then(images => {
                    ImagesModule.renderImageList(images);
                }).catch(error => {
                    console.error('Ошибка при поиске изображений:', error);
                    alert('Не удалось выполнить поиск изображений. Проверьте консоль для деталей.');
                });
            });
        }
    }
    
    /**
     * Настройка обработчиков для режимов отображения
     */
    function setupDisplayModeControls() {
        const displayModeSelect = document.getElementById('display-mode');
        if (displayModeSelect) {
            displayModeSelect.addEventListener('change', function() {
                const selectedMode = this.value;
                console.log('Выбран режим отображения:', selectedMode);
                
                // Устанавливаем режим отображения
                MapModule.setMode(selectedMode);
            });
        }
    }
    
    /**
     * Настройка обработчиков для элементов управления картой
     */
    function setupMapControls() {
        // Кнопка приближения
        const zoomInButton = document.getElementById('zoom-in');
        if (zoomInButton) {
            zoomInButton.addEventListener('click', function() {
                MapModule.zoom(1);
            });
        }
        
        // Кнопка отдаления
        const zoomOutButton = document.getElementById('zoom-out');
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', function() {
                MapModule.zoom(-1);
            });
        }
        
        // Кнопка сброса вида
        const resetViewButton = document.getElementById('reset-view');
        if (resetViewButton) {
            resetViewButton.addEventListener('click', function() {
                MapModule.resetView();
            });
        }
    }
    
    /**
     * Настройка обработчиков для настроек изображения
     */
    function setupImageAdjustmentControls() {
        // Яркость
        const brightnessSlider = document.getElementById('brightness');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', updateImageRenderParams);
        }
        
        // Контраст
        const contrastSlider = document.getElementById('contrast');
        if (contrastSlider) {
            contrastSlider.addEventListener('input', updateImageRenderParams);
        }
        
        // Насыщенность
        const saturationSlider = document.getElementById('saturation');
        if (saturationSlider) {
            saturationSlider.addEventListener('input', updateImageRenderParams);
        }
        
        // Кнопка сброса настроек
        const resetButton = document.getElementById('reset-image-settings');
        if (resetButton) {
            resetButton.addEventListener('click', resetImageSettings);
        }
    }
    
    /**
     * Обновление параметров отображения изображения
     */
    function updateImageRenderParams() {
        const brightness = parseFloat(document.getElementById('brightness').value);
        const contrast = parseFloat(document.getElementById('contrast').value);
        const saturation = parseFloat(document.getElementById('saturation').value);
        
        MapModule.setImageRenderParams({
            brightness: brightness,
            contrast: contrast,
            saturation: saturation
        });
    }
    
    /**
     * Сбрасывает настройки изображения к значениям по умолчанию
     */
    function resetImageSettings() {
        console.log('Сброс настроек изображения к значениям по умолчанию');
        
        // Сбрасываем значения слайдеров
        document.getElementById('brightness').value = 0;
        document.getElementById('contrast').value = 1;
        document.getElementById('saturation').value = 1;
        
        // Применяем настройки по умолчанию
        MapModule.setImageRenderParams({
            brightness: 0,
            contrast: 1,
            saturation: 1
        });
        
        // Также сбрасываем выбор режима рендеринга на "Естественный цвет"
        const renderModeSelect = document.getElementById('render-mode');
        if (renderModeSelect) {
            renderModeSelect.value = 'natural';
            
            // Обновляем описание режима
            const renderModeDescription = document.querySelector('.render-mode-description');
            updateRenderModeDescription('natural', renderModeDescription);
        }
    }
    
    /**
     * Настройка обработчика для режимов рендеринга
     */
    function setupRenderModeControls() {
        const renderModeSelect = document.getElementById('render-mode');
        const renderModeDescription = document.querySelector('.render-mode-description');
        
        if (renderModeSelect) {
            // Установка начального описания
            updateRenderModeDescription(renderModeSelect.value, renderModeDescription);
            
            renderModeSelect.addEventListener('change', function() {
                const selectedMode = this.value;
                console.log('Выбран режим рендеринга:', selectedMode);
                
                // Обновляем описание режима
                updateRenderModeDescription(selectedMode, renderModeDescription);
                
                // Применяем режим рендеринга
                MapModule.setRenderMode(selectedMode);
            });
        }
    }
    
    /**
     * Обновляет описание режима рендеринга
     */
    function updateRenderModeDescription(modeId, descriptionElement) {
        if (!descriptionElement) return;
        
        // Получаем информацию о режиме из конфигурации
        const renderMode = config.renderModes.find(mode => mode.id === modeId);
        
        if (renderMode && renderMode.description) {
            descriptionElement.textContent = renderMode.description;
        } else {
            descriptionElement.textContent = 'Описание недоступно';
        }
    }
    
    /**
     * Настройка переключателя базовых слоев
     */
    function setupBaseLayerControls() {
        const baseLayerRadios = document.querySelectorAll('input[name="base-layer"]');
        
        if (baseLayerRadios.length > 0) {
            // Устанавливаем начальное состояние
            const initialLayer = config.baseLayers.find(layer => layer.visible);
            if (initialLayer) {
                const radio = document.querySelector(`input[name="base-layer"][value="${initialLayer.id}"]`);
                if (radio) radio.checked = true;
            }
            
            // Добавляем обработчики событий
            baseLayerRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.checked) {
                        const layerId = this.value;
                        console.log('Выбран базовый слой:', layerId);
                        MapModule.setBaseLayer(layerId);
                    }
                });
            });
        }
    }
    
    // Публичный API модуля
    return {
        init: init
    };
})(); 