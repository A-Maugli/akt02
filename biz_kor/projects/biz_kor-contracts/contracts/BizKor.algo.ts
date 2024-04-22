import { Contract } from '@algorandfoundation/tealscript';

// History:
//  v1.0, 07-Apr-2024, LG
//    - in buyAsset, asset is also passed as param in the txn foreign array.
//      See tests, "assets: [Number(asset)],"
//      Otherwise there is "unavailable asset" error
//  v1.1, 14-Apr-2024, LG
//    - added appVersion as a global key-value pair
//    - added getters for global values
//    - modified buyAsset, payment is due to the app address (formerly: app creator address)
//    - added sendAlgos, to send Algos back from the app to the app creator address
//    - added clawback, to force moving back assets from a given address to the app address
//    - added deleteAsset, to delete assets from the app
//    - modified deleteApplication
//  v1.2, 22-Apr-2024, LG
//    - mod clawback, to increase assetAmount
//    - mod buyAsset, to unfreeze assetId first (test cycle: buy, clawback, buy)
//    - mod buyAsset, make buyer to opt into asset
//    - mod bootstrap, new param: asaValidityPeriod

// eslint-disable-next-line no-unused-vars
class BizKor extends Contract {
  appVersion = GlobalStateKey<string>({ key: 'apv' });

  appCreatorAddress = GlobalStateKey<Address>({ key: 'apca' });

  assetAmountInitial = GlobalStateKey<uint64>({ key: 'asa_total' });

  assetAmount = GlobalStateKey<uint64>({ key: 'asa_amt' });

  assetPrice = GlobalStateKey<uint64>({ key: 'asa_price' });

  asset = GlobalStateKey<AssetID>({ key: 'asa_id' });

  sellPeriodEnd = GlobalStateKey<uint64>({ key: 'end' });

  assetValidityPeriod = GlobalStateKey<uint64>({ key: 'asa_v' });

  /**
   * Init the values of global keys
   */
  createApplication(): void {
    this.appVersion.value = 'v1.2';
    this.appCreatorAddress.value = globals.creatorAddress;
    this.assetAmountInitial.value = 0;
    this.assetAmount.value = 0;
    this.assetPrice.value = 0;
    this.asset.value = AssetID.zeroIndex;
    this.sellPeriodEnd.value = 0;
    this.assetValidityPeriod.value = 0;
  }

  /**
   * create ASA, set global key values
   * @param assetPrice ASA price in microAlgos
   * @param assetAmount ASA inital amount in pieces
   * @param sellPeriodLength sell period length in secs
   * @param assetValidityPeriod asset validity in secs, after that time it can be clawbacked
   */
  bootstrap(assetPrice: uint64, assetAmount: uint64, sellPeriodLength: uint64, assetValidityPeriod: uint64) {
    /// allow only the app creator to call this method
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    /// assert bootstrap hasn't been called yet
    assert(this.assetAmountInitial.value === 0);

    // create asset
    const asset = sendAssetCreation({
      configAssetTotal: assetAmount,
      configAssetDecimals: 0,
      configAssetName: 'Bizalmi Kör Zseton',
      configAssetUnitName: 'BKTOVJ1',
      configAssetURL: 'https://algorand.hu/bk/bktovj.html',
      configAssetDefaultFrozen: 0,
      configAssetManager: globals.currentApplicationAddress,
      configAssetReserve: globals.currentApplicationAddress,
      configAssetFreeze: globals.currentApplicationAddress,
      configAssetClawback: globals.currentApplicationAddress,
    });

    // set global values
    this.assetAmountInitial.value = assetAmount;
    this.assetAmount.value = assetAmount;
    this.assetPrice.value = assetPrice;
    this.asset.value = asset;
    this.sellPeriodEnd.value = globals.latestTimestamp + sellPeriodLength;
    this.assetValidityPeriod.value = assetValidityPeriod;
  }

  /**
   * get app creator address
   * @returns app creator address
   */
  getAppCreatorAddress(): Address {
    return this.appCreatorAddress.value;
  }

  /**
   * get app version
   * @returns app version
   */
  getAppVersion(): string {
    return this.appVersion.value;
  }

  /**
   * get asa initial amount
   * @returns asa amount minted initially
   */
  getAssetAmountInitial(): uint64 {
    return this.assetAmountInitial.value;
  }

  /**
   * get asa amount
   * @returns sellable asa amount
   */
  getAssetAmount(): uint64 {
    return this.assetAmountInitial.value;
  }

  /**
   * get asa price
   * @returns asa price in microAlgos
   */
  getAssetPrice(): uint64 {
    return this.assetPrice.value;
  }

  /**
   * get asa id
   * @returns asa id
   */
  getAssetID(): AssetID {
    return this.asset.value;
  }

  /**
   * get end of sell period
   * @returns end of sell period as absolute time in sec, from 01-Jan-1970
   */
  getSellPeriodEnd(): uint64 {
    return this.sellPeriodEnd.value;
  }

  /**
   * Buy 1 piece of the asset
   * @param payment txn, where amount is equal to assetPrice, receiver is app address
   */
  buyAsset(payment: PayTxn): void {
    /// Ensure asset selling period hasn't ended yet
    assert(globals.latestTimestamp <= this.sellPeriodEnd.value, 'Sell period ended');

    /// Ensure that buyer hasn't bought earlier this asset
    assert(this.txn.sender.assetBalance(this.asset.value) === 0, 'Asset already bought');

    /// Verify payment transaction: receiver is the app, amount is the asset price
    verifyPayTxn(payment, {
      sender: this.txn.sender,
      receiver: globals.currentApplicationAddress,
      amount: { greaterThanEqualTo: this.assetPrice.value, lessThanEqualTo: this.assetPrice.value },
      rekeyTo: globals.zeroAddress,
      closeRemainderTo: globals.zeroAddress,
    });

    /// Is there still an asset to sell? (this can be optimized away)
    assert(this.assetAmount.value > 0, 'No more ASA to sell');

    /// Unfreeze asset
    sendAssetFreeze({
      freezeAsset: this.asset.value,
      freezeAssetAccount: this.txn.sender,
      freezeAssetFrozen: false,
    });

    /// Opt into asset, unconditionally
    sendAssetTransfer({
      xferAsset: this.asset.value,
      assetAmount: 0,
      assetReceiver: this.app.address,
    });

    /// Send asset to the buyer
    sendAssetTransfer({
      xferAsset: this.asset.value,
      assetReceiver: this.txn.sender,
      assetAmount: 1,
    });

    /// Freeze the asset at the buyer's address (this can be optimized away)
    sendAssetFreeze({
      freezeAsset: this.asset.value,
      freezeAssetAccount: this.txn.sender,
      freezeAssetFrozen: true,
    });

    // Decrease asset amount (this can be optimized away)
    this.assetAmount.value = this.assetAmount.value - 1;
  }

  /**
   * Send Algos from the app address to the app creator address
   */
  sendAlgosToCreator(): void {
    /// Allow only the creator to call this method
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    /// Send back all the Algos above minAmount to the app creator
    const minAmount = 600_000; // uAlgos
    const balance = globals.currentApplicationAddress.balance;
    if (balance > minAmount) {
      sendPayment({
        receiver: globals.creatorAddress,
        amount: balance - minAmount,
      });
    }
  }

  /**
   * Clawback asset to app
   * @param address from which to clawback asset
   */
  clawback(addr: Address): void {
    /// Allow only the app creator to call this method
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    /// Clawback assets to app
    sendAssetTransfer({
      xferAsset: this.asset.value,
      assetAmount: 1,
      assetSender: addr,
      assetReceiver: globals.currentApplicationAddress,
    });

    /// Inc asset amount
    this.assetAmount.value = this.assetAmount.value + 1;
  }

  /**
   * Delete asset within app
   */
  deleteAsset(): void {
    /// Allow only the app creator to call this method
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });
    // assert(this.txn.sender === this.app.creator, 'Allow only the app creator to call this method');

    /// Delete asset
    sendAssetConfig({
      configAsset: this.asset.value,
    });
  }

  /**
   * Delete app with ABI method
   */
  deleteApplication(): void {
    /// Allow only the app creator to call this method
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    /// Send back Algos to app creator account
    sendPayment({
      receiver: globals.creatorAddress,
      amount: 0,
      closeRemainderTo: globals.creatorAddress,
    });
  }
}
