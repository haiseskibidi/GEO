#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Скрипт для генерации тестовых спутниковых снимков и их миниатюр.
Используется для разработки и тестирования геопортала мониторинга изменений.
"""

import os
import sys
import random
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from datetime import datetime, timedelta

# Пути к директориям
DATA_DIR = os.path.join("..", "data")
THUMBNAILS_DIR = os.path.join("..", "img", "thumbnails")

# Создаем директории, если они не существуют
for dir_path in [DATA_DIR, THUMBNAILS_DIR]:
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
        print(f"Создана директория: {dir_path}")

# Параметры генерации
NUM_IMAGES = 4
BASE_IMAGE_SIZE = (800, 800)
THUMBNAIL_SIZE = (200, 200)
START_DATE = datetime.now() - timedelta(days=120)


def generate_random_color():
    """Генерирует случайный цвет для земли."""
    # Оттенки зеленого и коричневого для имитации земли
    r = random.randint(50, 150)
    g = random.randint(100, 200)
    b = random.randint(50, 100)
    return (r, g, b)


def generate_random_water_color():
    """Генерирует случайный цвет для воды."""
    # Оттенки синего для имитации воды
    r = random.randint(0, 50)
    g = random.randint(50, 150)
    b = random.randint(150, 255)
    return (r, g, b)


def draw_text_on_image(img, text, position=(10, 10), size=20):
    """Добавляет текст на изображение."""
    draw = ImageDraw.Draw(img)
    try:
        # Пробуем найти системный шрифт
        font = ImageFont.truetype("arial.ttf", size)
    except IOError:
        # Если не удалось, используем стандартный шрифт
        font = ImageFont.load_default()
    
    draw.text(position, text, fill=(255, 255, 255), font=font)
    return img


def generate_land_water_image(size, land_color, water_color, complexity=5):
    """Генерирует изображение с землей и водой."""
    img = Image.new('RGB', size, land_color)
    draw = ImageDraw.Draw(img)
    
    # Создаем случайную береговую линию
    width, height = size
    points = []
    
    # Начальная и конечная точки на левой и правой сторонах
    start_y = random.randint(height // 4, height * 3 // 4)
    end_y = random.randint(height // 4, height * 3 // 4)
    
    points.append((0, start_y))
    
    # Создаем промежуточные точки
    num_points = random.randint(complexity, complexity * 2)
    for i in range(num_points):
        x = int(width * (i + 1) / (num_points + 1))
        y_variation = random.randint(-height // 4, height // 4)
        y = int(start_y + (end_y - start_y) * (i + 1) / (num_points + 1) + y_variation)
        y = max(0, min(height, y))  # Ограничиваем в пределах изображения
        points.append((x, y))
    
    points.append((width, end_y))
    
    # Замыкаем полигон
    points.append((width, height))
    points.append((0, height))
    
    # Рисуем водную часть
    draw.polygon(points, fill=water_color)
    
    return img


def add_vegetation_and_clouds(img, date_index):
    """Добавляет растительность и облака на изображение в зависимости от сезона."""
    width, height = img.size
    draw = ImageDraw.Draw(img)
    pixels = img.load()
    
    # Параметры в зависимости от сезона (индекса даты)
    vegetation_density = 0.2 + 0.6 * (1 - (date_index / NUM_IMAGES))  # Больше растительности весной-летом
    cloud_coverage = 0.1 + 0.3 * random.random()  # Случайное облачное покрытие
    
    # Добавляем растительность (зеленые точки) на сушу
    for x in range(width):
        for y in range(height):
            if random.random() < 0.05 * vegetation_density:  # 5% шанс с учетом сезона
                r, g, b = pixels[x, y]
                if g > r and g > b:  # Это суша (где зеленый компонент выше)
                    # Усиливаем зеленый компонент для имитации растительности
                    new_color = (
                        max(0, r - random.randint(10, 30)),
                        min(255, g + random.randint(20, 50)),
                        max(0, b - random.randint(10, 20))
                    )
                    img.putpixel((x, y), new_color)
    
    # Добавляем облака (белые овалы)
    num_clouds = int(10 * cloud_coverage)
    for _ in range(num_clouds):
        cloud_x = random.randint(0, width)
        cloud_y = random.randint(0, height // 3)  # Облака в основном в верхней трети
        cloud_width = random.randint(width // 10, width // 3)
        cloud_height = random.randint(height // 20, height // 8)
        
        # Рисуем белый полупрозрачный овал
        for dx in range(-cloud_width, cloud_width):
            for dy in range(-cloud_height, cloud_height):
                x, y = cloud_x + dx, cloud_y + dy
                if 0 <= x < width and 0 <= y < height:
                    # Эллиптическая форма
                    if (dx/cloud_width)**2 + (dy/cloud_height)**2 <= 1:
                        # Определяем прозрачность облака (центр более плотный)
                        distance = ((dx/cloud_width)**2 + (dy/cloud_height)**2)**0.5
                        opacity = max(0, min(150, int(150 * (1 - distance))))
                        
                        r, g, b = pixels[x, y]
                        # Смешиваем с белым цветом с учетом прозрачности
                        r = r + (opacity * (255 - r)) // 255
                        g = g + (opacity * (255 - g)) // 255
                        b = b + (opacity * (255 - b)) // 255
                        
                        img.putpixel((x, y), (r, g, b))
    
    return img


def create_time_series_changes(base_image, num_images):
    """Создает серию изображений с изменениями для имитации временного ряда."""
    images = []
    
    # Базовое изображение
    images.append(base_image)
    
    # Создаем модификации для остальных изображений
    for i in range(1, num_images):
        # Копируем предыдущее изображение
        new_img = images[i-1].copy()
        
        # Изменяем цвета и контраст
        enhancer = ImageEnhance.Color(new_img)
        color_factor = 0.8 + 0.4 * random.random()  # Случайное изменение насыщенности
        new_img = enhancer.enhance(color_factor)
        
        enhancer = ImageEnhance.Contrast(new_img)
        contrast_factor = 0.9 + 0.2 * random.random()  # Случайное изменение контраста
        new_img = enhancer.enhance(contrast_factor)
        
        # Добавляем сезонные изменения
        new_img = add_vegetation_and_clouds(new_img, i)
        
        images.append(new_img)
    
    return images


def generate_and_save_images():
    """Генерирует и сохраняет тестовые изображения и их миниатюры."""
    # Генерируем базовое изображение
    land_color = generate_random_color()
    water_color = generate_random_water_color()
    base_image = generate_land_water_image(BASE_IMAGE_SIZE, land_color, water_color)
    
    # Создаем серию изображений
    images = create_time_series_changes(base_image, NUM_IMAGES)
    
    # Сохраняем изображения и создаем миниатюры
    for i, img in enumerate(images):
        # Дата для изображения (от старых к новым)
        image_date = START_DATE + timedelta(days=30 * i)
        date_str = image_date.strftime("%Y-%m-%d")
        
        # Добавляем дату на изображение
        img_with_text = draw_text_on_image(img.copy(), f"Дата: {date_str}", (20, 20), 30)
        
        # Сохраняем основное изображение
        image_filename = f"sample_image_{i+1}.jpg"
        image_path = os.path.join(DATA_DIR, image_filename)
        img_with_text.save(image_path, quality=95)
        print(f"Сохранено изображение: {image_path}")
        
        # Создаем и сохраняем миниатюру
        thumbnail = img.resize(THUMBNAIL_SIZE, Image.LANCZOS)
        thumbnail_filename = f"sample_{i+1}_thumb.jpg"
        thumbnail_path = os.path.join(THUMBNAILS_DIR, thumbnail_filename)
        thumbnail.save(thumbnail_path, quality=80)
        print(f"Сохранена миниатюра: {thumbnail_path}")


if __name__ == "__main__":
    print("Генерация тестовых изображений...")
    generate_and_save_images()
    print("Генерация завершена.") 