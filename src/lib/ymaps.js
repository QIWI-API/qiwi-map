let promise = null;

export let mapInstance = null;
export let ymaps = null;

export function loadYmaps(src = '//api-maps.yandex.ru/2.1/?lang=en_RU') {
    promise =
        promise ||
        new Promise((resolve, reject) => {
            const elem = document.createElement('script');
            elem.type = 'text/javascript';
            elem.src = src;
            elem.onload = resolve;
            elem.onerror = (e) => reject(e);
            document.body.appendChild(elem);
        }).then(() => new Promise((resolve) => window.ymaps.ready(resolve)));

    return promise.then(maps => ymaps = maps);
}

export function initMap(container, options) {
    mapInstance = new ymaps.Map(container, options);
}
