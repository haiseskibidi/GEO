const config = {
    map: {
        center: [134.0, 44.6],
        zoom: 7,
        minZoom: 5,
        maxZoom: 18,
        projection: 'EPSG:3857',
        extent: [130.4, 42.3, 139.0, 48.5]
    },
    
    baseLayers: [
        {
            id: 'osm',
            name: 'OpenStreetMap',
            visible: false,
            type: 'tile',
            source: 'osm'
        },
        {
            id: 'satellite',
            name: 'Спутник',
            visible: true,
            type: 'tile',
            source: 'satellite'
        },
        {
            id: 'empty',
            name: 'Пустой слой',
            visible: false,
            type: 'tile',
            source: 'empty',
        }
    ],
    
    services: {
        imagesAPI: 'data/images.json'
    },
    
    images: {
        baseUrl: 'data/'
    },
    
    validExtensions: ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.jp2'],
    
    ui: {
        maxImagesPerPage: 100,
        
        displayModes: [
            {id: 'single', name: 'Одиночное изображение'},
            {id: 'swipe', name: 'Сравнение (шторка)'},
            {id: 'opacity', name: 'Сравнение (прозрачность)'}
        ],
        
        showTestDataWarning: true
    },
    
    debug: {
        enabled: true,
        logLevel: 'info'
    }
};

window.configLoaded = true;
console.log('[DEBUG] Конфигурация успешно загружена');

if (typeof module !== 'undefined') {
    module.exports = config;
}