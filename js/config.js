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
        maxImagesPerPage: 10,
        
        displayModes: [
            {id: 'single', name: 'Одиночное изображение'},
            {id: 'swipe', name: 'Сравнение (шторка)'},
            {id: 'opacity', name: 'Сравнение (прозрачность)'}
        ],
        
        showTestDataWarning: true
    },
    
    renderModes: [
        {
            id: 'natural',
            name: 'Естественный цвет',
            description: 'Отображение в естественных цветах (RGB)',
            filters: {
                brightness: 0,
                contrast: 1,
                saturation: 1
            }
        },
        {
            id: 'color_ir',
            name: 'Цветной ИК',
            description: 'Цветное инфракрасное изображение - подчеркивает растительность',
            filters: {
                brightness: 0,
                contrast: 1.1,
                saturation: 1.5,
                hue: 30
            }
        },
        {
            id: 'short_wave_ir',
            name: 'Коротковолновый ИК',
            description: 'Коротковолновый инфракрасный диапазон - полезен для геологии',
            filters: {
                brightness: 0.1,
                contrast: 1.2,
                saturation: 0.8,
                hue: -30
            }
        },
        {
            id: 'agriculture',
            name: 'Сельское хозяйство',
            description: 'Подчеркивает различия в сельскохозяйственных культурах',
            filters: {
                brightness: 0.2,
                contrast: 1.3,
                saturation: 1.6,
                hue: 60
            }
        },
        {
            id: 'urban',
            name: 'Городская среда',
            description: 'Подчеркивает городскую застройку',
            filters: {
                brightness: 0.1,
                contrast: 1.1,
                saturation: 1.2,
                hue: -10
            }
        },
        {
            id: 'ndvi',
            name: 'Индекс вегетации (NDVI)',
            description: 'Нормализованный разностный вегетационный индекс',
            filters: {
                brightness: 0.2,
                contrast: 1.4,
                saturation: 1.8,
                hue: 120,
                sepia: 0.3
            }
        },
        {
            id: 'temp',
            name: 'Температура поверхности',
            description: 'Визуализация температуры поверхности',
            filters: {
                brightness: 0.1,
                contrast: 1.2,
                saturation: 1.5,
                hue: -120,
                sepia: 0.4
            }
        }
    ],
    
    debug: {
        enabled: true,
        logLevel: 'info'
    }
};

// Флаг успешной загрузки конфигурации
window.configLoaded = true;
console.log('[DEBUG] Конфигурация успешно загружена');

if (typeof module !== 'undefined') {
    module.exports = config;
}