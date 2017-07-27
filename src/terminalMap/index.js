import './terminalMap.css';

import {script} from '../utils';


import clusterIcon from '../assets/cluster-icon.svg';

import qiwiTerminalPlacemark from '../assets/qiwi-terminal-placemark.svg';
import partnersTerminalPlacemark from '../assets/partners-terminal-placemark.svg';


export default class terminalMap {
    constructor(defaultMapParams) {

        this._mapParams = defaultMapParams;
        this._mapInstance = {};
        this._points = [];
        this._clusterer = {};

        this._filters = {
            qiwiTerminals: true,
            partnersTerminals: true
        };

        this._bounds = [];
    }

    getMap (url) {
        return script(url).then(function(){
            return new Promise( resolve => {
                ymaps.ready(resolve);
            });
        })
    }

    setQiwiTerminalsFilter (flag) {
        this._filters.qiwiTerminals = flag;
    }

    setPartnersTerminalsFilter (flag) {
        this._filters.partnersTerminals = flag;
    }

    getUserLocation () {

        return new Promise((resolve) => {

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((position) => {

                    this._mapParams.center = [position.coords.latitude, position.coords.longitude];

                    if(Object.getOwnPropertyNames(this._mapInstance).length > 0) {
                        this._mapInstance.setCenter(this._mapParams.center);
                    }

                    resolve();

                },resolve);

            } else {
                resolve();
            }
        });
    }

    getCluster () {

        const self = this;

        this._bounds = this._mapInstance.getBounds();

        let params = {
            latNW:this._bounds[1][0],
            latSE:this._bounds[0][0],
            lngNW:this._bounds[0][1],
            lngSE:this._bounds[1][1],
            zoom: this._mapInstance.getZoom()
        };

        let url = new URL('https://edge.qiwi.com/locator/v2/nearest/clusters');

        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        return fetch(url,{
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            self._points = data;
        });
    }

    _makePlacemarks(points) {

        const  getPointData = ({ id, type, address}) => {

            let terminalRelation = 'Терминал QIWI';

            if(type === 19) {
                terminalRelation = 'Терминал партнеров';
            }

            return {
                balloonContentHeader: `<h2 class="terminal-type"><span class="terminal-type_bullet">&#9679;</span>${terminalRelation}<span class="terminal-id">ID-${id}</span></h2>`,
                balloonContentBody: `<p class="terminal-adress">${address}</p>`
            };
        };

        const getPointOptions = (type) => {

            let iconOptions = {
                // Опции.
                // Необходимо указать данный тип макета.
                iconLayout: 'default#image',
                // Своё изображение иконки метки.
                iconImageHref: qiwiTerminalPlacemark,
                // Размеры метки.
                iconImageSize: [46, 53],
                // Смещение левого верхнего угла иконки относительно
                // её "ножки" (точки привязки).
                iconImageOffset: [-23, -54]
            };

            if(type === 19){
                iconOptions.iconImageHref = partnersTerminalPlacemark;
            }

            return iconOptions;
        };

        if(!this._filters.qiwiTerminals) {
            points = points.filter((point)=>{
                return point.ttpId === 19;
            });
        }
        if(!this._filters.partnersTerminals) {
            points = points.filter((point)=>{
                return point.ttpId === 4;
            });
        }

        return points.map((point, index)=>{

            const coords = [point.coordinate['latitude'], point.coordinate['longitude']];

            const data = {
                id: point.terminalId,
                type: point.ttpId,
                address: point.address
            };

            const placemark = new ymaps.Placemark( coords, getPointData(data), getPointOptions(point.ttpId));

            return placemark;
        });

    }

    buildClusters(points = this._points) {

        if (!points.length) {
            return;
        }

        const clusterIcons = [{
            href: clusterIcon,
            size: [40, 40],
           // Отступ, чтобы центр картинки совпадал с центром кластера.
            offset: [-20, -20],
            shape: {
                type: 'Circle',
                coordinates: [0, 0],
                radius: 20
            }
        },{
            href: clusterIcon,
            size: [50, 50],
            offset: [-25, -25],
            shape: {
                type: 'Circle',
                coordinates: [0, 0],
                radius: 25
            }
        }];

        const clusterNumbers = [100];
        //определяем что написать
        const clusterIconContentLayout = ymaps.templateLayoutFactory.createClass(['<div class="terminal-cluster">',
                '{{ properties.terminalNumber }}',
            '</div>'].join(''));


        const customBalloonContentLayout = ymaps.templateLayoutFactory.createClass([
                '<ul class="terminal-list">',
                '{% for geoObject in properties.geoObjects %}',
                    '<li>{{geoObject.properties.balloonContentHeader|raw}}{{geoObject.properties.balloonContentBody|raw}}</li>',
                '{% endfor %}',
                '</ul>'
            ].join(''));


        const clusterer = new ymaps.Clusterer({
            clusterIcons,
            clusterNumbers,
            clusterIconContentLayout,
            clusterBalloonMaxHeight: 200,
            clusterBalloonContentLayout: customBalloonContentLayout,
            groupByCoordinates: false,
            gridSize: 256,
            clusterDisableClickZoom: false,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false
        });


        const geoObjects = this._makePlacemarks(points);


        clusterer.createCluster = function (center, geoObjects) {
            // Создаем метку-кластер с помощью стандартной реализации метода.
            let clusterPlacemark = ymaps.Clusterer.prototype.createCluster.call(this, center, geoObjects);

            const geoObjectsLength = clusterPlacemark.getGeoObjects().length;

            let terminalNumber = 0;

            if ((geoObjectsLength/10000) >= 1) {
                terminalNumber = Math.round(geoObjectsLength/1000)+'т';
            } else {
                terminalNumber = geoObjectsLength;
            }

            clusterPlacemark.properties.set('terminalNumber', terminalNumber);

            return clusterPlacemark;
        };

        clusterer.add(geoObjects);

        this._clusterer = clusterer;

        this._mapInstance.geoObjects.removeAll();

        this._mapInstance.geoObjects.add(this._clusterer);
    }

    initMap (container, {center = this._mapParams.center, zoom = this._mapParams.zoom, ...others}) {

        const options = {center, zoom, ...others};

        let map = new ymaps.Map(container, options);



        this._mapInstance = map;

        return this._mapInstance;
    }

    setHandler () {
        this._mapInstance.events.add('actionend', this._moveMapHandler.bind(this));
    }

    async _moveMapHandler () {

        const newBounds = this._mapInstance.getBounds();


        if((newBounds[0][0]<this._bounds[0][0] && newBounds[0][1]<this._bounds[0][1]) || (newBounds[1][0]>this._bounds[1][0] && newBounds[1][1]>this._bounds[1][1])) {

            try {
                await this.getCluster();
            } catch (err) {
                console.log(err);

            }

            this.buildClusters();

        }

    }

}