import os
import sys
import argparse
import logging
from pathlib import Path
import tempfile
import shutil

try:
    import rasterio
    from rasterio.io import MemoryFile
    from rasterio.enums import Resampling
    from rasterio.warp import calculate_default_transform, reproject
    import numpy as np
except ImportError:
    print("Необходимо установить зависимости: pip install rasterio numpy")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("convert_to_cog")

def validate_inputs(input_path, output_path):
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Входной файл не найден: {input_path}")
    
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        logger.info(f"Создание выходной директории: {output_dir}")
        os.makedirs(output_dir, exist_ok=True)

def reproject_raster(src_path, dst_path, dst_crs=None):
    with rasterio.open(src_path) as src:
        src_crs = src.crs
        
        if dst_crs is None or src_crs == dst_crs:
            logger.info(f"Перепроецирование не требуется, копирование файла")
            shutil.copy(src_path, dst_path)
            return
        
        transform, width, height = calculate_default_transform(
            src_crs, dst_crs, src.width, src.height, *src.bounds)
        
        kwargs = src.meta.copy()
        kwargs.update({
            'crs': dst_crs,
            'transform': transform,
            'width': width,
            'height': height
        })
        
        with rasterio.open(dst_path, 'w', **kwargs) as dst:
            for i in range(1, src.count + 1):
                data = src.read(i)
                
                reproject(
                    source=data,
                    destination=np.zeros((height, width), dtype=kwargs['dtype']),
                    src_transform=src.transform,
                    src_crs=src_crs,
                    dst_transform=transform,
                    dst_crs=dst_crs,
                    resampling=Resampling.nearest
                )[0]
                
                dst.write(data, i)
        
        logger.info(f"Перепроецирование в {dst_crs} завершено")

def convert_to_cog(input_path, output_path, compression='DEFLATE', 
                  resampling='nearest', blocksize=256, overview_levels=None, 
                  overview_resampling='nearest', predictor=2, quality=None, 
                  crs=None):
    validate_inputs(input_path, output_path)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        temp_file = os.path.join(tmpdir, 'reprojected.tif')
        
        if crs:
            reproject_raster(input_path, temp_file, crs)
            input_raster = temp_file
        else:
            input_raster = input_path
        
        logger.info(f"Преобразование {input_raster} в Cloud Optimized GeoTIFF")
        
        with rasterio.open(input_raster) as src:
            if overview_levels is None:
                max_dimension = max(src.width, src.height)
                overview_levels = []
                factor = 2
                while max_dimension // factor >= 256:
                    overview_levels.append(factor)
                    factor *= 2
            
            logger.info(f"Будут созданы уровни обзора: {overview_levels}")
            
            cog_profile = {
                'driver': 'GTiff',
                'blockxsize': blocksize,
                'blockysize': blocksize,
                'compress': compression,
                'predictor': predictor,
                'tiled': True,
                'copy_src_overviews': False,
                'photometric': 'MINISBLACK' if src.count == 1 else 'RGB',
                'interleave': 'PIXEL',
            }
            
            if compression in ['JPEG', 'WEBP'] and quality is not None:
                cog_profile['quality'] = quality
            
            cog_profile.update({
                'count': src.count,
                'dtype': src.dtypes[0],
                'crs': src.crs,
                'transform': src.transform,
                'width': src.width,
                'height': src.height,
                'nodata': src.nodata
            })
            
            with MemoryFile() as memfile:
                with memfile.open(**cog_profile) as tmp:
                    tmp.write(src.read())
                    
                    resampling_method = getattr(Resampling, overview_resampling)
                    tmp.build_overviews(overview_levels, resampling_method)
                
                cog_translate_args = {
                    'dst_path': output_path,
                    'src_path': memfile,
                    'driver': 'GTiff',
                    'blocksize': blocksize,
                    'compress': compression,
                    'predictor': predictor
                }
                
                if compression in ['JPEG', 'WEBP'] and quality is not None:
                    cog_translate_args['quality'] = quality
                
                with memfile.open() as src:
                    with rasterio.open(output_path, 'w', **cog_profile) as dst:
                        dst.write(src.read())
                        if src.mask_flag_enums[0] != rasterio.enums.MaskFlags.all_valid:
                            dst.write_mask(src.dataset_mask())
    
    logger.info(f"Преобразование завершено: {output_path}")
    return output_path

def batch_process(input_dir, output_dir, pattern="*.tif", **kwargs):
    input_path = Path(input_dir)
    files = list(input_path.glob(pattern))
    
    if not files:
        logger.warning(f"Файлы не найдены в {input_dir} по шаблону {pattern}")
        return
    
    logger.info(f"Найдено {len(files)} файлов для обработки")
    
    os.makedirs(output_dir, exist_ok=True)
    
    for file in files:
        rel_path = file.relative_to(input_path)
        output_file = Path(output_dir) / rel_path
        output_file = output_file.with_suffix('.tif')
        
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            convert_to_cog(str(file), str(output_file), **kwargs)
        except Exception as e:
            logger.error(f"Ошибка при обработке {file}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Преобразование растров в формат Cloud Optimized GeoTIFF")
    
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('-i', '--input', help="Путь к входному файлу")
    input_group.add_argument('-d', '--directory', help="Путь к директории с входными файлами")
    
    parser.add_argument('-o', '--output', help="Путь к выходному файлу или директории", required=True)
    parser.add_argument('-c', '--compression', default='DEFLATE', 
                        choices=['DEFLATE', 'LZW', 'ZSTD', 'JPEG', 'WEBP', 'NONE'],
                        help="Алгоритм сжатия")
    parser.add_argument('-b', '--blocksize', type=int, default=256, 
                        help="Размер блока данных (плитки)")
    parser.add_argument('-r', '--resampling', default='nearest',
                        choices=['nearest', 'bilinear', 'cubic', 'lanczos'],
                        help="Метод интерполяции")
    parser.add_argument('-p', '--predictor', type=int, default=2,
                        help="Предиктор для сжатия без потерь")
    parser.add_argument('-q', '--quality', type=int, 
                        help="Качество для сжатия с потерями (JPEG, WEBP)")
    parser.add_argument('--crs', help="Целевая система координат (напр. EPSG:4326)")
    parser.add_argument('--pattern', default="*.tif", 
                        help="Шаблон для выбора файлов при пакетной обработке")
    parser.add_argument('-v', '--verbose', action='store_true',
                        help="Подробный вывод")
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    kwargs = {
        'compression': args.compression,
        'blocksize': args.blocksize,
        'resampling': args.resampling,
        'predictor': args.predictor,
        'quality': args.quality,
        'crs': args.crs
    }
    
    try:
        if args.input:
            convert_to_cog(args.input, args.output, **kwargs)
        else:
            batch_process(args.directory, args.output, pattern=args.pattern, **kwargs)
        
        logger.info("Обработка завершена успешно")
    
    except Exception as e:
        logger.error(f"Ошибка при выполнении: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 