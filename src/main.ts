import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { authStateChanged } from './common/firebase';

import 'bootstrap';
import 'datatables.net-bs4';
import 'datatables.net-responsive-bs4';
import 'datatables.net-bs4/css/dataTables.bootstrap4.css';
import 'datatables.net-plugins/sorting/natural';
import 'datatables.net-plugins/sorting/currency';
import 'datatables.net-plugins/sorting/formatted-numbers';
import 'datatables.net-plugins/sorting/numeric-comma';
import 'datatables.net-plugins/type-detection/currency';
import 'datatables.net-plugins/type-detection/formatted-num';
import 'datatables.net-plugins/type-detection/numeric-comma';
import 'bootstrap/dist/css/bootstrap.css';
import 'izitoast/dist/css/iziToast.css';
import './styles/toast.css';
import './styles/main.css';
import './styles/radio-toggles.css';
import 'datatables.net-responsive-bs4/css/responsive.bootstrap4.css'

import modalCss from './styles/modal.css';

import 'sscjs/dist/ssc';

import { AppRouter } from 'aurelia-router';
import { Aurelia, LogManager } from 'aurelia-framework';
import { ConsoleAppender } from 'aurelia-logging-console';
import { environment } from './environment';
import { PLATFORM } from 'aurelia-pal';
import { initialState } from './store/state';
import { dispatchify } from 'aurelia-store';
import { TCustomAttribute } from 'aurelia-i18n';
import Backend from 'i18next-xhr-backend';

import Mousetrap from 'mousetrap';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/pro-solid-svg-icons';
import { far } from '@fortawesome/pro-regular-svg-icons';
import { fad } from '@fortawesome/pro-duotone-svg-icons';
import { EventAggregator } from 'aurelia-event-aggregator';

import { I18N } from 'aurelia-i18n';
import { ValidationMessageProvider } from 'aurelia-validation';

LogManager.addAppender(new ConsoleAppender());

library.add(fas as any, far, fad);

// Disable connect queue to speed up application
import { disableConnectQueue } from 'aurelia-binding';
import { getSteemPrice } from 'common/functions';
disableConnectQueue();

Mousetrap.bind('ctrl+shift+f10', () => {
    console.debug('Enabling debug mode');
    LogManager.setLevel(LogManager.logLevel.debug);
});

// Gets the latest Steem price periodically
getSteemPrice();
setInterval(() => getSteemPrice, 300000);

export async function configure(aurelia: Aurelia) {
    aurelia.use
        .standardConfiguration()
        .feature(PLATFORM.moduleName('resources/index'))
        .feature(PLATFORM.moduleName('components/index'))

    aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

    if (environment.testing) {
        aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
    }

    aurelia.use.plugin(PLATFORM.moduleName('aurelia-animator-css'));
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-async-binding'));
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-portal-attribute'));
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-fetch-client'));
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-validation'));
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-fontawesome'));

    aurelia.use.plugin(PLATFORM.moduleName('aurelia-store', 'store'), {
        initialState: initialState,
        history: {
            undoable: false,
            limit: 5
        }
    });

    aurelia.use.plugin(PLATFORM.moduleName('aurelia-dialog'), config => {
        config
            .useDefaults()
            .useCSS(modalCss.toString());
    });

    aurelia.use.plugin(PLATFORM.moduleName('aurelia-i18n'), (instance) => {
        const aliases = ['t', 'i18n'];
        TCustomAttribute.configureAliases(aliases);

        // register backend plugin
        instance.i18next
            .use(Backend);

        return instance.setup({
            backend: {
                loadPath: './locales/{{lng}}/{{ns}}.json',
            },
            attributes: aliases,
            ns: ['translation', 'errors', 'buttons', 'notifications', 'titles'],
            defaultNS: 'translation',
            lng: environment.defaultLocale,
            fallbackLng: 'en',
            debug: false
        }).then(() => {
            const router = aurelia.container.get(AppRouter);

            router.transformTitle = title => instance.tr(`titles:${title}`);

            const eventAggregator = aurelia.container.get(EventAggregator);
            eventAggregator.subscribe('i18n:locale:changed', () => {
                router.updateTitle();
            });
        });
    });

    ValidationMessageProvider.prototype.getMessage = function(key: string) {
        const i18n = aurelia.container.get(I18N);
        const translation = i18n.tr(`${key}`);
        return this.parser.parse(translation);
      };
    
      ValidationMessageProvider.prototype.getDisplayName = function(propertyName: string, displayName: string) {
        if (displayName !== null && displayName !== undefined) {
          return displayName;
        }
        const i18n = aurelia.container.get(I18N);
        return i18n.tr(propertyName);
      };

    await authStateChanged();

    await aurelia.start();
    await aurelia.setRoot(PLATFORM.moduleName('app'));
}
