/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'
import * as algokit from '@algorandfoundation/algokit-utils'

/* Example usage
<BizKorClawbackNoInc
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call clawback"
  typedClient={typedClient}
  addr={addr}
/>
*/
type BizKorClawbackNoIncArgs = BizKor['methods']['clawback(address)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
  addr: BizKorClawbackNoIncArgs['addr']
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const BizKorClawbackNoInc = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true)
    console.log(`Calling clawback`)
    console.log('Clawback addr: ', props.addr);
    // get asset
    const globalState1 = await props.typedClient.getGlobalState();
    const asset = globalState1.asa_id!.asNumber();
    console.log('Clawback asset: ', asset);

    // call clawback
    await props.typedClient.clawback(
      {
        addr: props.addr,
      },
      { sender, sendParams: { fee: algokit.transactionFees(2) }, assets: [asset]},
    )
    setLoading(false)
    if (props.onClick) {
      props.onClick(event);
    }
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default BizKorClawbackNoInc
