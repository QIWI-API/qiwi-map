/* global ymaps */
let promise = null;

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
        }).then(
            () =>
                new Promise((resolve) => ymaps.ready(resolve))
        );

    return promise;
}
