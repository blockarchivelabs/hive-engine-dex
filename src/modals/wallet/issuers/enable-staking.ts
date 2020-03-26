import { dispatchify, Store } from 'aurelia-store';
import { SteemEngine } from 'services/steem-engine';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { environment } from 'environment';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import styles from './enable-staking.module.css';

@autoinject()
export class EnableStakingModal {
    @bindable unstakingCooldown: number;
    @bindable numberTransactions: number;

    private styles = styles;
    private loading = false;
    private state: State;
    private subscription: Subscription;   
    private token: any;
    private validationController;
    private renderer;

    constructor(private controller: DialogController, private se: SteemEngine, private toast: ToastService, private taskQueue: TaskQueue, private store: Store<State>, private controllerFactory: ValidationControllerFactory, private i18n: I18N) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;    
        this.subscription = this.store.state.subscribe((state: State) => {
            if (state) {
                this.state = state;
            }
        });
    }

    bind() {
        this.createValidationRules();
    }

    async activate(symbol) {        
        this.token = this.state.account.balances.find(x => x.symbol === symbol);        
    }

    private createValidationRules() {
        ValidationRules.customRule(
            'integerRange',
            (value, obj, min, max) => value === null || value === undefined
                || Number.isInteger(1 * value) && value >= min && value <= max,
            `\${$displayName} must be an integer between \${$config.min} and \${$config.max}.`,
            (min, max) => ({ min, max })
        );

        const rules = ValidationRules
            .ensure('unstakingCooldown')
                .required()
                    .withMessageKey('errors:unstakeCooldownRequired')
                .then()
                .satisfiesRule('integerRange', 1, 365)
                .withMessageKey('errors:unstakeCooldownInvalidRange')
            .ensure('numberTransactions')
                .required()
                    .withMessageKey('errors:unstakeTransactionsRequired')
                .then()
                .satisfiesRule('integerRange', 1, 365)
                .withMessageKey('errors:unstakeTransactionsInvalidRange')
            .rules;

        this.validationController.addObject(this, rules);
    }

    async confirmSend() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;

        for (const result of validationResult.results) {
            if (!result.valid) {
                const toast = new ToastMessage();

                toast.message = this.i18n.tr(result.rule.messageKey, {
                    unstakingCooldown: this.unstakingCooldown,
                    numberTransactions: this.numberTransactions,
                    symbol: this.token.symbol,
                    ns: 'errors'
                });

                this.toast.error(toast);
            }
        }

        if (validationResult.valid) {                       

            const result = await this.se.enableStaking(this.token.symbol, this.unstakingCooldown, this.numberTransactions);

            if (result) {
                this.controller.ok();
            }
        }

        this.loading = false;
    }
}
