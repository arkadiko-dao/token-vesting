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

/*
 * Vesting options: locking 2000 XYZ tokens for 48 blocks.
 */
const vestingOptions = {
    token: "xyz-token",
    lockingPeriod: 48,
    amount: 2000
}

class XyzToken {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    balanceOf = (wallet: string) => {
        const block = this.chain.callReadOnlyFn(vestingOptions.token, "get-balance", [
            types.principal(wallet),
        ], this.deployer.address);

        return block;
    }
}

Clarinet.test({
    name: "[deposit] locked amount is transferred to the contract address",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
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
                        types.principal(`${deployer.address}.${vestingOptions.token}`),
                        types.uint(vestingOptions.amount),
                        types.uint(vestingOptions.lockingPeriod),
                        types.list(assigneesList)
                    ],
                    deployer.address
                ),
            ]
        );

        let resp = block.receipts[0];
        resp.result.expectOk().expectBool(true);

        // Check balance in the contract address.
        const xyzToken = new XyzToken(chain, deployer);
        resp = xyzToken.balanceOf(`${deployer.address}.${contract}`);
        resp.result.expectOk().expectUint(vestingOptions.amount);
    }
});

Clarinet.test({
    name: "[redeem] unlocked amount is transferred to the transaction sender address",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const txSender = accounts.get("wallet_2")!;
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
                        types.principal(`${deployer.address}.${vestingOptions.token}`),
                        types.uint(vestingOptions.amount),
                        types.uint(vestingOptions.lockingPeriod),
                        types.list(assigneesList)
                    ],
                    deployer.address
                ),
                Tx.contractCall(
                    contract, "redeem",
                    [types.principal(`${deployer.address}.${vestingOptions.token}`)],
                    txSender.address
                )
            ]
        );

        const [deposit, redeem] = block.receipts;
        deposit.result.expectOk();
        redeem.result.expectOk();

        // Check balance in the assignee address.
        const xyzToken = new XyzToken(chain, deployer);
        const result = xyzToken.balanceOf(txSender.address).result;
        result.expectOk().expectUint(assignees[0].amount);
    }
});

Clarinet.test({
    name: "[redeem] shares can be redeemed only once",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const txSender = accounts.get("wallet_2")!;
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
                        types.principal(`${deployer.address}.${vestingOptions.token}`),
                        types.uint(vestingOptions.amount),
                        types.uint(vestingOptions.lockingPeriod),
                        types.list(assigneesList)
                    ],
                    deployer.address
                ),
                Tx.contractCall(
                    contract, "redeem",
                    [types.principal(`${deployer.address}.${vestingOptions.token}`)],
                    txSender.address
                ),
                Tx.contractCall(
                    contract, "redeem",
                    [types.principal(`${deployer.address}.${vestingOptions.token}`)],
                    txSender.address
                )
            ]
        );

        const [deposit, redeem, notRedeemed] = block.receipts;
        deposit.result.expectOk();
        redeem.result.expectOk();
        notRedeemed.result.expectErr().expectUint(10);

        // Check the balance in the assignee address.
        const xyzToken = new XyzToken(chain, deployer);
        const result = xyzToken.balanceOf(txSender.address).result;
        result.expectOk().expectUint(assignees[0].amount);
    }
});
