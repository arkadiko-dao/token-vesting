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

const contract = "token-vesting";

class XyzToken {
    chain: Chain;
    deployer: Account;
    token: string = "xyz-token";

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    balanceOf = (wallet: string) => {
        const block = this.chain.callReadOnlyFn(this.token, "get-balance", [
            types.principal(wallet),
        ], this.deployer.address);

        return block;
    }
}

Clarinet.test({
    name: "[deposit] locked amount is transferred to the contract address",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const token = "xyz-token";
        const amount = 1000;
        const lockingPeriod = 48;
        const assignees = [{address: accounts.get("wallet_3")!.address, amount: 25}];
        let assigneesList: any[] = [];
        assignees.forEach((el) => {
            assigneesList.push(
                types.tuple({
                    'address': types.principal(el.address),
                    'amount': types.uint(el.amount)
                })
            )
        });

        const block = chain.mineBlock(
            [
                Tx.contractCall(
                    contract, "deposit",
                    [
                        types.principal(`${deployer.address}.${token}`),
                        types.uint(amount),
                        types.uint(lockingPeriod),
                        types.list(assigneesList)
                    ],
                    deployer.address
                ),
            ]
        );

        let resp = block.receipts[0];
        resp.result.expectOk().expectBool(true);

        const xyzToken = new XyzToken(chain, deployer);
        resp = xyzToken.balanceOf(`${deployer.address}.${contract}`);
        resp.result.expectOk().expectUint(amount);
    }
});

Clarinet.test({
    name: "[redeem] unlocked amount is transferred to the transaction sender address",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const token = "xyz-token";
        const txSender = accounts.get("wallet_2")!;
        const amount = 1000;
        const lockingPeriod = 48;
        const assignees = [{address: txSender.address, amount: 250}];
        let assigneesList: any[] = [];
        assignees.forEach((el) => {
            assigneesList.push(
                types.tuple({
                    'address': types.principal(el.address),
                    'amount': types.uint(el.amount)
                })
            )
        });

        const block = chain.mineBlock(
            [
                Tx.contractCall(
                    contract, "deposit",
                    [
                        types.principal(`${deployer.address}.${token}`),
                        types.uint(amount),
                        types.uint(lockingPeriod),
                        types.list(assigneesList)
                    ],
                    deployer.address
                ),
                Tx.contractCall(
                    contract, "redeem",
                    [types.principal(`${deployer.address}.${token}`)],
                    txSender.address
                )
            ]
        );

        const [deposit, redeem] = block.receipts;
        deposit.result.expectOk();
        redeem.result.expectOk();

        const xyzToken = new XyzToken(chain, deployer);
        const result = xyzToken.balanceOf(txSender.address).result;
        result.expectOk().expectUint(assignees[0].amount);
    }
});
