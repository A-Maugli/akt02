/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<BizKorStartAssetSell
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call startAssetSell"
  typedClient={typedClient}
  price={price}
  length={length}
  axfer={axfer}
/>
*/
type BizKorStartAssetSellArgs = BizKor['methods']['startAssetSell(uint64,uint64,axfer)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
  price: BizKorStartAssetSellArgs['price']
  length: BizKorStartAssetSellArgs['length']
  axfer: BizKorStartAssetSellArgs['axfer']
}

const BizKorStartAssetSell = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling startAssetSell`)
    await props.typedClient.startAssetSell(
      {
        price: props.price,
        length: props.length,
        axfer: props.axfer,
      },
      { sender },
    )
    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default BizKorStartAssetSell