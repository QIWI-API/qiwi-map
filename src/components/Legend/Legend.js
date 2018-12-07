import { html, Component } from 'htm/preact/standalone';

import './styles.css';

import Switch from '../Switch';

import { getGroups } from '../../lib/api';

import {
    MapBankIcon,
    MapMobileShopIcon,
    MapQiwiTerminalIcon,
    MapOtherTerminalIcon,
    MapContactIcon,
    MapCashIcon,
    MapCardIcon
} from '../Icons';

export default class Legend extends Component {
    constructor(props) {
        super(props);

        this.state = {
            where: [],
            how: [
                {
                    label: 'Наличными',
                    id: 'cacheAllowed',
                    enabled: false,
                    icon: MapCashIcon
                },
                {
                    label: 'Картой',
                    id: 'cardAllowed',
                    enabled: false,
                    icon: MapCardIcon
                }
            ],
            ident: [
                {
                    label: 'Без идентификации',
                    enabled: false,
                    icon: null
                },
                {
                    label: 'Частичная',
                    enabled: false,
                    icon: null
                },
                {
                    label: 'Полная',
                    enabled: false,
                    icon: null
                }
            ]
        };

        this.whereIcons = {
            1: MapQiwiTerminalIcon,
            2: MapOtherTerminalIcon,
            3: MapMobileShopIcon,
            4: MapBankIcon,
            5: MapContactIcon
        };
    }

    async componentDidMount() {
        try {
            const groups = await this.getGroups();

            const where = this.makeFilterFromGroup(
                groups.filter((group) => group.maps.includes('REPLENISH'))
            );

            this.setState({
                where
            });

            this.setFilterParams();
        } catch (err) {
            console.warn(err);
        }
    }

    makeFilterFromGroup = (groups) => {
        return groups.map((group, index) => {
            return {
                label: group.title,
                id: group.id,
                enabled: false,
                icon: this.whereIcons[group.id]
                    ? this.whereIcons[group.id]
                    : null
            };
        });
    };

    setFilterParams = () => {
        this.props.setFilterParams(this.filterParams());
    };

    async getGroups() {
        const data = await getGroups();
        return data;
    }

    filterParams = () => {
        const params = {};

        const paramsMethod = {
            where: () => {
                params.ttpGroups = this.state.where
                    .filter((filter) => filter.enabled)
                    .map((filter) => filter.id);
            },
            how: () => {
                this.state.how.forEach((filter) => {
                    if (filter.enabled) {
                        params[filter.id] = filter.enabled;
                    }
                });
            },
            ident: () => {
                params.identificationTypes = this.state.ident
                    .filter((filter) => filter.enabled)
                    .map((filter, index) => index);
            }
        };

        Object.keys(this.state).forEach((type) => {
            paramsMethod[type]();
        });

        return params;
    };

    filterSwitch = (type, index) => () => {
        const filters = this.state;
        filters[type][index].enabled = !filters[type][index].enabled;
        this.setState({
            ...filters
        });
        if (this.props.setFilterParams) {
            this.setFilterParams();
        }
    };

    render(props, { where, how, ident }) {
        const filtersWhere = where.map(
            ({ label, enabled, icon }, index) => html`
                    <${Switch} label=${label} checked=${enabled} icon=${icon}
                    onChange=${this.filterSwitch('where', index)} />
                `
        );

        const filtersHow = how.map(
            ({ label, enabled, icon }, index) => html`
                    <${Switch} label=${label} checked=${enabled} icon=${icon}
                    onChange=${this.filterSwitch('how', index)} />
                `
        );

        const filtersIdent = ident.map(
            ({ label, enabled, icon }, index) => html`
                    <${Switch} label=${label} checked=${enabled} icon=${icon} 
                    onChange=${this.filterSwitch('ident', index)} />
                `
        );

        return html`
            <ul class="legend">
                <li class="legend__category">
                    <h2 class="legend__title">Где пополнить</h2>
                    <div class="legend__filters">${filtersWhere}</div>
                </li>
                <li class="legend__category">
                    <h2 class="legend__title">Как пополнить</h2>
                    <div class="legend__filters">${filtersHow}</div>
                </li>
                <li class="legend__category">
                    <h2 class="legend__title">Идентификация</h2>
                    <div class="legend__filters">${filtersIdent}</div>
                </li>
            </ul>
        `;
    }
}
