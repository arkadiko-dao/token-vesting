import React from 'react';

import {
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    standardPrincipalCV,
    contractPrincipalCV,
    uintCV,
    listCV,
    tupleCV
} from '@stacks/transactions';

import {
    StacksMainnet,
    StacksTestnet,
    StacksMocknet
} from '@stacks/network';

interface InputProps {
    txIdFromLocking: any
}

export const ContractDetail: React.FC<InputProps> = (props) => {
    const [contract, setContract] = React.useState('');
    const [token, setToken] = React.useState('');
    const [amount, setAmount] = React.useState('');
    const [lockingPeriod, setLockingPeriod] = React.useState('');
    const [assignees, setAssignees] = React.useState('');

    const handleAssignees = () => {
        let assigneesList: any[] = [];
        assignees.split(' ').join('').split(',').forEach((assignee) => {
            assigneesList.push(
                tupleCV({
                    address: standardPrincipalCV(assignee),
                    amount: uintCV(123)
                })
            );
        });

        return listCV(assigneesList);
    };

    const lock = async () => {
        let assigneesList = handleAssignees();
        // TODO set url dynamically
        const network = new StacksMocknet({ url: 'http://localhost:3999' });
        const txOptions = {
            contractAddress: contract,
            contractName: "token-vesting",
            functionName: "deposit",
            functionArgs: [
                contractPrincipalCV(contract, token),
                uintCV(amount),
                uintCV(lockingPeriod),
                assigneesList
            ],
            // TODO set senderKey from an environment variable?
            senderKey: '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601',
            validateWithAbi: true,
            network,
            postConditionMode: 1,
            anchorMode: AnchorMode.Any,
            fee: 300n
        };

        const transaction = await makeContractCall(txOptions);
        const broadcastResponse = await broadcastTransaction(transaction, network);
        const txId = broadcastResponse.txid;
        props.txIdFromLocking(txId);
    };

    return (
        <div>
            <section>
                <form action="#">
                    <fieldset>
                        <legend>Vesting Contract</legend>
                        <p>Add vesting details and click "Lock Tokens" to finish</p>
                        <div className="form-group">
                            <label htmlFor="contract">Contract:</label>
                            <input id="contract" name="contract" type="text" onChange={e => setContract(e.target.value)}/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="token">Token:</label>
                            <input id="token" name="token" type="text" onChange={e => setToken(e.target.value)}/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="amount">Amount:</label>
                            <input id="amount" name="amount" type="text" onChange={e => setAmount(e.target.value)}/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="lockingPeriod">Locking Period:</label>
                            <input id="lockingPeriod" name="lockingPeriod" type="text" onChange={e => setLockingPeriod(e.target.value)}/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="assignees">Assignees:</label>
                            <textarea id="assignees" name="assignees" onChange={e => setAssignees(e.target.value)}/>
                        </div>
                        <div className="form-group">
                            <button className="btn btn-default" role="button" name="lockTokens" id="lockTokens" onClick={lock}>Lock Tokens</button>
                        </div>



                    </fieldset>
                </form>
            </section>
        </div>
    );
}
