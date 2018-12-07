import { html, Component } from 'htm/preact/standalone';

import './styles.css';

import Legend from '../components/Legend';
import Map from '../components/Map';

export default class TerminalMap extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filterParams: {}
        };
    }

    setFilterParams = (filterParams) => {
        this.setState({
            filterParams
        });
    };

    getFilterParams = () => this.state.filterParams;

    render({ mapOptions, mapParams, mapUrl }, { filterParams }) {
        return html`
            <div id="app" class="terminal-map">
                <div class="terminal-map__panel">
                    <h1 class="terminal-map__title">Карта терминалов QIWI</h1>
                    <h1 class="terminal-map__title--mobile">Карта терминалов</h1>
                </div>

                <div class="terminal-map__container">
                    <${Map} 
                        filterParams=${filterParams} 
                        mapOptions=${mapOptions} 
                        mapParams=${mapParams} 
                        mapUrl=${mapUrl}
                    />
                    <${Legend} 
                        setFilterParams=${this.setFilterParams} 
                    />
                </div>

                
            </div>
        `;
    }
}

/* {
  QIWI = 4,
  OTHER = 19,
  EUROSET = 10001,
  SVYAZNOY = 10002,
  MOBILE_SHOP = 10003,
  CONTACT = 10004,
  QIWI_BANK = 10005,
  QIWI_OFFICE = 10006,
  PARTNER_BOX_OFFICE = 10007,
  BANKS_ATM = 10008,
} */
