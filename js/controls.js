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
        
        // Настройка обработчика для изменения цвета фона
        setupBackgroundColorControls();
        
        // Настройка переключателя базовых слоев
        setupBaseLayerControls();
        
        // Адаптация высоты карты при изменении размеров окна
        window.addEventListener('resize', adjustMapHeight);
        
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
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        const resetButton = document.getElementById('reset-image-settings');
        
        // Обновляем отображение начальных значений
        updateSliderValueDisplay(brightnessSlider);
        updateSliderValueDisplay(contrastSlider);
        updateSliderValueDisplay(saturationSlider);
        
        // Добавляем обработчики событий
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', function() {
                updateSliderValueDisplay(this);
                updateImageRenderParams();
            });
        }
        
        if (contrastSlider) {
            contrastSlider.addEventListener('input', function() {
                updateSliderValueDisplay(this);
                updateImageRenderParams();
            });
        }
        
        if (saturationSlider) {
            saturationSlider.addEventListener('input', function() {
                updateSliderValueDisplay(this);
                updateImageRenderParams();
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', resetImageSettings);
        }
    }
    
    /**
     * Обновляет отображение текущего значения ползунка
     * @param {HTMLElement} slider - Элемент ползунка
     */
    function updateSliderValueDisplay(slider) {
        if (!slider) return;
        
        const value = parseFloat(slider.value);
        const id = slider.id;
        const valueSpan = document.getElementById(`${id}-value`);
        
        if (valueSpan) {
            valueSpan.textContent = value.toFixed(1);
        }
    }
    
    /**
     * Обновление параметров отображения изображения
     */
    function updateImageRenderParams() {
        // Увеличиваем задержку, чтобы не обновлять слишком часто
        // и дать браузеру время на визуализацию
        if (window.updateImageTimer) {
            clearTimeout(window.updateImageTimer);
        }
        
        // Флаг, указывающий что ползунок перемещается
        document.body.classList.add('adjusting-settings');
        
        window.updateImageTimer = setTimeout(() => {
            try {
                const brightness = parseFloat(document.getElementById('brightness').value);
                const contrast = parseFloat(document.getElementById('contrast').value);
                const saturation = parseFloat(document.getElementById('saturation').value);
                
                console.log('[DEBUG] Обновление параметров изображения:', { brightness, contrast, saturation });
                
                // Проверяем, существует ли MapModule
                if (typeof MapModule !== 'undefined' && MapModule.setImageRenderParams) {
                    // Применяем настройки к изображению
                    MapModule.setImageRenderParams({
                        brightness: brightness,
                        contrast: contrast,
                        saturation: saturation
                    });
                }
                
                // Убираем флаг обновления
                document.body.classList.remove('adjusting-settings');
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении параметров изображения:', error);
                document.body.classList.remove('adjusting-settings');
            }
        }, 30); // Увеличиваем задержку для устройств с низкой производительностью
    }
    
    /**
     * Сбрасывает настройки изображения к значениям по умолчанию
     */
    function resetImageSettings() {
        console.log('Сброс настроек изображения к значениям по умолчанию');
        
        // Очищаем таймер обновления, если он есть
        if (window.updateImageTimer) {
            clearTimeout(window.updateImageTimer);
        }
        
        // Показываем индикатор процесса обновления
        document.body.classList.add('adjusting-settings');
        
        // Значения по умолчанию
        const defaultBrightness = 0;
        const defaultContrast = 0;
        const defaultSaturation = 0;
        const defaultBgColor = '#ffffff';
        
        // Сбрасываем значения слайдеров
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        const colorPicker = document.getElementById('bg-color');
        
        if (brightnessSlider) {
            brightnessSlider.value = defaultBrightness;
            updateSliderValueDisplay(brightnessSlider);
        }
        
        if (contrastSlider) {
            contrastSlider.value = defaultContrast;
            updateSliderValueDisplay(contrastSlider);
        }
        
        if (saturationSlider) {
            saturationSlider.value = defaultSaturation;
            updateSliderValueDisplay(saturationSlider);
        }
        
        // Сбрасываем цвет фона и обновляем элемент выбора цвета
        if (colorPicker) {
            colorPicker.value = defaultBgColor;
        }
        
        // Применяем настройки к изображению напрямую
        if (typeof MapModule !== 'undefined' && MapModule.setImageRenderParams) {
            MapModule.setImageRenderParams({
                brightness: defaultBrightness,
                contrast: defaultContrast,
                saturation: defaultSaturation
            });
        }
        
        // Применяем цвет фона
        if (typeof MapModule !== 'undefined' && MapModule.setBackgroundColor) {
            MapModule.setBackgroundColor(defaultBgColor);
        }
        
        try {
            // Используем задержку для надежного обновления
            setTimeout(() => {
                // Убираем индикатор процесса обновления
                document.body.classList.remove('adjusting-settings');
                
                console.log('[DEBUG] Настройки изображения полностью сброшены к значениям по умолчанию');
            }, 150); // Увеличиваем задержку для более надежного обновления
        } catch (error) {
            console.error('[ERROR] Ошибка при сбросе настроек изображения:', error);
            // Убираем индикатор процесса обновления даже при ошибке
            document.body.classList.remove('adjusting-settings');
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
            
            // Флаг для отслеживания, был ли ранее выбран пустой слой
            let wasEmptyLayerSelected = document.getElementById('layer-empty').checked;
            
            // Добавляем обработчики событий
            baseLayerRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.checked) {
                        const layerId = this.value;
                        console.log('Выбран базовый слой:', layerId);
                        
                        // Проверяем, происходит ли переключение с пустого слоя на другой
                        if (wasEmptyLayerSelected && layerId !== 'empty') {
                            console.log('Переключение с пустого слоя - удаляем все изображения');
                            
                            // Удаляем все выбранные изображения
                            if (typeof ImagesModule !== 'undefined' && ImagesModule.removeAllImages) {
                                ImagesModule.removeAllImages();
                            }
                        }
                        
                        // Обновляем флаг пустого слоя
                        wasEmptyLayerSelected = (layerId === 'empty');
                        
                        // Устанавливаем базовый слой
                        MapModule.setBaseLayer(layerId);
                        
                        // Безопасно обновляем UI списка изображений после переключения слоя
                        // (используем минимальную задержку для обновления UI)
                        setTimeout(() => {
                            if (typeof ImagesModule !== 'undefined' && typeof ImagesModule.updateSelectedImageUI === 'function') {
                                ImagesModule.updateSelectedImageUI();
                            }
                        }, 50);
                    }
                });
            });
        }
    }
    
    /**
     * Настройка обработчика для изменения цвета фона
     */
    function setupBackgroundColorControls() {
        const applyColorButton = document.getElementById('apply-bg-color');
        const colorPicker = document.getElementById('bg-color');
        
        if (applyColorButton && colorPicker) {
            // Инициализируем цвет из localStorage, если он там есть
            const savedColor = localStorage.getItem('emptyLayerBgColor');
            if (savedColor) {
                colorPicker.value = savedColor;
                console.log('[DEBUG] Восстановлен сохраненный цвет фона:', savedColor);
            }
            
            applyColorButton.addEventListener('click', function() {
                const selectedColor = colorPicker.value;
                console.log('[DEBUG] Применяем новый цвет фона:', selectedColor);
                
                // Проверяем, активен ли пустой слой
                const emptyLayerRadio = document.getElementById('layer-empty');
                
                if (emptyLayerRadio && emptyLayerRadio.checked) {
                    // Если выбран пустой слой, сразу применяем цвет
                    applyBackgroundColor(selectedColor);
                } else {
                    // Если выбран другой слой, спрашиваем пользователя
                    if (confirm('Для применения цвета необходимо переключиться на пустой слой. Переключить?')) {
                        // Выбираем пустой слой и применяем цвет
                        emptyLayerRadio.checked = true;
                        MapModule.setBaseLayer('empty');
                        
                        // Небольшая задержка перед применением цвета,
                        // чтобы слой успел переключиться
                        setTimeout(() => {
                            applyBackgroundColor(selectedColor);
                        }, 100);
                    }
                }
            });
            
            // Добавляем возможность применения цвета по нажатию Enter в поле выбора цвета
            colorPicker.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    applyColorButton.click();
                    event.preventDefault();
                }
            });
        }
    }
    
    /**
     * Применяет выбранный цвет фона для пустого слоя
     * @param {string} color - Цвет в формате hex (#RRGGBB)
     */
    function applyBackgroundColor(color) {
        // Показываем индикатор процесса обновления
        document.body.classList.add('adjusting-settings');
        
        try {
            // Проверяем наличие функции в MapModule
            if (typeof MapModule !== 'undefined' && MapModule.setBackgroundColor) {
                const result = MapModule.setBackgroundColor(color);
                
                if (result) {
                    console.log('[DEBUG] Цвет фона успешно изменен на:', color);
                    
                    // Обновляем значение в элементе выбора цвета (если оно изменено программно)
                    const colorPicker = document.getElementById('bg-color');
                    if (colorPicker && colorPicker.value !== color) {
                        colorPicker.value = color;
                    }
                } else {
                    console.error('[ERROR] Не удалось применить цвет фона');
                    alert('Не удалось применить цвет фона. Попробуйте еще раз или перезагрузите страницу.');
                }
            } else {
                console.error('[ERROR] Функция MapModule.setBackgroundColor не найдена');
                alert('Не удалось применить цвет фона: функция не реализована');
            }
        } catch (error) {
            console.error('[ERROR] Ошибка при применении цвета фона:', error);
            alert('Произошла ошибка при применении цвета фона');
        } finally {
            // Убираем индикатор процесса обновления через небольшую задержку,
            // чтобы анимация была заметной
            setTimeout(() => {
                document.body.classList.remove('adjusting-settings');
            }, 500);
        }
    }
    
    /**
     * Настраивает правильную высоту карты с учетом высоты панели
     */
    function adjustMapHeight() {
        const controlPanel = document.getElementById('control-panel');
        const mapContainer = document.querySelector('.map-container');
        
        if (controlPanel && mapContainer) {
            const isCollapsed = controlPanel.classList.contains('collapsed');
            const panelHeight = isCollapsed 
                ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panel-collapsed-height'))
                : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panel-height'));
            
            // Обновляем высоту контейнера карты
            mapContainer.style.height = `calc(100% - ${panelHeight}px)`;
            
            // Уведомляем модуль карты об изменении размера
            if (typeof MapModule !== 'undefined' && MapModule.updateSize) {
                MapModule.updateSize();
            }
        }
    }
    
    // Публичный API модуля
    return {
        init: init,
        resetImageSettings: resetImageSettings,
        updateSliderValueDisplay: updateSliderValueDisplay,
        adjustMapHeight: adjustMapHeight,
        applyBackgroundColor: applyBackgroundColor
    };
})(); 