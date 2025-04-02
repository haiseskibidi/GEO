/**
 * Файл конфигурации геопортала
 */
const config = {
    /**
     * Настройки карты
     */
    map: {
        center: [134.0, 44.6], // Центр Приморского края
        zoom: 7,
        minZoom: 5,
        maxZoom: 18,
        projection: 'EPSG:3857', // Web Mercator
        // Границы Приморского края (примерные)
        extent: [130.4, 42.3, 139.0, 48.5] // [мин. долгота, мин. широта, макс. долгота, макс. широта]
    },
    
    /**
     * Базовые слои карты
     */
    baseLayers: [
        {
            id: 'osm',
            name: 'OpenStreetMap',
            visible: false, // По умолчанию не активен
            type: 'tile',
            source: 'osm'
        },
        {
            id: 'satellite',
            name: 'Спутник',
            visible: true, // Спутниковый вид по умолчанию
            type: 'tile',
            source: 'satellite'
        }
    ],
    
    /**
     * API и сервисы
     */
    services: {
        // В демо версии используем локальные файлы вместо реального API
        imagesAPI: 'data/images.json'
    },
    
    /**
     * Настройки тестовых изображений
     */
    images: {
        // Базовый URL для тестовых изображений
        baseUrl: 'data/',
        thumbnailsUrl: 'data/thumbnails/'
    },
    
    /**
     * Допустимые расширения файлов изображений
     */
    validExtensions: ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.jp2'],
    
    /**
     * Настройки интерфейса
     */
    ui: {
        // Максимальное количество изображений на странице
        maxImagesPerPage: 10,
        
        // Режимы отображения
        displayModes: [
            {id: 'single', name: 'Одиночное изображение'},
            {id: 'swipe', name: 'Сравнение (шторка)'},
            {id: 'opacity', name: 'Сравнение (прозрачность)'}
        ],
        
        // Показывать предупреждение о тестовых данных
        showTestDataWarning: true
    },
    
    /**
     * Режимы рендеринга для спутниковых изображений
     */
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
    
    /**
     * Дополнительные параметры для отладки
     */
    debug: {
        enabled: true,
        logLevel: 'info' // 'info', 'warning', 'error', 'debug'
    }
};

// Экспорт объекта конфигурации
if (typeof module !== 'undefined') {
    module.exports = config;
} 