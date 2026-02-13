
import { riskService } from '../services/riskService';
import dayjs from 'dayjs';

async function runVerification() {
    console.log('--- Hedge Coverage Verification ---');

    console.log('\n1. Initial State:');
    const currency = 'USD';
    const initialCoverage = riskService.getCurrencyCoverage(currency);
    console.log(`Currency: ${currency}`);
    console.log(`Net Exposure: ${initialCoverage.netExposure}`);
    console.log(`Total Hedged: ${initialCoverage.totalHedged}`);
    console.log(`Coverage Ratio: ${(initialCoverage.coverageRatio * 100).toFixed(2)}%`);

    console.log('\n2. Testing Link Hedge:');
    // Find an open exposure
    const exposures = await riskService.getExposures();
    const openExposure = exposures.find(e => e.currencyCode === 'USD' && e.status === 'OPEN');

    if (openExposure) {
        console.log(`Found Open Exposure: ${openExposure.id} (${openExposure.amount})`);

        // Create a new active forward with capacity
        console.log('Creating new forward...');
        const newForward = await riskService.createForward({
            organizationId: 'org-1',
            baseCurrency: 'USD',
            quoteCurrency: 'NGN',
            direction: 'BUY_BASE',
            notionalAmount: 100000,
            forwardRate: 1550,
            tradeDate: dayjs().format('YYYY-MM-DD'),
            valueDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
            counterparty: 'Test Bank'
        });
        console.log(`Created New Forward: ${newForward.id} (Notional: 100000)`);

        if (newForward) {
            try {
                const hedgeAmount = 50000;
                console.log(`Linking ${hedgeAmount}...`);
                await riskService.linkHedge(openExposure.id, newForward.id, hedgeAmount);
                console.log('Link Successful.');

                let updatedCoverage = riskService.getExposureCoverage(openExposure.id);
                console.log(`Updated Exposure Coverage Status: ${updatedCoverage?.coverageStatus}`);
                console.log(`Updated Exposure Coverage Ratio: ${(updatedCoverage?.coverageRatio || 0) * 100}%`);

                const updatedCurrencyCoverage = riskService.getCurrencyCoverage(currency);
                console.log(`Updated Currency Total Hedged: ${updatedCurrencyCoverage.totalHedged}`);

                // Test Settlement
                console.log('\n4. Testing Settlement:');
                console.log('Settling Forward...');
                await riskService.settleForward(newForward.id);
                console.log('Forward Settled.');

                // Check Exposure Status after settlement
                // Fetch fresh exposure as object reference in array might be stable but let's be safe
                const settledExposure = (await riskService.getExposures()).find(e => e.id === openExposure.id);
                console.log(`Exposure Amount after Settlement: ${settledExposure?.amount} (Should be reduced by 50k from original)`);
                console.log(`Exposure Status: ${settledExposure?.status}`);

                // Verify Currency Coverage ignores settled forward
                const finalCurrencyCoverage = riskService.getCurrencyCoverage(currency);
                console.log(`Final Currency Total Hedged: ${finalCurrencyCoverage.totalHedged} (Should decrease if settled forwards are excluded)`);

            } catch (error) {
                console.error('Link/Settle Failed:', error);
            }
        }
    } else {
        console.log('No Open Exposure found for test.');
    }

    console.log('\n3. Time Buckets Check:');
    const buckets = riskService.getTimeBucketedCoverage('USD');
    console.log('Buckets:', JSON.stringify(buckets, null, 2));

    console.log('\n--- Verification Complete ---');
}

runVerification().catch(console.error);
