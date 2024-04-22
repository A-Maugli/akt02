/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'
import * as algokit from '@algorandfoundation/algokit-utils'

/* Example usage
<BizKorBootstrap
  buttonClass="btn m-2"
  buttonLoadingNode={<span className="loading loading-spinner" />}
  buttonNode="Call bootstrap"
  typedClient={typedClient}
  assetPrice={assetPrice}
  assetAmount={assetAmount}
  sellPeriodLength={sellPeriodLength}
  assetValidityPeriod={assetValidityPeriod}
/>
*/
type BizKorBootstrapArgs = BizKor['methods']['bootstrap(uint64,uint64,uint64,uint64)void']['argsObj']

type Props = {
  buttonClass: string
  buttonLoadingNode?: ReactNode
  buttonNode: ReactNode
  typedClient: BizKorClient
  assetPrice: BizKorBootstrapArgs['assetPrice']
  assetAmount: BizKorBootstrapArgs['assetAmount']
  sellPeriodLength: BizKorBootstrapArgs['sellPeriodLength']
  assetValidityPeriod: BizKorBootstrapArgs['assetValidityPeriod']
}

const BizKorBootstrap = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }

  const callMethod = async () => {
    setLoading(true)
    console.log(`Calling bootstrap`)
    await props.typedClient.bootstrap(
      {
        assetPrice: props.assetPrice,
        assetAmount: props.assetAmount,
        sellPeriodLength: props.sellPeriodLength,
        assetValidityPeriod: props.assetValidityPeriod,
      },
      {
        sender: sender, 
        sendParams: { fee: algokit.microAlgos(2_000) }
      },
    )
    setLoading(false)
  }

  return (
    <button className={props.buttonClass} onClick={callMethod}>
      {loading ? props.buttonLoadingNode || props.buttonNode : props.buttonNode}
    </button>
  )
}

export default BizKorBootstrap