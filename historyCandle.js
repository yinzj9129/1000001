let MetaApi = require('metaapi.cloud-sdk').default;
let SynchronizationListener = require('metaapi.cloud-sdk').SynchronizationListener;

let token = process.env.TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1NjJjZGMxMGI0YjVhNjZhMDc3NTk4Yzk1ZDBlNTFkNCIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjI5MTY4NDkwLCJyZWFsVXNlcklkIjoiNTYyY2RjMTBiNGI1YTY2YTA3NzU5OGM5NWQwZTUxZDQifQ.UP_vCSVxjkYUWkYpf2Gc9m7rxASAL8AQuyF4gTjpyJ6byJcaC9x-Zt0l6e08K1fQo4iDBsQd0E6EULW1taMw4wTQWkOlgOl82RsVHmYtQa5_HNQEFY64gvpRjD27_7cWkeULhYYhPhFjLUY5l9C9lkPxdVGdmu7BCQEYCA_g3nBeFlsDQyxSszn7sEPH0dsaclCfc5Fj2SphMNrkbrw9KEWwf38brUYxjY26R_VaI3WRaf-OkgUWNiEg91jDczuE4e2vEaiKg3lGoN2x_Ca_X6vVfLumuNfL8fABMEArGOmM0GextSSak52V70sOe7SHGb3RNeuYvd-nlCnR14pRZOgQVGKKSAD1YLLVNOB0Y4HjxJ3vT7P-A0RGAJzWXXSXBAxiAivBD4L1gF-VkV7c3PfY121QN7KYii6CNm2Tw0OaPxwUJ2LfTG-7xJaskJwUKeC7T_CE_4EdpRKUFlKpbKQmRECfdrMzOel8kIP2dX7rGi8WeF1zYjuYxwA61mRn42W9TS9g_qijvfhUsVhJLwDOhCqKYekU6IogNlBCVVm9GhGhCytSgFQ-QUbFM7I1nz17-QnqY0-Z4i38bDc4U0n6iXAE4BoN7j3Dymp5M_M04Rmt1kW2v6v3XKPrw3Vgn8SpzgjdUlbSP4M78-SLe1yN7QMbrSlHqRwR8yn4CC8';
let accountId = process.env.ACCOUNT_ID || '76ef6692-3e6b-450a-a221-713d702b4e96';
let symbol = process.env.SYMBOL || 'GOLD';
let domain = process.env.DOMAIN || 'agiliumtrade.agiliumtrade.ai';

const api = new MetaApi(token, {domain});

// eslint-disable-next-line
async function retrieveHistoricalCandles() {
    try {
        let account = await api.metatraderAccountApi.getAccount(accountId);

        // wait until account is deployed and connected to broker
        console.log('Deploying account');
        if (account.state !== 'DEPLOYED') {
            await account.deploy();
        } else {
            console.log('Account already deployed');
        }
        console.log('Waiting for API server to connect to broker (may take couple of minutes)');
        if (account.connectionStatus !== 'CONNECTED') {
            await account.waitConnected();
        }

        // retrieve last 10K 1m candles
        let pages = 10;
        console.log(`Downloading ${pages}K latest candles for ${symbol}`);
        let startedAt = Date.now();
        let startTime;
        let candles
        for (let i = 0; i < pages; i++) {
            // the API to retrieve historical market data is currently available for G1 and MT4 G2 only
            let newCandles = await account.getHistoricalCandles(symbol, '1m', startTime);
            console.log(`Downloaded ${newCandles ? newCandles.length : 0} historical candles for ${symbol}`);
            if (newCandles && newCandles.length) {
                candles = newCandles;
            }
            if (candles && candles.length) {
                startTime = candles[0].time;
                startTime.setMinutes(startTime.getMinutes() - 1);
                console.log(`First candle time is ${startTime}`);
            }
        }
        if (candles) {
            console.log('First candle is', candles[0]);
        }
        console.log(`Took ${Date.now() - startedAt}ms`);

    } catch (err) {
        console.error(err);
    }
}

retrieveHistoricalCandles();