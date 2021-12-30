import React from 'react';

import { ContractDetail }  from '@components/ContractDetail';
import { Result }  from '@components/Result';

export const VestingSection: React.FC = () => {
    const [showResult, setShowResult] = React.useState(false);
    const [txId, setTxId] = React.useState('');

    const txIdFromLocking = (txIdFromLocking: string) => {
        setTxId(txIdFromLocking);
    }

    return (
        <>
            <div style={{margin: '10px'}}>
                <ContractDetail txIdFromLocking={txIdFromLocking} />
            </div>
            <div style={{margin: '10px'}}>
                {txId !== '' && <Result txId={txId} />}
            </div>
        </>
    );
}
