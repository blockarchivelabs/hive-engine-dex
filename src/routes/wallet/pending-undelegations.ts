import { Subscription } from 'rxjs';
import { Redirect } from 'aurelia-router';
import { SteemEngine } from 'services/steem-engine';
import { autoinject, TaskQueue } from 'aurelia-framework';

import { dispatchify, Store } from 'aurelia-store';
import { loadAccountBalances, loadTokensList } from 'store/actions';
import { stateTokensOnlyPegged } from 'common/functions';


@autoinject()
export class PendingUndelegations {    
    private transactions: IPendingUndelegationTransaction[] = [];
    private username: any;
    private state: State;
    private subscription: Subscription;

    private transactionsTable: HTMLTableElement;
    
    constructor(private se: SteemEngine, private store: Store<State>) {
        this.subscription = this.store.state.subscribe((state: State) => {
            if (state) {
                this.state = state;
            }
        });
    }

    unbind() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    attached() {        
        this.loadTable();        
    }

    loadTable() {
        // @ts-ignore
        $(this.transactionsTable).DataTable({
            bInfo: false,
            paging: false,
            searching: false,
            ordering: false
        });
    }

    async loadDelegationData() {
        if (!this.state.tokens || this.state.tokens.length == 0 || stateTokensOnlyPegged(this.state.tokens)) {
            await dispatchify(loadTokensList)();
            await dispatchify(loadAccountBalances)();
        }

        this.username = this.state.account.name;
        this.transactions = await this.se.loadPendingUndelegations(this.username);
    }

    async canActivate() {
        try {
            await this.loadDelegationData();            
        } catch {
            return new Redirect('');
        }
    }
}
