import { Store } from 'aurelia-store';
import { HiveEngine } from 'services/steem-engine';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from '../../services/toast-service';
import { BootstrapFormRenderer } from '../../resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import styles from './send-tokens.module.css';
import { trimUsername } from 'common/functions';

@autoinject()
export class SendTokensModal {
    @bindable amount;
    @bindable username;
    @bindable memo;

    private styles = styles;
    private loading = false;
    private state: State;
    private subscription: Subscription;   
    private token: any;
    private validationController;
    private renderer;

    constructor(private controller: DialogController, private se: HiveEngine, private toast: ToastService, private taskQueue: TaskQueue, private store: Store<State>, private controllerFactory: ValidationControllerFactory, private i18n: I18N) {
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

    balanceClicked() {
        this.amount = this.token.balance;
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('amount')
                .required()
                    .withMessageKey('errors:sendTokenAmountRequired')
                .then()
                    .satisfies((value: any, object: any) => parseFloat(value) > 0)
                    .withMessageKey('errors:amountGreaterThanZero')
                    .satisfies((value: any, object: SendTokensModal) => {
                        const amount = parseFloat(value);

                        return (amount <= object.token.balance);
                    })
                    .withMessageKey('errors:insufficientBalanceForSendToken')            
            .ensure('username')
                .required()
                    .withMessageKey('errors:sendTokenUsernameRequired')
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
                    balance: this.token.balance,
                    symbol: this.token.symbol,
                    ns: 'errors'
                });

                this.toast.error(toast);
            }
        }

        if (validationResult.valid) {
            let username = trimUsername(this.username);
            const result = await this.se.sendToken(this.token.symbol, username, this.amount, this.memo);

            if (result) {
                this.controller.ok();
            }
        }

        this.loading = false;
    }
}
