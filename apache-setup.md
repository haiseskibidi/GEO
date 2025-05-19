# Настройка Apache для работы с GeoTIFF файлами

## Проблема
При использовании простого веб-сервера на Python (`python -m http.server`) возникают проблемы с обработкой GeoTIFF файлов, поскольку:

1. Не устанавливается правильный MIME-тип для .tif/.tiff файлов
2. Отсутствует поддержка HTTP Range запросов
3. Нет правильной настройки CORS для обработки межсайтовых запросов

## Решение: Использование Apache

### Установка Apache (для Windows)
1. Загрузите и установите Apache HTTP Server от Apache Lounge: https://www.apachelounge.com/download/
2. Распакуйте архив в `C:\Apache24`
3. Откройте командную строку от администратора и выполните:
   ```
   cd C:\Apache24\bin
   httpd.exe -k install
   ```

### Конфигурация Apache

1. Откройте файл `C:\Apache24\conf\httpd.conf` и убедитесь, что следующие модули включены:
   ```
   LoadModule headers_module modules/mod_headers.so
   LoadModule mime_module modules/mod_mime.so
   ```

2. Добавьте в конец файла:
   ```
   # Конфигурация для GeoTIFF файлов
   AddType image/tiff .tif .tiff
   AddType application/geo+tiff .tif .tiff
   
   # Настройка директории с данными
   Alias /geo "C:/полный/путь/к/папке/GEO-main"
   <Directory "C:/полный/путь/к/папке/GEO-main">
       Options Indexes FollowSymLinks
       AllowOverride All
       Require all granted
       
       # Включаем CORS
       Header set Access-Control-Allow-Origin "*"
       Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
       Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Range"
       
       # Разрешаем HTTP Range запросы
       Header set Accept-Ranges "bytes"
   </Directory>
   ```

3. Перезапустите Apache:
   ```
   httpd.exe -k restart
   ```

4. Теперь вы можете открыть приложение по адресу: http://localhost/geo/

## Альтернативное решение: XAMPP

Если у вас есть XAMPP, настройка еще проще:

1. Создайте символическую ссылку внутри htdocs:
   ```
   mklink /D C:\xampp\htdocs\geo C:\путь\к\папке\GEO-main
   ```

2. Создайте файл `.htaccess` в папке GEO-main со следующим содержимым:
   ```
   AddType image/tiff .tif .tiff
   AddType application/geo+tiff .tif .tiff
   
   <IfModule mod_headers.c>
       Header set Access-Control-Allow-Origin "*"
       Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
       Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Range"
       Header set Accept-Ranges "bytes"
   </IfModule>
   ```

3. Перезапустите Apache сервис в XAMPP Control Panel

4. Откройте приложение по адресу: http://localhost/geo/ 