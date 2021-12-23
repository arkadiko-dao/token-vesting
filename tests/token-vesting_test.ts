import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v0.14.0/index.ts';

import {
    assertEquals
} from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const addr = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const contract = "token-vesting";
const token = "xyz-token";

/**
 * Bridge to test token
 */
class ContractBridge {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    /**
     * Get qualified token address
     */
    getTokenAddress() {
        return `${addr}.${token}`;
    }

    /**
     * Get qualified contract address
     */
    getAddress() {
        return `${addr}.${contract}`;
    }

    /**
     * Deposit function
     */
    deposit(token: string, amount: number, lockingPeriod: number, assignees: { address: string, amount: number }[]) {
        let assigneesList: any[] = [];
        assignees.forEach((el) => {
            assigneesList.push(
                types.tuple({
                    'address': types.principal(el.address),
                    'amount': types.uint(el.amount)
                })
            )
        });

        const block = this.chain.mineBlock([
			      Tx.contractCall(
                contract,
                'deposit',
                [
                    types.principal(this.getTokenAddress()),
                    types.uint(amount),
                    types.uint(lockingPeriod),
                    types.list(assigneesList)
                ],
                this.deployer.address
            )
	      ]);

        return block.receipts[0];
    }
}

Clarinet.test({
    name: "[deposit] amount to be locked is transferred to the contract",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const amount = 1020;
        const lockingPeriod = 48;
        const assignees = [{
            address: accounts.get("wallet_3")!.address,
            amount: 25
        }];

        const contract = new ContractBridge(chain, deployer);
        const resp = contract.deposit(token, amount, lockingPeriod, assignees);
        const [transferEvent, _] = resp.events

        resp.result.expectOk().expectBool(true);
        transferEvent.ft_transfer_event.amount.expectInt(amount);
        transferEvent.ft_transfer_event.recipient.expectPrincipal(contract.getAddress());
    }
});
