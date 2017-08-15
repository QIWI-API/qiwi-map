#  JS приложение карты терминалов QIWI
Приложение позволяет установить месторасположение партнерских термниалов и терминалов QIWI

<img src="https://developer.qiwi.com/qiwi-map/images/qiwi-map.png"/>

### Сборка приложения 
~~~shell
git clone https://github.com/QIWI-API/qiwi-map-application.git
cd qiwi-map
npm install
npm run build
~~~

В результате сборки будет создан каталог dist со статическим содержимым приложения. 

## Запуск приложения
Приложение является набором статических файлов исполняемых на клиенте. 
Достаточно разместить содержимое каталога на сервере и добавить путь до файла index.html.  

### Пример использования
~~~html
<iframe src="https://www.your-site.com/path-to-map-index" width="100%" height="780" style="border:none;"></iframe>
~~~

## Документация
- [**API Карты терминалов QIWI**](https://developer.qiwi.com/qiwi-map/qiwi-map_ru.html): Описание API для установки местонахождения терминалов QIWI на территории РФ

 
