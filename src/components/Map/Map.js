import { html, Component } from 'htm/preact/standalone';
import queryString from 'query-string';

import './styles.css';

import { getCluster } from '../../lib/api';
import getUserLocation from '../../lib/userLocation';
import { loadYmaps } from '../../lib/ymaps';

import clusterIcon from './assets/cluster-icon.svg';

import qiwiTerminalPlacemark from './assets/qiwi-terminal-placemark.svg';
import partnersTerminalPlacemark from './assets/partners-terminal-placemark.svg';

export default class TerminalMap extends Component {
    constructor(props) {
        super(props);

        this.mapContainer = 'map';

        this.mapOptions = props.mapOptions;

        this.mapParams = props.mapParams;

        this.points = [];
        this.bounds = [];

        this.mapInstance = null;
        this.ymaps = null;
    }

    async componentDidMount() {
        try {
            await this.getMap(this.props.mapUrl);

            this.initMap(this.mapContainer, { ...this.mapOptions, ...this.mapParams});

            await this.getUserLocation();

            await this.getCluster(this.props.filterParams);

            this.buildClusters();

            this.setHandler();
        } catch (err) {
            console.warn(err);
        }
    }

    componentWillUpdate(nextProps) {
        if (this.mapInstance) {
            this.getAndBuild(nextProps.filterParams);
        }
    }

    initMap(container, options) {
        this.mapInstance = new this.ymaps.Map(container, options);
    }

    async getMap(url) {
        await loadYmaps(url).then((map) => (this.ymaps = map));
    }

    async getUserLocation() {
        await getUserLocation((position) => {
            this.mapParams.center = [
                position.coords.latitude,
                position.coords.longitude
            ];

            this.mapInstance.setCenter(this.mapParams.center);
        });
    }

    async getCluster(params) {
        const url = this.makeRequestUrl(params);

        const data = await getCluster(url);

        this.points = data;
    }

    makeRequestUrl = (filterParams = {}) => {
        this.bounds = this.mapInstance.getBounds();

        const params = {
            latNW: this.bounds[1][0],
            latSE: this.bounds[0][0],
            lngNW: this.bounds[0][1],
            lngSE: this.bounds[1][1],
            zoom: this.mapInstance.getZoom(),
            ...filterParams
        };

        return queryString.stringify(params, { arrayFormat: 'index' });
    };

    makePlacemark(point) {
        const self = this;

        const coords = [point.coordinate.latitude, point.coordinate.longitude];

        const { terminalId, ttpId, address, count } = point;

        let pointData = {};

        let pointOptions = {};

        let placemark = {};

        if (count > 1) {
            const iconContentLayout = this.ymaps.templateLayoutFactory.createClass(
                '<div class="map__cluster">{{properties.terminalNumber}}</div>'
            );

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
            };

            if (count > 100) {
                pointOptions.iconImageSize = [50, 50];
                pointOptions.iconImageOffset = [-25, -25];
                pointOptions.iconContentOffset = [5, 17];
            }

            let terminalNumber = count;

            if (count / 10000 >= 1) {
                terminalNumber = `${Math.round(count / 1000)}т`;
            }

            pointData = {
                terminalNumber
            };

            if (this.mapInstance.getZoom() > 18) {
                let terminalRelation = 'Терминал QIWI';

                if (ttpId === 19) {
                    terminalRelation = 'Терминал партнеров';
                }

                pointData.balloonContentHeader = `<h2 class="map__type"><span class="map__type_bullet">&#9679;</span>${terminalRelation}<span class="map__id">ID-${terminalId}</span></h2>`;

                pointData.balloonContentBody = `<p class="map__adress">${address}</p><p class="map__more">и ещё ${count -
                    1}</p>`;
            }

            placemark = new this.ymaps.Placemark(
                coords,
                pointData,
                pointOptions
            );

            if (this.mapInstance.getZoom() < 19) {
                placemark.events.add('click', (e) => {
                    e.preventDefault();

                    const newCoords = e.get('target').geometry.getCoordinates();

                    self.this.mapInstance.geoObjects.removeAll();

                    self.this.mapInstance.panTo(newCoords).then(() => {
                        const mapZoom = self.this.mapInstance.getZoom();

                        self.mapParams.zoom =
                            mapZoom < 19 ? mapZoom + 1 : self.mapParams.zoom;
                        self.this.mapInstance.setZoom(self.mapParams.zoom);
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

            if (ttpId === 19) {
                terminalRelation = 'Терминал партнеров';
                pointOptions.iconImageHref = partnersTerminalPlacemark;
            }

            pointData = {
                balloonContentHeader: `<h2 class="map__type"><span class="map__type_bullet">&#9679;</span>${terminalRelation}<span class="map__id">ID-${terminalId}</span></h2>`,
                balloonContentBody: `<p class="map__adress">${address}</p>`
            };

            placemark = new this.ymaps.Placemark(
                coords,
                pointData,
                pointOptions
            );
        }

        return placemark;
    }

    buildClusters = (points = this.points) => {
        if (!points.length) {
            return;
        }

        this.mapInstance.geoObjects.removeAll();

        points.forEach((point) => {
            const placemark = this.makePlacemark(point);

            this.mapInstance.geoObjects.add(placemark);
        });
    };

    setHandler() {
        this.mapInstance.events.add(
            'actionend',
            this.moveMapHandler.bind(this)
        );
    }

    async getAndBuild(params) {
        try {
            await this.getCluster(params);
        } catch (err) {
            console.warn(err);
        }

        this.buildClusters();
    }

    moveMapHandler() {
        /* const newBounds = this.mapInstance.getBounds(); */

        /* if((newBounds[0][0]<this.bounds[0][0] && newBounds[0][1]<this.bounds[0][1]) ||
         (newBounds[1][0]>this.bounds[1][0] && newBounds[1][1]>this.bounds[1][1])) { */

        this.getAndBuild();
        /* } */
    }

    render() {
        return html`
            <div id="${this.mapContainer}" class="map"></div>
        `;
    }
}
