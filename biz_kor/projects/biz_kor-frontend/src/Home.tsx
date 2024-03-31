// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet'
import React, { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import AppCalls from './components/AppCalls'
import BizKorCreateApplication from './components/BizKorCreateApplication'
import { BizKorClient } from './contracts/BizKorClient'
import * as algokit from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import { stat } from 'fs'

interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appID, setAppID] = useState<number>(0)
  const [amount, setAmount] = useState<number>(0)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  // Get the available amount of tokens
  const getAmount = async () => {
    console.log('getAmount() is called')
    try {
      const state = await typedClient.getGlobalState()
      setAmount(state.assetAmount!.asNumber())
    } catch (e) {
      console.warn(e)
      setAmount(0)
    }
  }

  // When the appID changes, call getAmount
  useEffect(() => {
    getAmount();
  }, [appID])

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()

  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token
  })

  const typedClient = new BizKorClient({
    resolveBy: 'id',
    id: appID
  }, algodClient)

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Üdv a <div className="font-bold">Bizalmi Kör</div> DAO-jában
          </h1>
          <p className="py-6">
            Bizalmi Kör tulajdonrész opciós vételi jog értékesítés
          </p>

          <div className="grid">
            <div className="divider" />

            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Kapcsolódás a pénztárcához
            </button>

            <h2 className="font-bold m-2">DAO app id</h2>
            <input type="number"
              className="input input-bordered"
              value={appID}
              onChange={(ev) => setAppID(ev.currentTarget.valueAsNumber || 0)}>
            </input>

            <h2 className="font-bold m-2">Zsetonok száma: {amount}</h2>

            {activeAddress && appID === 0 && (
              <BizKorCreateApplication
                buttonClass="btn m-2"
                buttonLoadingNode={<span className="loading loading-spinner" />}
                buttonNode="A DAO létrehozása"  // BizKorCreateApplication, csak egyszer!
                typedClient={typedClient}
                setAppID={setAppID}
              />
            )}

            {activeAddress && (
              <button data-test-id="appcalls-demo" className="btn m-2" onClick={toggleAppCallsModal}>
                Contract Interactions Demo
              </button>
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
