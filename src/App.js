/* global document */
import { html, render } from 'htm/preact/standalone';
// import renderToString from 'preact-render-to-string';

import './styles/styles.css';

import TerminalMap from './TerminalMap';

const mapUrl = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';

const mapOptions = {
    controls: ['zoomControl', 'fullscreenControl', 'geolocationControl', 'searchControl']
};

const mapParams = {
    center: [55.76, 37.64],
    zoom: 12
};

// renderToString(html`<${TerminalMap} />`);

render(
    html`<${TerminalMap} mapUrl=${mapUrl} mapOptions=${mapOptions} mapParams=${mapParams} />`,
    document.body,
    document.getElementById('app')
);
