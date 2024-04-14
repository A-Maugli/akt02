/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'

/* Example usage
<BizKorGetAppCreatorAddress
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call getAppCreatorAddress"
  typedClient={typedClient}
/>
*/
type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
}

const BizKorGetAppCreatorAddress = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling getAppCreatorAddress`)
    await props.typedClient.getAppCreatorAddress(
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

export default BizKorGetAppCreatorAddress