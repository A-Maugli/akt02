import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { BizKorClient } from '../contracts/clients/BizKorClient';

const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });

let appClient: BizKorClient;

describe('BizKor', () => {
  let sender: algosdk.Account;
  let axferTx : algosdk.AssetTransferTxn;

  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount, kmd } = fixture.context;

    sender = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'Biz-Kor-ASA-account',
        fundWith: algokit.algos(100),
      },
      algod,
      kmd
    );

    const params = await algod.getTransactionParams().do();
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      total: 10,
      decimals: 0,
      assetName: 'BKTOVJ', // Bizalmi Kör Tulajdonrész Opciós Vételi Jog
      unitName: 'Biz Kör Tulajdonrész Opciós Vételi Jog',
      assetURL: 'https://algorand.hu/bk/bktovj.html',
      assetMetadataHash: undefined,
      defaultFrozen: false,
      manager: sender.addr,
      reserve: sender.addr,
      freeze: sender.addr,
      clawback: sender.addr,
      suggestedParams: params,
    });
    const signedTxn = txn.signTxn(sender.sk);
    const txn1 = await algod.sendRawTransaction(signedTxn).do();
    const confirmedTxn = await algosdk.waitForConfirmation(algod, txn1.txId, 4);
    console.log('Tranzakció megerősítve: ', confirmedTxn['confirmed-round']);
    console.log('confirmedTxn:', confirmedTxn);

    appClient = new BizKorClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    await appClient.create.createApplication({});
  });
  test('initGlobalKeys', async () => {
    await appClient.initGlobalKeys({});
  });
  test('createAsset', async () => {
    await appClient.appClient.fundAppAccount(algokit.microAlgos(200_000));
    // fee must be 2000 /uAlgos, due to the inner transaction
    const asset = await appClient.createAssetTest({}, { sendParams: { fee: algokit.microAlgos(2_000) } });
    // const assetID = asset as unknown as AssetID;
    // await appClient.optIntoAsset({ asset: asset });
    // console.log('asset:', asset);
    console.log('asset id:', asset.return?.valueOf());
  });
  test('optIntoAsset', async () => {
    await appClient.appClient.fundAppAccount(algokit.microAlgos(200_000));
    // fee must be 2000 /uAlgos, due to the inner transaction
    const asset = await appClient.createAssetTest({}, { sendParams: { fee: algokit.microAlgos(2_000) } });
    const assetID = asset.return!.valueOf();
    console.log(assetID);
    // fee must be 2000 /uAlgos, due to the inner transaction
    await appClient.optIntoAsset({ asset: assetID }, { sendParams: { fee: algokit.microAlgos(2_000) } });
  });
  test('getGlobalState', async () => {
    const globalState = await appClient.getGlobalState();
    const assetAmount = globalState.assetAmount?.asNumber();
    const assetPrice = globalState.assetPrice?.asNumber();
    const asset = globalState.asset?.asNumber();
    const sellPeriodEnd = globalState.sellPeriodEnd?.asNumber();
    // console.log('globalState:', globalState);
    console.log('globalState assetAmount:', assetAmount);
    console.log('globalState assetPrice:', assetPrice);
    console.log('globalState asset:', asset);
    console.log('globalState sellPeriodEnd:', sellPeriodEnd);
  });
  test('assetSellStart', async () => {
    const price = 2_000_000;
    const length = 1000;
    const appId = await appClient.appClient.getAppReference();
    console.log('appId:', appId);
    const appAddr = algosdk.getApplicationAddress(appId);
    console.log('appAddr:', appAddr);
    /*
    const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender.addr,
      to: appAddr,
      amount: 10,
    });
    await appClient.startAssetSell({ price, length, axfer });
    */
  });
  test.skip('deleteApplication', async () => {
    // fee must be 3000 /uAlgos, due to the inner transaction
    const tx = await appClient.delete.deleteApplication({}, { sendParams: { fee: algokit.microAlgos(3_000) } });
    console.log('deleteApplication, tx:', tx);
  });
/*
  test('sum', async () => {
    const a = 13;
    const b = 37;
    const sum = await appClient.doMath({ a, b, operation: 'sum' });
    expect(sum.return?.valueOf()).toBe(BigInt(a + b));
  });

  test('difference', async () => {
    const a = 13;
    const b = 37;
    const diff = await appClient.doMath({ a, b, operation: 'difference' });
    expect(diff.return?.valueOf()).toBe(BigInt(a >= b ? a - b : b - a));
  });

  test('hello', async () => {
    const diff = await appClient.hello({ name: 'world!' });
    expect(diff.return?.valueOf()).toBe('Hello, world!');
  });
*/
});
