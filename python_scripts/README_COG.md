# Скрипты для работы с геопространственными данными

## Конвертация в формат Cloud Optimized GeoTIFF (COG)

### О формате COG

Cloud Optimized GeoTIFF (COG) - это формат данных, оптимизированный для эффективного доступа через интернет. COG позволяет клиентам запрашивать только необходимые части изображения, что значительно ускоряет работу с большими растровыми данными.

Основные преимущества COG:
- Встроенная пирамида обзоров (overview) для быстрого масштабирования
- Внутренняя плиточная структура для быстрого доступа к конкретным областям
- Поддержка HTTP Range Requests для загрузки только нужных фрагментов
- Совместимость со стандартным форматом GeoTIFF

### Установка зависимостей

Для работы скрипта `convert_to_cog.py` необходимы следующие библиотеки:

```bash
pip install rasterio numpy
```

Также требуется установка GDAL версии 3.1 или выше.

На Windows часто проще установить GDAL и rasterio через [conda](https://anaconda.org/):

```bash
conda create -n geoenv python=3.9
conda activate geoenv
conda install -c conda-forge gdal rasterio numpy
```

### Использование скрипта convert_to_cog.py

#### Конвертация одного файла

```bash
python convert_to_cog.py -i входной_файл.tif -o выходной_файл.tif
```

#### Пакетная обработка директории

```bash
python convert_to_cog.py -d входная_директория -o выходная_директория
```

#### Параметры скрипта

| Параметр | Описание |
|----------|----------|
| `-i, --input` | Путь к входному файлу |
| `-d, --directory` | Путь к директории с входными файлами |
| `-o, --output` | Путь к выходному файлу или директории |
| `-c, --compression` | Алгоритм сжатия: DEFLATE (по умолчанию), LZW, ZSTD, JPEG, WEBP, NONE |
| `-b, --blocksize` | Размер блока данных (плитки), по умолчанию 256 |
| `-r, --resampling` | Метод интерполяции: nearest, bilinear, cubic, lanczos |
| `-p, --predictor` | Предиктор для сжатия без потерь (1-3), по умолчанию 2 |
| `-q, --quality` | Качество для сжатия с потерями (JPEG, WEBP) |
| `--crs` | Целевая система координат (например, EPSG:4326) |
| `--pattern` | Шаблон для выбора файлов при пакетной обработке (по умолчанию *.tif) |
| `-v, --verbose` | Подробный вывод |

#### Примеры использования

1. Конвертация с перепроецированием в WGS 84:
```bash
python convert_to_cog.py -i input.tif -o output.tif --crs EPSG:4326
```

2. Использование сжатия JPEG с качеством 85%:
```bash
python convert_to_cog.py -i input.tif -o output.tif -c JPEG -q 85
```

3. Пакетная обработка всех GeoTIFF файлов с использованием ZSTD сжатия:
```bash
python convert_to_cog.py -d input_dir -o output_dir -c ZSTD --pattern "*.tiff"
```

4. Настройка размера плиток:
```bash
python convert_to_cog.py -i input.tif -o output.tif -b 512
```

### Проверка валидности COG

Для проверки, является ли файл действительно Cloud Optimized GeoTIFF, можно воспользоваться [инструментом валидации](https://github.com/cogeotiff/rio-cogeo):

```bash
pip install rio-cogeo
rio cogeo validate output.tif
``` 