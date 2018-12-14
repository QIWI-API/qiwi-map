export default function getUserLocation(cb) {
    return new Promise((resolve) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                cb(position);

                resolve();
            }, resolve);
        } else {
            resolve();
        }
    });
}
