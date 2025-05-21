const ControlsModule = (function() {
    function init() {
        console.log('Инициализация элементов управления...');
        setupSearchControls();
        setupDisplayModeControls();
        setupMapControls();
        setupImageAdjustmentControls();
        setupBackgroundColorControls();
        setupBaseLayerControls();
        setupValueEditing();
        window.addEventListener('resize', adjustMapHeight);
        console.log('Элементы управления инициализированы');
    }
    
    function setupSearchControls() {
        const searchButton = document.getElementById('search-images');
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                const dateFrom = document.getElementById('date-from').value;
                const dateTo = document.getElementById('date-to').value;
                if (!dateFrom || !dateTo) {
                    alert('Пожалуйста, укажите диапазон дат для поиска');
                    return;
                }
                const cloudCoverage = 100;
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
    
    function setupDisplayModeControls() {
        const displayModeSelect = document.getElementById('display-mode');
        if (displayModeSelect) {
            displayModeSelect.addEventListener('change', function() {
                const selectedMode = this.value;
                console.log('Выбран режим отображения:', selectedMode);
                MapModule.setMode(selectedMode);
            });
        }
    }
    
    function setupMapControls() {
        const zoomInButton = document.getElementById('zoom-in');
        if (zoomInButton) {
            zoomInButton.addEventListener('click', function() {
                MapModule.zoom(1);
            });
        }
        const zoomOutButton = document.getElementById('zoom-out');
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', function() {
                MapModule.zoom(-1);
            });
        }
        const resetViewButton = document.getElementById('reset-view');
        if (resetViewButton) {
            resetViewButton.addEventListener('click', function() {
                MapModule.resetView();
            });
        }
    }
    
    function setupImageAdjustmentControls() {
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        const brightnessSlider2 = document.getElementById('brightness2');
        const contrastSlider2 = document.getElementById('contrast2');
        const saturationSlider2 = document.getElementById('saturation2');
        const resetButton = document.getElementById('reset-image-settings');
        updateSliderValueDisplay(brightnessSlider);
        updateSliderValueDisplay(contrastSlider);
        updateSliderValueDisplay(saturationSlider);
        updateSliderValueDisplay(brightnessSlider2);
        updateSliderValueDisplay(contrastSlider2);
        updateSliderValueDisplay(saturationSlider2);
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
    
    function updateSliderValueDisplay(slider) {
        if (!slider) return;
        const value = parseFloat(slider.value);
        const id = slider.id;
        const valueSpan = document.getElementById(`${id}-value`);
        if (valueSpan) {
            valueSpan.textContent = value.toFixed(1);
        }
    }
    
    function updateImageRenderParams() {
        if (window.updateImageTimer) {
            clearTimeout(window.updateImageTimer);
        }
        document.body.classList.add('adjusting-settings');
        window.updateImageTimer = setTimeout(() => {
            try {
                const brightness = parseFloat(document.getElementById('brightness').value);
                const contrast = parseFloat(document.getElementById('contrast').value);
                const saturation = parseFloat(document.getElementById('saturation').value);
                console.log('[DEBUG] Обновление параметров изображения:', { brightness, contrast, saturation });
                if (typeof MapModule !== 'undefined' && MapModule.setImageRenderParams) {
                    MapModule.setImageRenderParams({
                        brightness: brightness,
                        contrast: contrast,
                        saturation: saturation
                    });
                }
                document.body.classList.remove('adjusting-settings');
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении параметров изображения:', error);
                document.body.classList.remove('adjusting-settings');
            }
        }, 30);
    }
    
    function updateSecondImageRenderParams() {
        if (window.updateSecondImageTimer) {
            clearTimeout(window.updateSecondImageTimer);
        }
        document.body.classList.add('adjusting-settings');
        window.updateSecondImageTimer = setTimeout(() => {
            try {
                const brightness = parseFloat(document.getElementById('brightness2').value);
                const contrast = parseFloat(document.getElementById('contrast2').value);
                const saturation = parseFloat(document.getElementById('saturation2').value);
                console.log('[DEBUG] Обновление параметров второго изображения:', { brightness, contrast, saturation });
                if (typeof MapModule !== 'undefined' && MapModule.setSecondImageRenderParams) {
                    MapModule.setSecondImageRenderParams({
                        brightness: brightness,
                        contrast: contrast,
                        saturation: saturation
                    });
                }
                document.body.classList.remove('adjusting-settings');
            } catch (error) {
                console.error('[ERROR] Ошибка при обновлении параметров второго изображения:', error);
                document.body.classList.remove('adjusting-settings');
            }
        }, 30);
    }
    
    function resetImageSettings() {
        console.log('Сброс настроек изображений к значениям по умолчанию');
        if (window.updateImageTimer) {
            clearTimeout(window.updateImageTimer);
        }
        if (window.updateSecondImageTimer) {
            clearTimeout(window.updateSecondImageTimer);
        }
        document.body.classList.add('adjusting-settings');
        try {
            const defaultBrightness = 0;
            const defaultContrast = 0;
            const defaultSaturation = 0;
            const defaultBgColor = '#ffffff';
            const brightnessSlider = document.getElementById('brightness');
            const contrastSlider = document.getElementById('contrast');
            const saturationSlider = document.getElementById('saturation');
            const brightnessSlider2 = document.getElementById('brightness2');
            const contrastSlider2 = document.getElementById('contrast2');
            const saturationSlider2 = document.getElementById('saturation2');
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
            if (colorPicker) {
                colorPicker.value = defaultBgColor;
            }
            let currentOpacity = 0.5;
            if (typeof MapModule !== 'undefined' && MapModule.getCurrentMode && MapModule.getCurrentMode() === 'opacity') {
                const opacitySlider = document.getElementById('opacity-slider');
                if (opacitySlider) {
                    currentOpacity = parseFloat(opacitySlider.value);
                }
                console.log('[DEBUG] Сохраняем текущую прозрачность для режима opacity:', currentOpacity);
            }
            if (typeof MapModule !== 'undefined' && MapModule.setImageRenderParams) {
                MapModule.setImageRenderParams({
                    brightness: defaultBrightness,
                    contrast: defaultContrast,
                    saturation: defaultSaturation
                });
            }
            if (typeof MapModule !== 'undefined' && MapModule.setSecondImageRenderParams) {
                MapModule.setSecondImageRenderParams({
                    brightness: defaultBrightness,
                    contrast: defaultContrast,
                    saturation: defaultSaturation
                });
            }
            if (typeof MapModule !== 'undefined' && MapModule.setBackgroundColor) {
                MapModule.setBackgroundColor(defaultBgColor);
            }
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
            setTimeout(() => {
                document.body.classList.remove('adjusting-settings');
                console.log('[DEBUG] Настройки изображений полностью сброшены к значениям по умолчанию');
            }, 150);
        } catch (error) {
            console.error('[ERROR] Ошибка при сбросе настроек изображений:', error);
            document.body.classList.remove('adjusting-settings');
        }
    }
    
    function setupBaseLayerControls() {
        const baseLayerRadios = document.querySelectorAll('input[name="base-layer"]');
        if (baseLayerRadios.length > 0) {
            const initialLayer = config.baseLayers.find(layer => layer.visible);
            if (initialLayer) {
                const radio = document.querySelector(`input[name="base-layer"][value="${initialLayer.id}"]`);
                if (radio) radio.checked = true;
            }
            let wasEmptyLayerSelected = document.getElementById('layer-empty').checked;
            baseLayerRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.checked) {
                        const layerId = this.value;
                        console.log('Выбран базовый слой:', layerId);
                        if (wasEmptyLayerSelected && layerId !== 'empty') {
                            console.log('Переключение с пустого слоя - удаляем все изображения');
                            if (typeof ImagesModule !== 'undefined' && ImagesModule.removeAllImages) {
                                ImagesModule.removeAllImages();
                            }
                        }
                        wasEmptyLayerSelected = (layerId === 'empty');
                        MapModule.setBaseLayer(layerId);
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
    
    function setupBackgroundColorControls() {
        const applyColorButton = document.getElementById('apply-bg-color');
        const colorPicker = document.getElementById('bg-color');
        if (applyColorButton && colorPicker) {
            const savedColor = localStorage.getItem('emptyLayerBgColor');
            if (savedColor) {
                colorPicker.value = savedColor;
                console.log('[DEBUG] Восстановлен сохраненный цвет фона:', savedColor);
            }
            applyColorButton.addEventListener('click', function() {
                const selectedColor = colorPicker.value;
                console.log('[DEBUG] Применяем новый цвет фона:', selectedColor);
                const emptyLayerRadio = document.getElementById('layer-empty');
                if (emptyLayerRadio && emptyLayerRadio.checked) {
                    applyBackgroundColor(selectedColor);
                } else {
                    if (confirm('Для применения цвета необходимо переключиться на пустой слой. Переключить?')) {
                        emptyLayerRadio.checked = true;
                        MapModule.setBaseLayer('empty');
                        setTimeout(() => {
                            applyBackgroundColor(selectedColor);
                        }, 100);
                    }
                }
            });
            colorPicker.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    applyColorButton.click();
                    event.preventDefault();
                }
            });
        }
    }
    
    function applyBackgroundColor(color) {
        document.body.classList.add('adjusting-settings');
        try {
            if (typeof MapModule !== 'undefined' && MapModule.setBackgroundColor) {
                const result = MapModule.setBackgroundColor(color);
                if (result) {
                    console.log('[DEBUG] Цвет фона успешно изменен на:', color);
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
            setTimeout(() => {
                document.body.classList.remove('adjusting-settings');
            }, 500);
        }
    }
    
    function adjustMapHeight() {
        const controlPanel = document.getElementById('control-panel');
        const mapContainer = document.querySelector('.map-container');
        if (controlPanel && mapContainer) {
            const isCollapsed = controlPanel.classList.contains('collapsed');
            const panelHeight = isCollapsed 
                ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panel-collapsed-height'))
                : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panel-height'));
            mapContainer.style.height = `calc(100% - ${panelHeight}px)`;
            if (typeof MapModule !== 'undefined' && MapModule.updateSize) {
                MapModule.updateSize();
            }
        }
    }
    
    function setupValueEditing() {
        console.log('[DEBUG] Настройка редактирования значений через клавиатуру');
        const valueSpans = [
            document.getElementById('brightness-value'),
            document.getElementById('contrast-value'),
            document.getElementById('saturation-value'),
            document.getElementById('brightness2-value'),
            document.getElementById('contrast2-value'),
            document.getElementById('saturation2-value')
        ];
        valueSpans.forEach(span => {
            if (span) {
                span.addEventListener('click', function() {
                    createInputForValueSpan(span);
                });
            }
        });
    }
    
    function createInputForValueSpan(span) {
        if (!span) return;
        const sliderId = span.id.replace('-value', '');
        const slider = document.getElementById(sliderId);
        if (!slider) {
            console.warn(`[WARN] Не найден слайдер для ${span.id}`);
            return;
        }
        const currentValue = parseFloat(span.textContent);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step);
        span.style.display = 'none';
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue;
        input.min = min;
        input.max = max;
        input.step = step;
        span.parentNode.insertBefore(input, span.nextSibling);
        input.focus();
        input.select();
        input.addEventListener('input', function() {
            let newValue = parseFloat(this.value);
            if (!isNaN(newValue)) {
                if (newValue < min) newValue = min;
                if (newValue > max) newValue = max;
                slider.value = newValue;
                const event = new Event('input', { bubbles: true });
                slider.dispatchEvent(event);
            }
        });
        function finishEditing() {
            let finalValue = parseFloat(input.value);
            if (isNaN(finalValue)) {
                finalValue = currentValue;
            } else {
                if (finalValue < min) finalValue = min;
                if (finalValue > max) finalValue = max;
            }
            finalValue = Math.round(finalValue * 10) / 10;
            slider.value = finalValue;
            span.textContent = finalValue.toFixed(1);
            input.remove();
            span.style.display = 'inline-block';
            const event = new Event('input', { bubbles: true });
            slider.dispatchEvent(event);
        }
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                finishEditing();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                span.style.display = 'inline-block';
                input.remove();
                e.preventDefault();
            }
        });
    }
    
    return {
        init: init,
        resetImageSettings: resetImageSettings,
        updateSliderValueDisplay: updateSliderValueDisplay,
        adjustMapHeight: adjustMapHeight,
        applyBackgroundColor: applyBackgroundColor,
        updateSecondImageRenderParams: updateSecondImageRenderParams
    };
})(); 