#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Скрипт для извлечения геопространственной информации из файлов GeoTIFF.
Позволяет получить координаты, проекцию и другие метаданные.

Зависимости: GDAL, rasterio

Использование:
    python get_geotiff_info.py <путь_к_файлу.tif>
"""

import os
import sys
import json
import argparse
from osgeo import gdal
from datetime import datetime

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False


def get_info_gdal(tif_path):
    """Получение информации о GeoTIFF с помощью GDAL."""
    if not os.path.exists(tif_path):
        print(f"Ошибка: Файл {tif_path} не существует!")
        return None

    try:
        ds = gdal.Open(tif_path)
        if ds is None:
            print(f"Ошибка: Не удалось открыть файл {tif_path} с помощью GDAL!")
            return None

        # Получаем основные параметры
        width = ds.RasterXSize
        height = ds.RasterYSize
        bands = ds.RasterCount
        
        # Получаем геотрансформацию
        geotransform = ds.GetGeoTransform()
        if geotransform:
            minx = geotransform[0]
            maxy = geotransform[3]
            maxx = minx + geotransform[1] * width
            miny = maxy + geotransform[5] * height
        else:
            minx, miny, maxx, maxy = 0, 0, width, height
            print("Предупреждение: Геотрансформация отсутствует!")
        
        # Получаем проекцию
        projection = ds.GetProjection()
        
        # Получаем метаданные
        metadata = ds.GetMetadata()
        
        # Закрываем датасет
        ds = None
        
        # Формируем результат
        result = {
            "filename": os.path.basename(tif_path),
            "full_path": os.path.abspath(tif_path),
            "dimensions": {
                "width": width,
                "height": height,
                "bands": bands
            },
            "coordinates": {
                "minx": minx,
                "miny": miny,
                "maxx": maxx,
                "maxy": maxy
            },
            "projection": projection,
            "metadata": metadata
        }
        
        return result
    
    except Exception as e:
        print(f"Ошибка при обработке файла с помощью GDAL: {e}")
        return None


def get_info_rasterio(tif_path):
    """Получение информации о GeoTIFF с помощью Rasterio (если доступно)."""
    if not HAS_RASTERIO:
        print("Модуль rasterio не установлен. Используйте: pip install rasterio")
        return None
    
    if not os.path.exists(tif_path):
        print(f"Ошибка: Файл {tif_path} не существует!")
        return None
    
    try:
        with rasterio.open(tif_path) as src:
            # Получаем основные параметры
            bounds = src.bounds
            crs = src.crs.to_string()
            tags = src.tags()
            profile = src.profile
            
            # Формируем результат
            result = {
                "filename": os.path.basename(tif_path),
                "full_path": os.path.abspath(tif_path),
                "dimensions": {
                    "width": src.width,
                    "height": src.height,
                    "bands": src.count
                },
                "coordinates": {
                    "minx": bounds.left,
                    "miny": bounds.bottom,
                    "maxx": bounds.right,
                    "maxy": bounds.top
                },
                "crs": crs,
                "tags": tags,
                "profile": {k: str(v) for k, v in profile.items()}
            }
            
            return result
    
    except Exception as e:
        print(f"Ошибка при обработке файла с помощью Rasterio: {e}")
        return None


def convert_to_json(info):
    """Конвертирует информацию в JSON-формат."""
    if info is None:
        return "{}"
    
    # Преобразуем все нестандартные типы в строки
    def convert_to_serializable(obj):
        if isinstance(obj, (dict, list)):
            return obj
        return str(obj)
    
    # Используем настраиваемый энкодер для обработки нестандартных типов
    return json.dumps(info, default=convert_to_serializable, ensure_ascii=False, indent=2)


def main():
    """Основная функция для запуска из командной строки."""
    parser = argparse.ArgumentParser(description="Получение информации о GeoTIFF файлах")
    parser.add_argument("file_path", help="Путь к GeoTIFF файлу")
    parser.add_argument("--output", "-o", help="Файл для сохранения результата в JSON (необязательно)")
    parser.add_argument("--use-rasterio", action="store_true", help="Использовать Rasterio вместо GDAL")
    args = parser.parse_args()
    
    # Проверка существования файла
    if not os.path.exists(args.file_path):
        print(f"Ошибка: Файл {args.file_path} не существует!")
        return 1
    
    # Получение информации
    if args.use_rasterio and HAS_RASTERIO:
        info = get_info_rasterio(args.file_path)
    else:
        info = get_info_gdal(args.file_path)
    
    if info is None:
        print("Не удалось получить информацию о файле.")
        return 1
    
    # Вывод информации
    json_output = convert_to_json(info)
    
    # Сохранение в файл, если указан
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(json_output)
        print(f"Информация сохранена в файл: {args.output}")
    else:
        print(json_output)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())