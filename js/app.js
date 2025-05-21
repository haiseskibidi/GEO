const App = (function() {
    function init() {
        console.log('Инициализация приложения...');
        
        MapModule.init();
        ControlsModule.init();
        setupDefaultDates();
        
        console.log('Приложение инициализировано');
    }
    
    function setupDefaultDates() {
        console.log('[DEBUG] Установка дат по умолчанию...');
        
        const today = new Date();
        const startDate = new Date(2015, 0, 1);     
        
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const dateFromElement = document.getElementById('date-from');
        const dateToElement = document.getElementById('date-to');
        
        if (!dateFromElement) {
            console.error('[ERROR] Элемент date-from не найден!');
            return;
        }
        
        if (!dateToElement) {
            console.error('[ERROR] Элемент date-to не найден!');
            return;
        }
        
        dateFromElement.value = formatDate(startDate);
        dateToElement.value = formatDate(today);
        
        console.log('[DEBUG] Даты установлены:', dateFromElement.value, dateToElement.value);
    }
    
    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});