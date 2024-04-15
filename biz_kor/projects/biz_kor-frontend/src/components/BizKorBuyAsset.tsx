/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'
import * as algosdk from 'algosdk'
import * as algokit from '@algorandfoundation/algokit-utils'
import AlgodClient from 'algosdk/dist/types/client/v2/algod/algod'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { useSnackbar } from 'notistack'

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
  //payment: BizKorBuyAssetArgs['payment']
}

const BizKorBuyAsset = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer, sendTransactions } = useWallet()
  const sender = { signer, addr: activeAddress! }
  const { enqueueSnackbar } = useSnackbar()

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
    const asset = globalState.asa_id!.asNumber();
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
    const price = globalState.asa_price!.asNumber();

    const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress!,
      to: appAddr!,
      amount: price,
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
      //const { txId } = await algod.sendRawTransaction(signed).do();
      //console.log('buyAsset txId:', txId);

      try {
        enqueueSnackbar('A vételi tranzakció elküldése...', { variant: 'info' })
        const waitRoundsToConfirm = 4
        const { id } = await sendTransactions(signed, waitRoundsToConfirm)
        enqueueSnackbar(`A tranzakció elküldve: ${id}`, { variant: 'success' })
      } catch (e: any) {
        const msg='Nem sikerült a tranzakció elküldése';
        if (e.response.body.data.pc === 439) {
          enqueueSnackbar(`${msg}, mert a tranzakció típusa nem fizetési tranzakció`, { variant: 'error' })
        }
        else if (e.response.body.data.pc === 454) {
          enqueueSnackbar(`${msg}, mert véget ért az értékesítési időszak`, { variant: 'error' })
        }
        else if (e.response.body.data.pc === 464) {
          enqueueSnackbar(`${msg}, mert Ön már rendelkezik ezzel a zsetonnal`, { variant: 'error' })
        }
        else if (e.response.body.data.pc === 472) {
          enqueueSnackbar(`${msg}, mert a fizetési tranzakció küldője nem azonos az app call tranzakció küldőjével`, { variant: 'error' })
        }
        else if (e.response.body.data.pc === 480) {
          enqueueSnackbar(`${msg}, mert a fizetési tranzakció címzettje nem azonos az app címével`, { variant: 'error' })
        }
        else if (e.response.body.data.pc === 488) {
          enqueueSnackbar(`${msg}, mert a fizetési tranzakció összege kisebb, mint a zseton ára`, { variant: 'error' })
        }      
        else if (e.response.body.data.pc === 496) {
          enqueueSnackbar(`${msg}, mert a fizetési tranzakció összege nagyobb, mint a zseton ára`, { variant: 'error' })
        }      
        else if (e.response.body.data.pc === 504) {
          enqueueSnackbar(`${msg}, mert a fizetési tranzakció RekeyTo mezője nem nulla`, { variant: 'error' })
        }
        else if (e.response.body.data.pc === 512) {
          enqueueSnackbar(`${msg}, mert a fizetési tranzakció CloseRemainderTo mezője nem nulla`, { variant: 'error' })
        }
        else if (e.response.body.data.pc === 515) {
          enqueueSnackbar(`${msg}, mert nincs már eladható zseton`, { variant: 'error' })
        }
        else {
          enqueueSnackbar(`${msg}, hiba: `+e, { variant: 'error' })
        }
      }

    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default BizKorBuyAsset