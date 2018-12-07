import { html } from 'htm/preact/standalone';

import './styles.css';

export default function ({
    label, onChange, checked, icon = ''
}) {
    const id = Math.random()
        .toString(36)
        .substr(2, 9);
    const Icon = icon ? icon() : '';
    return html`
        <label for=${id} class="switcher">
            <div class="switcher__label-container">
                ${Icon}
                <div class="switcher__text">${label}</div>
            </div>
            <div class="switch">
                <input type="checkbox" id=${id} checked=${checked} onChange=${onChange} />
                <span class="slider round"></span>
            </div>
        </label>
    `;
}
