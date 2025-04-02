/**
 * Главный модуль приложения
 */
const App = (function() {
    /**
     * Инициализация приложения
     */
    function init() {
        console.log('Инициализация приложения...');
        
        // Инициализация карты
        MapModule.init();
        
        // Инициализация элементов управления
        ControlsModule.init();
        
        // Установка текущей даты в поля поиска
        setupDefaultDates();
        
        // Показываем напоминание о генерации тестовых изображений
        showStartupReminder();
        
        console.log('Приложение инициализировано');
    }
    
    /**
     * Установка значений дат по умолчанию
     */
    function setupDefaultDates() {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        // Форматирование дат в формат YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        document.getElementById('date-from').value = formatDate(oneMonthAgo);
        document.getElementById('date-to').value = formatDate(today);
    }
    
    /**
     * Показывает напоминание о необходимости генерации тестовых изображений
     */
    function showStartupReminder() {
        // Проверка существования тестовых изображений
        const testImage = new Image();
        testImage.onerror = function() {
            const message = `ВАЖНО: Для корректной работы геопортала необходимо сгенерировать тестовые изображения!
            
1. Установите библиотеку Pillow: pip install Pillow
2. Перейдите в папку python_scripts
3. Запустите: python generate_test_images.py

Это создаст тестовые спутниковые снимки для демонстрации работы геопортала.`;

            alert(message);
        };
        
        // Пробуем загрузить первое тестовое изображение
        testImage.src = 'data/sample_image_1.jpg';
    }
    
    // Возвращаем публичный API
    return {
        init: init
    };
})();

// Инициализация приложения после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    App.init();
}); 