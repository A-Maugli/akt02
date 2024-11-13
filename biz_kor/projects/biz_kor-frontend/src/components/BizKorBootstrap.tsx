/* eslint-disable no-console */
import { ReactNode, useState } from 'react'
import { BizKor, BizKorClient } from '../contracts/BizKorClient'
import { useWallet } from '@txnlab/use-wallet'
import * as algokit from '@algorandfoundation/algokit-utils'
import { useSnackbar } from 'notistack'

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
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const BizKorBootstrap = (props: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const { activeAddress, signer } = useWallet()
  const sender = { signer, addr: activeAddress! }
  const { enqueueSnackbar } = useSnackbar()

  const callMethod = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true)
    console.log(`Calling bootstrap`)
    try {
      enqueueSnackbar('A bootstrap tranzakció elküldése...', { variant: 'info' })
      const result = await props.typedClient.bootstrap(
        {
          assetPrice: props.assetPrice,
          assetAmount: props.assetAmount,
          sellPeriodLength: props.sellPeriodLength,
          assetValidityPeriod: props.assetValidityPeriod,
        },
        {
          sender: sender,
          sendParams: { fee: algokit.transactionFees(2) }
        },
      )
      //console.log('bootstrap result: ', result)
      enqueueSnackbar(`A tranzakció elküldve`, { variant: 'success' })   // Hogyan lehetne a tx id-t kiírni?
    } catch (e: any) {
      const msg = 'Nem sikerült a tranzakció elküldése';
      enqueueSnackbar(`${msg}, hiba: `+e, { variant: 'error' })
    }
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

export default BizKorBootstrap
