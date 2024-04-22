/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'
import * as algokit from '@algorandfoundation/algokit-utils'
import * as algosdk from 'algosdk'

/* Example usage
<BizKorClawback
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call clawback"
  typedClient={typedClient}
  addr={addr}
/>
*/
type BizKorClawbackArgs = BizKor['methods']['clawback(address)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
  addr: BizKorClawbackArgs['addr']
}

const BizKorClawback = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling clawback`)
    console.log('Clawback addr: ', props.addr);
    // get asset
    const globalState = await props.typedClient.getGlobalState();
    const asset = globalState.asa_id!.asNumber();
    console.log('Clawback asset: ', asset);

    // call clawback
    await props.typedClient.clawback(
      {
        addr: props.addr,
      },
      { sender, sendParams: { fee: algokit.microAlgos(2_000) }, assets: [asset]},
    )
    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default BizKorClawback
