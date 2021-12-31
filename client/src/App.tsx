import React from 'react';
import "./index.css";

import { VestingSection } from '@components/VestingSection';

const App = () => {
    return (
        <div>
            <section style={{margin: '10px'}}>
                <div className="terminal-card">
                    <header>Arkadiko - Vesting Contract</header>
                </div>
                <br />
            </section>
            <VestingSection />
        </div>
    );
}

export default App;
