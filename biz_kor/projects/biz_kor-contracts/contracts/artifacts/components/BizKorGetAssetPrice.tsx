/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<BizKorGetAssetPrice
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call getAssetPrice"
  typedClient={typedClient}
/>
*/
type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
}

const BizKorGetAssetPrice = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling getAssetPrice`)
    await props.typedClient.getAssetPrice(
      {},
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

export default BizKorGetAssetPrice