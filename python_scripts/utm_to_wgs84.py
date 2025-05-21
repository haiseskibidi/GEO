"""
Скрипт для преобразования координат из UTM в WGS84 (широта/долгота)
"""

from osgeo import osr

def utm_to_wgs84(x, y, zone=52, northern=True):
    """
    Преобразует координаты из UTM в WGS84 (широта/долгота)
    
    Args:
        x: UTM координата X (восток)
        y: UTM координата Y (север)
        zone: Номер зоны UTM (по умолчанию 52 для Владивостока)
        northern: Флаг северного полушария (True) или южного (False)
    
    Returns:
        (lon, lat): Кортеж (долгота, широта) в WGS84
    """
    # Создаем систему координат UTM
    utm = osr.SpatialReference()
    utm.SetWellKnownGeogCS("WGS84")
    utm.SetUTM(zone, northern)
    
    # Создаем систему координат WGS84
    wgs84 = osr.SpatialReference()
    wgs84.SetWellKnownGeogCS("WGS84")
    
    # Создаем преобразование
    transform = osr.CoordinateTransformation(utm, wgs84)
    
    # Преобразуем координаты
    lon, lat, _ = transform.TransformPoint(x, y)
    
    return lon, lat

if __name__ == "__main__":
    # Координаты углов снимков из результатов скрипта get_geotiff_info.py
    
    # 1. Sentinel 05.01.2020 (T52TGP)
    print("1. Sentinel 05.01.2020 (T52TGP)")
    minx, miny = 699960.0, 4790220.0
    maxx, maxy = 809760.0, 4900020.0
    
    sw = utm_to_wgs84(minx, miny)  # Юго-западный угол
    ne = utm_to_wgs84(maxx, maxy)  # Северо-восточный угол
    print(f"[{sw[0]}, {sw[1]}, {ne[0]}, {ne[1]}] // minLon, minLat, maxLon, maxLat")
    
    # 2. Sentinel 05.01.2020 (T52TGN)
    print("\n2. Sentinel 05.01.2020 (T52TGN)")
    minx, miny = 692160.0, 4682480.0
    maxx, maxy = 817560.0, 4807870.0
    
    sw = utm_to_wgs84(minx, miny)
    ne = utm_to_wgs84(maxx, maxy)
    print(f"[{sw[0]}, {sw[1]}, {ne[0]}, {ne[1]}] // minLon, minLat, maxLon, maxLat")
    
    # 3. Sentinel 14.04.2020 (T52TGP)
    print("\n3. Sentinel 14.04.2020 (T52TGP)")
    minx, miny = 692030.0, 4782370.0
    maxx, maxy = 817690.0, 4908020.0
    
    sw = utm_to_wgs84(minx, miny)
    ne = utm_to_wgs84(maxx, maxy)
    print(f"[{sw[0]}, {sw[1]}, {ne[0]}, {ne[1]}] // minLon, minLat, maxLon, maxLat")
    
    # 4. Канопус-В (SCN03)
    print("\n4. Канопус-В (SCN03)")
    minx, miny = 716661.6922348483, 4783163.539053065
    maxx, maxy = 741357.6922348483, 4808605.039053065
    
    sw = utm_to_wgs84(minx, miny)
    ne = utm_to_wgs84(maxx, maxy)
    print(f"[{sw[0]}, {sw[1]}, {ne[0]}, {ne[1]}] // minLon, minLat, maxLon, maxLat")
    
    # 5. Канопус-В (SCN04)
    print("\n5. Канопус-В (SCN04)")
    minx, miny = 711461.115465729, 4802439.723376258
    maxx, maxy = 736136.115465729, 4827881.223376258
    
    sw = utm_to_wgs84(minx, miny)
    ne = utm_to_wgs84(maxx, maxy)
    print(f"[{sw[0]}, {sw[1]}, {ne[0]}, {ne[1]}] // minLon, minLat, maxLon, maxLat") 