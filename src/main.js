import './styles/styles.css';

import terminalMap from './terminalMap';

(async () => {

    const mapUrlSource = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';

    const mapContainer = 'map';

    const mapOptions = {
        controls: ['zoomControl', 'fullscreenControl', 'geolocationControl', 'searchControl', 'typeSelector']
    };

    const defaultMapParams = {
        center: [55.76, 37.64],
        zoom: 12
    };

    const terminalsOnMap = new terminalMap(defaultMapParams);




    try {

        await terminalsOnMap.getMap(mapUrlSource);

        terminalsOnMap.initMap(mapContainer, mapOptions);

        await terminalsOnMap.getUserLocation();

        await terminalsOnMap.getCluster();

    } catch (err) {
        console.log(err);

    }

    terminalsOnMap.buildClusters();
    terminalsOnMap.setHandler();

    const qiwiTerminalCheckbox = document.getElementById('show-qiwi-terminal');
    const partnersTerminalCheckbox = document.getElementById('show-partners-terminal');

    qiwiTerminalCheckbox.checked = true;
    partnersTerminalCheckbox.checked = true;

    qiwiTerminalCheckbox.addEventListener('change', (e) => {
        terminalsOnMap.setQiwiTerminalsFilter(e.target.checked);
        terminalsOnMap.buildClusters();
    });

    partnersTerminalCheckbox.addEventListener('change', (e) => {
        terminalsOnMap.setPartnersTerminalsFilter(e.target.checked);
        terminalsOnMap.buildClusters();
    });

})();