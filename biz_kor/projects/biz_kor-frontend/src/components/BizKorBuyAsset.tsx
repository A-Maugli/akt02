/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'
import * as algosdk from 'algosdk'
import * as algokit from '@algorandfoundation/algokit-utils'
import AlgodClient from 'algosdk/dist/types/client/v2/algod/algod'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

/* Example usage
<BizKorBuyAsset
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call buyAsset"
  typedClient={typedClient}
  payment={payment}
/>
*/
type BizKorBuyAssetArgs = BizKor['methods']['buyAsset(pay)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
  payment: BizKorBuyAssetArgs['payment']
}

const BizKorBuyAsset = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)

    const algodConfig = getAlgodConfigFromViteEnvironment()
    const algod = algokit.getAlgoClient({
      server: algodConfig.server,
      port: algodConfig.port,
      token: algodConfig.token,
    })

    console.log(`Opt in to asset`)
    const params = await algod.getTransactionParams().do();
    const globalState = await props.typedClient.getGlobalState();
    const asset = globalState.asset!.asNumber();
    const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAddress!,
        to: activeAddress!,
        amount: 0,
        assetIndex: asset,
        suggestedParams: params,
      });
    algokit.sendTransaction({transaction: txn1, from: sender }, algod);
    
    console.log(`Calling buyAsset`)
    const appRef = await props.typedClient.appClient.getAppReference();
    const appAddr = appRef.appAddress;
    const appCreatorAddr = activeAddress;  // @todo: retrieve appCreatorAddr

    const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress!,
      to: appCreatorAddr!,
      amount: 10_000,
      suggestedParams: params,
    });

    const compose = props.typedClient.compose().buyAsset(
      {
        payment: tx1,
      },
      {
        sender: sender,
        sendParams: {
          fee: algokit.microAlgos(3000),
        },
        assets: [Number(asset)],
      }
    );

    const atc = await compose.atc();
      const txs = atc.buildGroup().map((tx) => tx.txn);
      const signed = await signer(
        txs,
        Array.from(Array(txs.length), (_, i) => i)
      );
      const { txId } = await algod.sendRawTransaction(signed).do();
      console.log('buyAsset txId:', txId);

    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default BizKorBuyAsset