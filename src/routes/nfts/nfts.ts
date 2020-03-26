import { NftService } from './../../services/nft-service';
import { NftOwnershipModal } from './../../modals/nft/nft-ownership';
import { customJson } from 'common/keychain';
import { TokenInfoModal } from 'modals/wallet/token-info';
import { NftEnableModal } from 'modals/nft/nft-enable';
import { SteemEngine } from 'services/steem-engine';
import { autoinject, TaskQueue } from 'aurelia-framework';

import { environment } from 'environment';

import { connectTo, dispatchify } from 'aurelia-store';
import { getNfts } from 'store/actions';

import styles from './nfts.module.css';
import { DialogService, DialogCloseResult } from 'aurelia-dialog';

@autoinject()
@connectTo()
export class Nfts {
    private styles = styles;
    private tokenTable: HTMLTableElement;
    private state: State;

    constructor(private se: SteemEngine, private taskQueue: TaskQueue, private dialogService: DialogService, private nftService: NftService) {}

    async canActivate() {
        await dispatchify(getNfts)();
    }

    async walletDialogCloseResponse(response: DialogCloseResult) {
        console.log(response);
    }

    attached() {
        // @ts-ignore
        $(this.tokenTable).DataTable({
            order: [],
            columnDefs: [
                {
                    targets: 'no-sort',
                    orderable: false,
                },
            ],
            bInfo: false,
            paging: false,
            searching: false,
        });
    }

    showTokenInfo(symbol) {
        this.dialogService.open({ viewModel: TokenInfoModal, model: symbol }).whenClosed(response => {
            //console.log(response);
        });
    }

    changeOwnership(symbol) {
        this.dialogService.open({ viewModel: NftOwnershipModal, model: symbol }).whenClosed(response => {
            //console.log(response);
        });
    }

    async enableMarket(token: any) {
        const payload = {
            contractName: 'nftmarket',
            contractAction: 'enableMarket',
            contractPayload: {
                symbol: token.symbol
            }
        };

        if (window.steem_keychain) {
            const response = await customJson(this.se.getUser(), environment.chainId, 'Active', JSON.stringify(payload), `Enable Market`);

            if (response.success) {
                this.dialogService.open({ viewModel: NftEnableModal, model: token }).whenClosed(response => {

                });
            }
        } else {
            window.alert('You need a supported browser and the Steem Keychain browser extension to perform this action');
        }
    }

    userCanModify(token) {
        if (token.issuer === this.state.account.name || token.authorizedIssuingAccounts && token.authorizedIssuingAccounts.includes(this.state.account.name)) {
            return true;
        }

        return false;
    }

    userCanIssue(token) {
        if (token.authorizedIssuingAccounts && token.authorizedIssuingAccounts.includes(this.state.account.name)) {
            return true;
        }

        return false;
    }
}
