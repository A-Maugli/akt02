/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'
import * as algokit from '@algorandfoundation/algokit-utils'

/* Example usage
<BizKorCreateApplication
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call createApplication"
  typedClient={typedClient}
/>
*/
type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
  setAppID: (appID: number) => void
}

const BizKorCreateApplication = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling createApplication`)
    await props.typedClient.create.createApplication(
      {},
      { sender: sender },
    )

    console.log(`Calling fundAppAccount`)
    await props.typedClient.appClient.fundAppAccount({
      sender: sender, amount: algokit.microAlgos(400_000)
    })

    console.log(`Calling getAppReference`)
    const { appId } = await props.typedClient.appClient.getAppReference();
    props.setAppID(Number(appId))

    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default BizKorCreateApplication