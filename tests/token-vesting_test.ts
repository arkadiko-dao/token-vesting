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

const addr = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const contract = "token-vesting";

/**
 * Bridge to test token
 */
class TokenBridge {

    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    /**
     * Get qualified token contract
     */
    getTokenContract(token: string) {
        return `${addr}.${token}`;
    }

    /**
     * Deposit function
     */
    deposit(token:string, amount: number) {
        const block = this.chain.mineBlock([
			      Tx.contractCall(
                contract,
                'deposit',
                [
                    types.principal(this.getTokenContract(token)),
                    types.uint(amount)
                ],
                this.deployer.address
            )
		    ]);

        return block.receipts[0].result;
    }
}

Clarinet.test({
    name: "allows a deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const amount = 100;
        const token = new TokenBridge(chain, accounts.get("deployer")!);
        const result = token.deposit("xyz-token", amount);

        result.expectOk().expectBool(true);
    }
});
