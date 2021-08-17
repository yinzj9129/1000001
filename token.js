let MetaApi = require('metaapi.cloud-sdk').default;
const consola = require('consola')
const log4js = require('log4js')
const tool = require('./lib/tool')

// 交易对
const SYMBOL = 'GOLD';

// 账户ID
const accountId = '76ef6692-3e6b-450a-a221-713d702b4e96';

log4js.configure(
    {
        appenders: {
            dateFile: {
                type: 'dateFile',
                filename: 'logs/MT4-0.log',
                pattern: 'yyyy-MM-dd-hh-mm-ss',
                compress: false,
                keepFileExt: true
            },
            out: {
                type: 'stdout'
            }
        },
        categories: {
            default: {appenders: ['dateFile', 'out'], level: 'trace'}
        }
    }
)


let logger = log4js.getLogger('MT4-API');


// 获取连接的API
const token = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1NjJjZGMxMGI0YjVhNjZhMDc3NTk4Yzk1ZDBlNTFkNCIsInBlcm1pc3Npb25zIjpbXSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaWF0IjoxNjI5MTY4NDkwLCJyZWFsVXNlcklkIjoiNTYyY2RjMTBiNGI1YTY2YTA3NzU5OGM5NWQwZTUxZDQifQ.UP_vCSVxjkYUWkYpf2Gc9m7rxASAL8AQuyF4gTjpyJ6byJcaC9x-Zt0l6e08K1fQo4iDBsQd0E6EULW1taMw4wTQWkOlgOl82RsVHmYtQa5_HNQEFY64gvpRjD27_7cWkeULhYYhPhFjLUY5l9C9lkPxdVGdmu7BCQEYCA_g3nBeFlsDQyxSszn7sEPH0dsaclCfc5Fj2SphMNrkbrw9KEWwf38brUYxjY26R_VaI3WRaf-OkgUWNiEg91jDczuE4e2vEaiKg3lGoN2x_Ca_X6vVfLumuNfL8fABMEArGOmM0GextSSak52V70sOe7SHGb3RNeuYvd-nlCnR14pRZOgQVGKKSAD1YLLVNOB0Y4HjxJ3vT7P-A0RGAJzWXXSXBAxiAivBD4L1gF-VkV7c3PfY121QN7KYii6CNm2Tw0OaPxwUJ2LfTG-7xJaskJwUKeC7T_CE_4EdpRKUFlKpbKQmRECfdrMzOel8kIP2dX7rGi8WeF1zYjuYxwA61mRn42W9TS9g_qijvfhUsVhJLwDOhCqKYekU6IogNlBCVVm9GhGhCytSgFQ-QUbFM7I1nz17-QnqY0-Z4i38bDc4U0n6iXAE4BoN7j3Dymp5M_M04Rmt1kW2v6v3XKPrw3Vgn8SpzgjdUlbSP4M78-SLe1yN7QMbrSlHqRwR8yn4CC8';
const api = new MetaApi(token);

async function testMetaApiSynchronization() {
    try {
// 获取已存在的账户
// filter and paginate accounts, see esdoc for full list of filter options available
// const accounts = await api.metatraderAccountApi.getAccounts({
//     limit: 10,
//     offset: 0,
//     query: 'ICMarketsSC-MT5',
//     state: ['DEPLOYED']
// });
// get accounts without filter (returns 1000 accounts max)
//         const accounts = await api.metatraderAccountApi.getAccounts();


        const account = await api.metatraderAccountApi.getAccount(accountId);
        // const account = await api.metatraderDemoAccountApi.getAccount(accountId);

// wait until account is deployed and connected to broker
        if (account.state !== 'DEPLOYED') {
            await account.deploy();
        } else {
            console.log('Account already deployed');
        }
        consola.info('等待连接到服务商...');
        if (account.connectionStatus !== 'CONNECTED') {
            await account.waitConnected();
        }

        consola.info(`正在连接...`);
        const connection = await account.connect();


        consola.info(`正在同步数据...`);
        await connection.waitSynchronized();

// 获取账户信息
        consola.info(`同步成功`);
        // let accountInfo = await connection.getAccountInformation();
        // console.log('当前账户信息: ' + JSON.stringify(accountInfo));

        // console.log('Testing terminal state access');
        let terminalState = connection.terminalState;
        console.log('当前终端状态:', terminalState.connected === true ? "已连接" : "已断开");
        consola.success(`当前账户余额: ${terminalState.accountInformation.balance} 美元`);

// 通过订单号获取订单历史记录
// console.log('通过订单号获取订单历史记录: ' + await connection.getHistoryOrdersByPosition('1234567'));

// 通过时间区间获取订单历史记录
// console.log('通过时间区间获取订单历史记录: ' + await connection.getHistoryOrdersByTimeRange('20210817', '20210817'));

// first, subscribe to market data
        console.log('开始订阅 GOLD 数据...');
        await connection.subscribeToMarketData(SYMBOL);

// read symbols available
//         console.log('symbols:' + await connection.getSymbols());
// read constract specification
//         console.log(await connection.getSymbolSpecification('GOLD'));
// 读取当前价格
        for (var i = 0; i < 1; i ++) {
            let symbolPrice = await connection.getSymbolPrice(SYMBOL);
            consola.info('GOLD 买入价格: ' +  symbolPrice.ask + ' 卖出价格: ' +  symbolPrice.bid);
            await tool.sleep(3 * 1000);
        }

// 获取蜡烛5分钟的价格
        var candle = await connection.getCandle('76ef6692-3e6b-450a-a221-713d702b4e96', 'GOLD');
        console.log("candle = " + JSON.stringify(candle));

// 当不使用的时候取消订阅
        console.log("取消订阅 GOLD");
        await connection.unsubscribeFromMarketData(SYMBOL);


// 市场价执行买入和卖出
// consola.info(await connection.createMarketBuyOrder('XAUUSD', 0.1));
// consola.info(await connection.createMarketSellOrder('XAUUSD', 0.1));


// console.log(await connection.createLimitBuyOrder('GBPUSD', 0.07, 1.0, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
// console.log(await connection.createLimitSellOrder('GBPUSD', 0.07, 1.5, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
// console.log(await connection.createStopBuyOrder('GBPUSD', 0.07, 1.5, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
// console.log(await connection.createStopSellOrder('GBPUSD', 0.07, 1.0, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
// console.log(await connection.createStopLimitBuyOrder('GBPUSD', 0.07, 1.5, 1.4, 0.9, 2.0, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
// console.log(await connection.createStopLimitSellOrder('GBPUSD', 0.07, 1.0, 1.1, 2.0, 0.9, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAl'}));
// console.log(await connection.modifyPosition('46870472', 2.0, 0.9));
// console.log(await connection.closePositionPartially('46870472', 0.9));

// console.log(await connection.closeBy('46870472', '46870482'));

// console.log(await connection.closePositionsBySymbol('XAUUSD'));
// console.log(await connection.modifyOrder('46870472', 1.0, 2.0, 0.9));
// console.log(await connection.cancelOrder('46870472'));

// if you need to, check the extra result information in stringCode and numericCode properties of the response
        /*const result = await connection.createMarketBuyOrder('XAUUSD', 0.1);
        consola.info(`Trade successful, result message is ${result}`);
        if (result.stringCode == "TRADE_RETCODE_DONE") {
            // 订单ID（用于后续将订单进行关闭）
            let orderId = result.orderId;

            // 根据订单ID关闭订单
            console.log(await connection.closePosition(orderId));
        } else {
            console.log('交易失败');
        }*/

        // 使用完毕后取消发布，节省服务器资源
        await account.undeploy();
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

testMetaApiSynchronization();