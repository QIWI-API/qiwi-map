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

        if(!this._filters.qiwiTerminals) {
            params.ttpId = 19;
        }
        if(!this._filters.partnersTerminals) {
            params.ttpId = 4;
        }

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

        const self = this;

        const coords = [point.coordinate['latitude'], point.coordinate['longitude']];

        const { terminalId, ttpId, address, count } = point;

        let pointData = {};

        let pointOptions = {};

        let placemark = {};


        if(count > 1) {

            const iconContentLayout = ymaps.templateLayoutFactory.createClass('<div class="terminal-cluster">{{properties.terminalNumber}}</div>');

            pointOptions = {
                iconLayout: 'default#imageWithContent',
                // Своё изображение иконки метки.
                iconImageHref: clusterIcon,
                // Размеры метки.
                iconImageSize: [40, 40],
                // Смещение левого верхнего угла иконки относительно
                // её "ножки" (точки привязки).
                iconImageOffset: [-20, -20],
                iconContentOffset: [0, 12],
                iconContentLayout
            }

            if(count>100) {
                pointOptions.iconImageSize = [50, 50];
                pointOptions.iconImageOffset = [-25, -25];
                pointOptions.iconContentOffset = [5, 17];
            }

            let terminalNumber = count;

            if ((count/10000) >= 1) {
                terminalNumber = Math.round(count/1000)+'т';
            }

            pointData = {
                terminalNumber

            };

            if(this._mapInstance.getZoom() > 18) {

                let terminalRelation = 'Терминал QIWI';

                if(ttpId === 19) {
                    terminalRelation = 'Терминал партнеров';
                }


                pointData.balloonContentHeader = `<h2 class="terminal-type"><span class="terminal-type_bullet">&#9679;</span>${terminalRelation}<span class="terminal-id">ID-${terminalId}</span></h2>`;

                pointData.balloonContentBody = `<p class="terminal-adress">${address}</p><p class="terminal-more">и ещё ${count - 1}</p>`;
            }



            placemark = new ymaps.Placemark( coords, pointData, pointOptions);

            if(this._mapInstance.getZoom() < 19) {

                placemark.events.add('click', (e) => {

                    console.log(this._mapInstance.getZoom())

                    e.preventDefault();

                    const coords = e.get('target').geometry.getCoordinates();

                    self._mapInstance.geoObjects.removeAll();

                    self._mapInstance.panTo(coords).then(() => {

                        let mapZoom = self._mapInstance.getZoom();

                        self._mapParams.zoom = mapZoom < 19? mapZoom+1 :self._mapParams.zoom;
                        self._mapInstance.setZoom(self._mapParams.zoom);

                    });
                });
            }

        } else {

            pointOptions = {
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

            let terminalRelation = 'Терминал QIWI';

            if(ttpId === 19) {
                terminalRelation = 'Терминал партнеров';
                pointOptions.iconImageHref = partnersTerminalPlacemark;
            }

            pointData = {
                balloonContentHeader: `<h2 class="terminal-type"><span class="terminal-type_bullet">&#9679;</span>${terminalRelation}<span class="terminal-id">ID-${terminalId}</span></h2>`,
                balloonContentBody: `<p class="terminal-adress">${address}</p>`
            }

            placemark = new ymaps.Placemark( coords, pointData, pointOptions);

        }



        return placemark;
    }

    buildClusters(points = this._points) {

        const self = this;

        if (!points.length) {
            return;
        }

        this._mapInstance.geoObjects.removeAll();

        const placemarks = points.forEach((point, index)=>{

            const placemark = this._makePlacemark(point);

            this._mapInstance.geoObjects.add(placemark);

        });

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

    async getAndBuild () {
        try {
            await this.getCluster();


        } catch (err) {
            console.log(err);

        }

        this.buildClusters();
    }

    _moveMapHandler () {

        const newBounds = this._mapInstance.getBounds();


        /*if((newBounds[0][0]<this._bounds[0][0] && newBounds[0][1]<this._bounds[0][1]) || (newBounds[1][0]>this._bounds[1][0] && newBounds[1][1]>this._bounds[1][1])) {*/

        this.getAndBuild();
       /* }*/

    }

}