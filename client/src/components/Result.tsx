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

interface ResultProps {
    txId: string
}

export const Result: React.FC<ResultProps> = (props) => {
    const [txStatus, setTxStatus] = React.useState('');
    const [result, setResult] = React.useState('');
    const [timeoutResponse, setTimeoutResponse] = React.useState('');
    const [retry, setRetry] = React.useState(0);

    const processResult = async (txId: string, count: number = 0) => {
        // TODO set url dynamically
        const url = `http://localhost:3999/extended/v1/tx/${txId}`;
        const data = await fetch(url);
        const resp = await data.json();

        setTxStatus(resp.tx_status);

        if (resp.tx_status === 'pending') {
            setTxStatus("pending... transaction will be available below, as soon as it's block is mined.");
        }

        if (resp.tx_status === 'success') {
            const jsonStr = JSON.stringify(resp, undefined, 4);
            setResult(jsonStr);
        }

        if (count < 50) {
            if (resp.tx_status !== 'success') {
                setTimeout(function() {
                    processResult(props.txId, ++count)
                }, 2000);
                setRetry(count);
            }
        } else {
            setTimeoutResponse(`Timeouting after ${count} tries. Haven't received response from the blockchain.`);
            return false;
        }
    }

    React.useEffect(() => { processResult(props.txId, 0); }, []);

    return (
        <div>
            <section>
                <form action="#">
                    <fieldset>
                        <legend>Transaction Details</legend>
                        <div className="form-group">
                            <label htmlFor="txId">Id:</label>
                            <input id="txId" name="txId" type="text" value={props.txId} readOnly />
                        </div>
                        <p id="txStatus">Status: {txStatus}</p>
                        <p id="retry">Retry: {retry}</p>
                        <p id="timeoutResponse">{timeoutResponse}</p>
                        <div className="form-group">
                            <label htmlFor="result">Result:</label>
                            <textarea id="result" name="result" value={result} readOnly rows={15} />
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
    )
}
