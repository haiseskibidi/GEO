const App = (function() {
    function init() {
        console.log('Инициализация приложения...');
        
        MapModule.init();
        ControlsModule.init();
        setupDefaultDates();
        
        console.log('Приложение инициализировано');
    }
    
    function setupDefaultDates() {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        document.getElementById('date-from').value = formatDate(oneMonthAgo);
        document.getElementById('date-to').value = formatDate(today);
    }
    
    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});