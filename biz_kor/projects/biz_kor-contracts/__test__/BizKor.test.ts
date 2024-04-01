/* eslint-disable no-console */
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture, getTestAccount } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk, { Transaction } from 'algosdk';
import AlgodClient from 'algosdk/dist/types/client/v2/algod/algod';
import SuggestedParamsRequest from 'algosdk/dist/types/client/v2/algod/suggestedParams';
import { BizKorClient } from '../contracts/clients/BizKorClient';
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';

const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });

let appClient: BizKorClient;

describe('BizKor', () => {
  let sender1: algosdk.Account;
  let signer1: TransactionSignerAccount;

  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algod, testAccount, kmd } = fixture.context;

    sender1 = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'Buyer of Biz.Kör. token',
        fundWith: algokit.algos(100),
      },
      algod,
      kmd
    );
    console.log('sender1 addr:', sender1.addr);
    // signer1 = algosdk.makeBasicAccountTransactionSigner(sender1);
    signer1 = {
      addr: sender1.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(sender1.sk));
      },
    };

    appClient = new BizKorClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algod
    );

    await appClient.create.createApplication({});
    // console.log('app create tx:', tx);
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
  });

  test('getGlobalState', async () => {
    const globalState = await appClient.getGlobalState();
    const assetAmountInitial = globalState.assetAmountInitial?.asNumber();
    const assetAmount = globalState.assetAmount?.asNumber();
    const assetPrice = globalState.assetPrice?.asNumber();
    const asset = globalState.asset?.asNumber();
    const sellPeriodEnd = globalState.sellPeriodEnd?.asNumber();
    // console.log('globalState:', globalState);
    console.log('globalState assetAmountInitial:', assetAmountInitial);
    console.log('globalState assetAmount:', assetAmount);
    console.log('globalState assetPrice:', assetPrice);
    console.log('globalState asset:', asset);
    console.log('globalState sellPeriodEnd:', sellPeriodEnd);
  });
  test('buyAsset', async () => {
    const { algod, testAccount } = fixture.context;
    const params = await algod.getTransactionParams().do();
    await appClient.appClient.fundAppAccount(algokit.microAlgos(400_000));

    // Opt in to asset
    const globalState = await appClient.getGlobalState();
    const asset = globalState.asset!.asNumber();
    console.log('Try to opt in to asset: ', asset);
    const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender1.addr,
      to: sender1.addr,
      amount: 0,
      assetIndex: asset,
      suggestedParams: params,
    });
    const stxn1 = txn1.signTxn(sender1.sk);
    const txn2 = await algod.sendRawTransaction(stxn1).do();
    await algosdk.waitForConfirmation(algod, txn2.txId, 4);

    // Make a payment tx, to buy asset
    const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender1.addr,
      to: testAccount.addr,
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
    console.log('txId:', txId);
  });
  test.skip('deleteApplication', async () => {
    // fee must be 3000 /uAlgos, due to the inner transaction
    const tx = await appClient.delete.deleteApplication({}, { sendParams: { fee: algokit.microAlgos(3_000) } });
    console.log('deleteApplication, tx:', tx);
  });
});
