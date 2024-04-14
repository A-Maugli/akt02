/* eslint-disable no-console */
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk, { Transaction } from 'algosdk';
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { BizKorClient } from '../contracts/clients/BizKorClient';

const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });

let appClient: BizKorClient;

describe('BizKor', () => {
  let acc1: algosdk.Account;
  let signer1: TransactionSignerAccount;
  let acc2: algosdk.Account;

  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, kmd } = fixture.context;

    acc1 = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'Buyer of Biz.Kör. token',
        fundWith: algokit.algos(100),
      },
      algod,
      kmd
    );
    console.log('acc1.addr (token buyer):', acc1.addr);
    // signer1 = algosdk.makeBasicAccountTransactionSigner(sender1);
    signer1 = {
      addr: acc1.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(acc1.sk));
      },
    };

    acc2 = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'App creator',
        fundWith: algokit.algos(100),
      },
      algod,
      kmd
    );
    console.log('acc2.addr (app creator):', acc2.addr);

    appClient = new BizKorClient(
      {
        sender: acc2,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    await appClient.create.createApplication({});
  });

  test('bootstrap', async () => {
    await appClient.appClient.fundAppAccount(algokit.microAlgos(400_000));
    const assetPrice = 1_000_000;
    const assetAmount = 10;
    const sellPeriodLength = 1000;
    // fee must be 2000 /uAlgos, due to the inner transaction
    await appClient.bootstrap(
      { assetPrice, assetAmount, sellPeriodLength },
      { sendParams: { fee: algokit.microAlgos(2_000) } }
    );
    const globalState = await appClient.getGlobalState();
    expect(globalState.asa_total?.asNumber()).toBe(assetAmount);
    expect(globalState.asa_amt?.asNumber()).toBe(assetAmount);
    expect(globalState.asa_price?.asNumber()).toBe(assetPrice);
  });

  test('getGlobalState', async () => {
    const { algod } = fixture.context;
    const version = await appClient.getAppVersion({});
    console.log('appClient.getAppVersion({}):', version.return);
    const appCreatorAddr = await appClient.getAppCreatorAddress({});
    console.log('appClient.getAppCreatorAddress({}):', appCreatorAddr.return);
    const assetAmountInitial = await appClient.getAssetAmountInitial({});
    console.log('appClient.getAssetAmountInitial({}):', assetAmountInitial.return);

    const globalState = await appClient.getGlobalState();
    const apv = globalState.apv?.asString();
    const apca = globalState.apca?.asString();
    const asaTotal = globalState.asa_total?.asNumber();
    const asaAmt = globalState.asa_amt?.asNumber();
    const asaPrice = globalState.asa_price?.asNumber();
    const asaId = globalState.asa_id?.asNumber();
    const end = globalState.end?.asNumber();
    // console.log('globalState:', globalState);
    console.log('getGlobalState apv (appVersion):', apv);
    console.log('getGlobalState apca (appCreatorAddress):', apca);
    console.log('getGlobalState asa_total (assetAmountInitial):', asaTotal);
    console.log('getGlobalState asa_amt (assetAmount):', asaAmt);
    console.log('getGlobalState asa_price (assetPrice):', asaPrice);
    console.log('getGlobalState asa_id (asset):', asaId);
    console.log('getGlobalState end (sellPeriodEnd):', end);
  });
  test('buyAsset two times', async () => {
    const { algod, testAccount } = fixture.context;
    const params = await algod.getTransactionParams().do();
    await appClient.appClient.fundAppAccount(algokit.microAlgos(400_000));

    // Opt in to asset
    const globalState = await appClient.getGlobalState();
    const asset = globalState.asa_id!.asNumber();
    console.log('Try to opt in to asset: ', asset, testAccount.addr);
    const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: acc1.addr,
      to: acc1.addr,
      amount: 0,
      assetIndex: asset,
      suggestedParams: params,
    });
    const stxn1 = txn1.signTxn(acc1.sk);
    const txn2 = await algod.sendRawTransaction(stxn1).do();
    await algosdk.waitForConfirmation(algod, txn2.txId, 4);

    // Make a payment tx, to buy asset
    const appRef = await appClient.appClient.getAppReference();
    // const appAddres = await algosdk.getApplicationAddress(appRef.appId);
    console.log('buyAsset: testAccount.addr ', testAccount.addr);
    console.log('buyAsset: appRef.appAddress ', appRef.appAddress);
    console.log('buyAsset: appCreatorAddr ', acc2.addr);
    const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: acc1.addr,
      to: acc2.addr,
      amount: 1_000_000,
      suggestedParams: params,
    });

    // Buy asset
    const compose = appClient.compose().buyAsset(
      {
        payment: tx1,
      },
      {
        sender: signer1,
        sendParams: {
          fee: algokit.microAlgos(3000),
        },
        assets: [Number(asset)],
      }
    );

    const atc = await compose.atc();
    const txs = atc.buildGroup().map((tx) => tx.txn);
    const signed = await signer1.signer(
      txs,
      Array.from(Array(txs.length), (_, i) => i)
    );
    const { txId } = await algod.sendRawTransaction(signed).do();
    console.log('buyAsset txId:', txId);
  });
  test('buyAsset', async () => {
    const { algod, testAccount } = fixture.context;
    const params = await algod.getTransactionParams().do();
    await appClient.appClient.fundAppAccount(algokit.microAlgos(400_000));

    // Opt in to asset
    const globalState = await appClient.getGlobalState();
    const asset = globalState.asa_id!.asNumber();
    console.log('Try to opt in to asset: ', asset, testAccount.addr);
    const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: acc1.addr,
      to: acc1.addr,
      amount: 0,
      assetIndex: asset,
      suggestedParams: params,
    });
    const stxn1 = txn1.signTxn(acc1.sk);
    const txn2 = await algod.sendRawTransaction(stxn1).do();
    await algosdk.waitForConfirmation(algod, txn2.txId, 4);

    // Make a payment tx, to buy asset
    const appRef = await appClient.appClient.getAppReference();
    // const appAddres = await algosdk.getApplicationAddress(appRef.appId);
    console.log('buyAsset: testAccount.addr ', testAccount.addr);
    console.log('buyAsset: appRef.appAddress ', appRef.appAddress);
    console.log('buyAsset: appCreatorAddr ', acc2.addr);
    const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: acc1.addr,
      to: acc2.addr,
      amount: 1_000_000,
      suggestedParams: params,
    });

    // Buy asset
    const compose = appClient.compose().buyAsset(
      {
        payment: tx1,
      },
      {
        sender: signer1,
        sendParams: {
          fee: algokit.microAlgos(3000),
        },
        assets: [Number(asset)],
      }
    );

    const atc = await compose.atc();
    const txs = atc.buildGroup().map((tx) => tx.txn);
    const signed = await signer1.signer(
      txs,
      Array.from(Array(txs.length), (_, i) => i)
    );
    const { txId } = await algod.sendRawTransaction(signed).do();
    console.log('buyAsset txId:', txId);
  });
  test.skip('deleteApplication', async () => {
    // Fails: "logic eval error: inner tx 0 failed: cannot close asset ID in allocating account."
    const globalState = await appClient.getGlobalState();
    const asset = globalState.asa_id!.asNumber();
    // fee must be 3000 /uAlgos, due to the inner transaction
    const tx = await appClient.delete.deleteApplication(
      { ASAid: asset },
      { sendParams: { fee: algokit.microAlgos(3_000) } }
    );
    console.log('deleteApplication, tx:', tx);
  });
});
