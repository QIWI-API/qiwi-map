/* global fetch */

export function getGroups() {
    return fetch('https://edge.qiwi.com/locator/v3/ttp-groups', {
        method: 'GET'
    }).then(response => response.json());
}

export function getCluster(params) {
    return fetch(`https://edge.qiwi.com/locator/v3/nearest/clusters?${params}`, {
        method: 'GET'
    }).then(response => response.json());
}
