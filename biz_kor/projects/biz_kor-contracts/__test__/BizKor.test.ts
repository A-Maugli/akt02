/* eslint-disable no-console */
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture, getTestAccount } from '@algorandfoundation/algokit-utils/testing';
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
  let signer2: TransactionSignerAccount;

  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount, kmd } = fixture.context;

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
    // signer1 = algosdk.makeBasicAccountTransactionSigner(sender1);
    signer2 = {
      addr: acc2.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(acc2.sk));
      },
    };

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
    expect(globalState.assetAmountInitial?.asNumber()).toBe(assetAmount);
    expect(globalState.assetAmount?.asNumber()).toBe(assetAmount);
    expect(globalState.assetPrice?.asNumber()).toBe(assetPrice);
  });

  test('getGlobalState', async () => {
    const globalState = await appClient.getGlobalState();
    const assetAmountInitial = globalState.assetAmountInitial?.asNumber();
    const assetAmount = globalState.assetAmount?.asNumber();
    const assetPrice = globalState.assetPrice?.asNumber();
    const asset = globalState.asset?.asNumber();
    const sellPeriodEnd = globalState.sellPeriodEnd?.asNumber();
    // console.log('globalState:', globalState);
    console.log('getGlobalState assetAmountInitial:', assetAmountInitial);
    console.log('getGlobalState assetAmount:', assetAmount);
    console.log('getGlobalState assetPrice:', assetPrice);
    console.log('getGlobalState asset:', asset);
    console.log('getGlobalState sellPeriodEnd:', sellPeriodEnd);
  });
  test('buyAsset', async () => {
    const { algod, testAccount } = fixture.context;
    const params = await algod.getTransactionParams().do();
    await appClient.appClient.fundAppAccount(algokit.microAlgos(400_000));

    // Opt in to asset
    const globalState = await appClient.getGlobalState();
    const asset = globalState.asset!.asNumber();
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
        ASAid: asset,
      },
      {
        sender: signer1,
        sendParams: {
          fee: algokit.microAlgos(2000),
        },
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
    const globalState = await appClient.getGlobalState();
    const asset = globalState.asset!.asNumber();
    // fee must be 3000 /uAlgos, due to the inner transaction
    const tx = await appClient.delete.deleteApplication(
      { ASAid: asset },
      { sendParams: { fee: algokit.microAlgos(3_000) } }
    );
    console.log('deleteApplication, tx:', tx);
  });
});
