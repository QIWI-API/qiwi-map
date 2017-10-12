import './terminalMap.css';

import {script} from '../utils';


import clusterIcon from './assets/cluster-icon.svg';

import qiwiTerminalPlacemark from './assets/qiwi-terminal-placemark.svg';
import partnersTerminalPlacemark from './assets/partners-terminal-placemark.svg';


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

    _makePlacemark(point) {

        const coords = [point.coordinate['latitude'], point.coordinate['longitude']];

        const data = {
            id: point.terminalId,
            type: point.ttpId,
            address: point.address
        };

        let placemark = {};

        if(point.count > 1) {

            let count = point.count;

            let clusterIcons = {
                iconLayout: 'default#image',
                // Своё изображение иконки метки.
                iconImageHref: clusterIcon,
                // Размеры метки.
                iconImageSize: [40, 40],
                // Смещение левого верхнего угла иконки относительно
                // её "ножки" (точки привязки).
                iconImageOffset: [-20, -20]
            };

            if(count>100) {
                clusterIcons.iconImageSize = [50, 50];
                clusterIcons.iconImageOffset = [-25, -25];
            }

            let terminalNumber = 0;

            if ((count/10000) >= 1) {
                terminalNumber = Math.round(count/1000)+'т';
            } else {
                terminalNumber = count;
            }


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

        } else {
            let terminalRelation = 'Терминал QIWI';

            if(type === 19) {
                terminalRelation = 'Терминал партнеров';
            }


        }

        const  getPointData = ({ id, address, terminalRelation }) => {


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


        placemark = new ymaps.Placemark( coords, getPointData(data), getPointOptions(point.ttpId));

        return placemark;
    }

    buildClusters(points = this._points) {

        if (!points.length) {
            return;
        }


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





        /*const geoObjects = this._makePlacemark(points);


       const geoObjectsLength = clusterPlacemark.getGeoObjects().length;



        clusterPlacemark.properties.set('terminalNumber', terminalNumber);*/

        const clusters = points.map((point, index)=>{

            const placemark = this._makePlacemark(point);

            return placemark;
        });

        this._mapInstance.geoObjects.removeAll();

        this._mapInstance.geoObjects.add(clusters);
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