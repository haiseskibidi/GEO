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
        
        // Настройка редактирования значений настроек
        setupValueEditing();
        
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
        // Элементы управления для первого (основного) изображения
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        
        // Элементы управления для второго (сравниваемого) изображения
        const brightnessSlider2 = document.getElementById('brightness2');
        const contrastSlider2 = document.getElementById('contrast2');
        const saturationSlider2 = document.getElementById('saturation2');
        
        const resetButton = document.getElementById('reset-image-settings');
        
        // Обновляем отображение начальных значений для первого изображения
        updateSliderValueDisplay(brightnessSlider);
        updateSliderValueDisplay(contrastSlider);
        updateSliderValueDisplay(saturationSlider);
        
        // Обновляем отображение начальных значений для второго изображения
        updateSliderValueDisplay(brightnessSlider2);
        updateSliderValueDisplay(contrastSlider2);
        updateSliderValueDisplay(saturationSlider2);
        
        // Добавляем обработчики событий для первого изображения
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
        
        // Добавляем обработчики событий для второго изображения
        if (brightnessSlider2) {
            brightnessSlider2.addEventListener('input', function() {
                updateSliderValueDisplay(this);
                updateSecondImageRenderParams();
            });
        }
        
        if (contrastSlider2) {
            contrastSlider2.addEventListener('input', function() {
                updateSliderValueDisplay(this);
                updateSecondImageRenderParams();
            });
        }
        
        if (saturationSlider2) {
            saturationSlider2.addEventListener('input', function() {
                updateSliderValueDisplay(this);
                updateSecondImageRenderParams();
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
     * Обновление параметров второго изображения
     */
    function updateSecondImageRenderParams() {
        // Увеличиваем задержку, чтобы не обновлять слишком часто
        // и дать браузеру время на визуализацию
        if (window.updateSecondImageTimer) {
            clearTimeout(window.updateSecondImageTimer);
        }
        
        // Флаг, указывающий что ползунок перемещается
        document.body.classList.add('adjusting-settings');
        
        window.updateSecondImageTimer = setTimeout(() => {
            try {
                const brightness = parseFloat(document.getElementById('brightness2').value);
                const contrast = parseFloat(document.getElementById('contrast2').value);
                const saturation = parseFloat(document.getElementById('saturation2').value);
                
                console.log('[DEBUG] Обновление параметров второго изображения:', { brightness, contrast, saturation });
                
                // Проверяем, существует ли MapModule
                if (typeof MapModule !== 'undefined' && MapModule.setSecondImageRenderParams) {
                    // Применяем настройки ко второму изображению
                    MapModule.setSecondImageRenderParams({
                        brightness: brightness,
                        contrast: contrast,
                        saturation: saturation
                    });
                }
                
                // Убираем флаг обновления
                document.body.classList.remove('adjusting-settings');
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении параметров второго изображения:', error);
                document.body.classList.remove('adjusting-settings');
            }
        }, 30); // Увеличиваем задержку для устройств с низкой производительностью
    }
    
    /**
     * Сбрасывает настройки изображения к значениям по умолчанию
     */
    function resetImageSettings() {
        console.log('Сброс настроек изображений к значениям по умолчанию');
        
        // Очищаем таймеры обновления, если они есть
        if (window.updateImageTimer) {
            clearTimeout(window.updateImageTimer);
        }
        if (window.updateSecondImageTimer) {
            clearTimeout(window.updateSecondImageTimer);
        }
        
        // Показываем индикатор процесса обновления
        document.body.classList.add('adjusting-settings');
        
        try {
            // Значения по умолчанию
            const defaultBrightness = 0;
            const defaultContrast = 0;
            const defaultSaturation = 0;
            const defaultBgColor = '#ffffff';
            
            // Сбрасываем значения слайдеров для первого изображения
            const brightnessSlider = document.getElementById('brightness');
            const contrastSlider = document.getElementById('contrast');
            const saturationSlider = document.getElementById('saturation');
            
            // Сбрасываем значения слайдеров для второго изображения
            const brightnessSlider2 = document.getElementById('brightness2');
            const contrastSlider2 = document.getElementById('contrast2');
            const saturationSlider2 = document.getElementById('saturation2');
            
            const colorPicker = document.getElementById('bg-color');
            
            // Сбрасываем первое изображение
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
            
            // Сбрасываем второе изображение
            if (brightnessSlider2) {
                brightnessSlider2.value = defaultBrightness;
                updateSliderValueDisplay(brightnessSlider2);
            }
            
            if (contrastSlider2) {
                contrastSlider2.value = defaultContrast;
                updateSliderValueDisplay(contrastSlider2);
            }
            
            if (saturationSlider2) {
                saturationSlider2.value = defaultSaturation;
                updateSliderValueDisplay(saturationSlider2);
            }
            
            // Сбрасываем цвет фона и обновляем элемент выбора цвета
            if (colorPicker) {
                colorPicker.value = defaultBgColor;
            }
            
            // Запоминаем текущее значение прозрачности, если находимся в режиме opacity
            let currentOpacity = 0.5; // значение по умолчанию
            if (typeof MapModule !== 'undefined' && MapModule.getCurrentMode && MapModule.getCurrentMode() === 'opacity') {
                // Если есть слайдер прозрачности, получим его значение
                const opacitySlider = document.getElementById('opacity-slider');
                if (opacitySlider) {
                    currentOpacity = parseFloat(opacitySlider.value);
                }
                console.log('[DEBUG] Сохраняем текущую прозрачность для режима opacity:', currentOpacity);
            }
            
            // Применяем настройки к первому изображению напрямую
            if (typeof MapModule !== 'undefined' && MapModule.setImageRenderParams) {
                MapModule.setImageRenderParams({
                    brightness: defaultBrightness,
                    contrast: defaultContrast,
                    saturation: defaultSaturation
                });
            }
            
            // Применяем настройки ко второму изображению напрямую
            if (typeof MapModule !== 'undefined' && MapModule.setSecondImageRenderParams) {
                MapModule.setSecondImageRenderParams({
                    brightness: defaultBrightness,
                    contrast: defaultContrast,
                    saturation: defaultSaturation
                });
            }
            
            // Применяем цвет фона
            if (typeof MapModule !== 'undefined' && MapModule.setBackgroundColor) {
                MapModule.setBackgroundColor(defaultBgColor);
            }
            
            // Восстанавливаем прозрачность, если находимся в режиме opacity
            if (typeof MapModule !== 'undefined' && 
                MapModule.getCurrentMode && 
                MapModule.getCurrentMode() === 'opacity' && 
                typeof MapModule.getSecondImageLayer === 'function') {
                
                const secondLayer = MapModule.getSecondImageLayer();
                if (secondLayer) {
                    secondLayer.setOpacity(currentOpacity);
                    console.log('[DEBUG] Восстановлена прозрачность слоя после сброса:', currentOpacity);
                }
            }
            
            // Используем задержку для надежного обновления
            setTimeout(() => {
                // Убираем индикатор процесса обновления
                document.body.classList.remove('adjusting-settings');
                
                console.log('[DEBUG] Настройки изображений полностью сброшены к значениям по умолчанию');
            }, 150); // Увеличиваем задержку для более надежного обновления
        } catch (error) {
            console.error('[ERROR] Ошибка при сбросе настроек изображений:', error);
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
    
    /**
     * Настройка редактирования значений через клавиатуру
     */
    function setupValueEditing() {
        console.log('[DEBUG] Настройка редактирования значений через клавиатуру');
        
        // Все элементы отображения значений слайдеров
        const valueSpans = [
            document.getElementById('brightness-value'),
            document.getElementById('contrast-value'),
            document.getElementById('saturation-value'),
            document.getElementById('brightness2-value'),
            document.getElementById('contrast2-value'),
            document.getElementById('saturation2-value')
        ];
        
        // Назначаем обработчики для всех элементов
        valueSpans.forEach(span => {
            if (span) {
                span.addEventListener('click', function() {
                    createInputForValueSpan(span);
                });
            }
        });
    }
    
    /**
     * Преобразует элемент span с значением в поле ввода
     * @param {HTMLElement} span - элемент отображения значения
     */
    function createInputForValueSpan(span) {
        if (!span) return;
        
        // Получаем идентификатор соответствующего слайдера
        const sliderId = span.id.replace('-value', '');
        const slider = document.getElementById(sliderId);
        
        if (!slider) {
            console.warn(`[WARN] Не найден слайдер для ${span.id}`);
            return;
        }
        
        // Текущее значение
        const currentValue = parseFloat(span.textContent);
        
        // Получаем ограничения из слайдера
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step);
        
        // Скрываем span
        span.style.display = 'none';
        
        // Создаем поле ввода
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue;
        input.min = min;
        input.max = max;
        input.step = step;
        
        // Вставляем поле ввода рядом со span
        span.parentNode.insertBefore(input, span.nextSibling);
        
        // Устанавливаем фокус и выделяем весь текст
        input.focus();
        input.select();
        
        // Обработчик ввода - обновляет слайдер при изменении значения
        input.addEventListener('input', function() {
            // Преобразуем введенное значение в число с учетом ограничений
            let newValue = parseFloat(this.value);
            
            // Проверяем границы
            if (!isNaN(newValue)) {
                if (newValue < min) newValue = min;
                if (newValue > max) newValue = max;
                
                // Обновляем значение слайдера
                slider.value = newValue;
                
                // Вызываем событие изменения для слайдера, чтобы обновить изображение
                const event = new Event('input', { bubbles: true });
                slider.dispatchEvent(event);
            }
        });
        
        // Завершение редактирования по клавише Enter или при потере фокуса
        function finishEditing() {
            // Получаем текущее значение из поля ввода
            let finalValue = parseFloat(input.value);
            
            // Проверяем границы
            if (isNaN(finalValue)) {
                finalValue = currentValue;
            } else {
                if (finalValue < min) finalValue = min;
                if (finalValue > max) finalValue = max;
            }
            
            // Округляем значение до десятых (как показывается в интерфейсе)
            finalValue = Math.round(finalValue * 10) / 10;
            
            // Обновляем слайдер
            slider.value = finalValue;
            
            // Обновляем отображаемое значение
            span.textContent = finalValue.toFixed(1);
            
            // Удаляем поле ввода
            input.remove();
            
            // Возвращаем видимость span
            span.style.display = 'inline-block';
            
            // Вызываем событие изменения для слайдера, чтобы обновить изображение
            const event = new Event('input', { bubbles: true });
            slider.dispatchEvent(event);
        }
        
        // Обработчики завершения редактирования
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                finishEditing();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                // При нажатии Escape возвращаем исходное значение
                span.style.display = 'inline-block';
                input.remove();
                e.preventDefault();
            }
        });
    }
    
    // Публичный API модуля
    return {
        init: init,
        resetImageSettings: resetImageSettings,
        updateSliderValueDisplay: updateSliderValueDisplay,
        adjustMapHeight: adjustMapHeight,
        applyBackgroundColor: applyBackgroundColor,
        updateSecondImageRenderParams: updateSecondImageRenderParams
    };
})(); 