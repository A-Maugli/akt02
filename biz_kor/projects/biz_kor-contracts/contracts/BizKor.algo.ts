import { Contract } from '@algorandfoundation/tealscript';
// import { makePaymentTxnWithSuggestedParams } from 'algosdk';

// eslint-disable-next-line no-unused-vars
class BizKor extends Contract {
  appVersion = GlobalStateKey<string>({ key: 'apv' });

  appCreatorAddress = GlobalStateKey<Address>({ key: 'apca' });

  assetAmountInitial = GlobalStateKey<uint64>({ key: 'asa_total' });

  assetAmount = GlobalStateKey<uint64>({ key: 'asa_amt' });

  assetPrice = GlobalStateKey<uint64>({ key: 'asa_price' });

  asset = GlobalStateKey<AssetID>({ key: 'asa_id' });

  sellPeriodEnd = GlobalStateKey<uint64>({ key: 'end' });

  /**
   * Init the values of global keys
   */
  createApplication(): void {
    this.appVersion.value = 'v1.1';
    this.appCreatorAddress.value = globals.creatorAddress;
    this.assetAmountInitial.value = 0;
    this.assetAmount.value = 0;
    this.assetPrice.value = 0;
    this.asset.value = AssetID.zeroIndex;
    this.sellPeriodEnd.value = 0;
  }

  /**
   * boostrap: create ASA, set global key values
   * @param assetPrice ASA price in microAlgos
   * @param assetAmount ASA inital amount
   * @param sellPeriodLength sell period length in secs
   */
  bootstrap(assetPrice: uint64, assetAmount: uint64, sellPeriodLength: uint64) {
    /// Only allow app creator to create the asset
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });
    /// Check it hasn't been done yet
    assert(this.assetAmount.value === 0);

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

    this.assetAmountInitial.value = assetAmount;
    this.assetAmount.value = assetAmount;
    this.assetPrice.value = assetPrice;
    this.asset.value = asset;
    this.sellPeriodEnd.value = globals.latestTimestamp + sellPeriodLength;
  }

  /**
   * get app creator address
   * @returns app creator address
   */
  getAppCreatorAddress(): Address {
    // return globals.creatorAddress;
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
   * @returns asa price in Algos
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
   * @param payment Payment in /uAlgos. asset is also passed as param in assets: [Number(asset)], without it "unavailable asset" error is got
   */
  // eslint-disable-next-line no-unused-vars
  buyAsset(payment: PayTxn): void {
    /// Ensure asset selling period hasn't ended yet
    assert(globals.latestTimestamp < this.sellPeriodEnd.value);

    /// Check for asset already owned by
    assert(this.txn.sender.assetBalance(this.asset.value) === 0);

    /// Verify payment transaction
    verifyPayTxn(payment, {
      sender: this.txn.sender,
      receiver: globals.creatorAddress,
      amount: { greaterThanEqualTo: this.assetPrice.value, lessThanEqualTo: this.assetPrice.value },
      rekeyTo: globals.zeroAddress,
      closeRemainderTo: globals.zeroAddress,
    });

    /// Verify asset amount
    assert(this.assetAmount.value > 0);

    /// @todo: check asset amount in  buyer account

    /// Send asset to payer
    sendAssetTransfer({
      xferAsset: this.asset.value,
      assetReceiver: this.txn.sender,
      assetAmount: 1,
    });

    /// Freeze the asset
    sendAssetFreeze({
      freezeAsset: this.asset.value,
      freezeAssetAccount: this.txn.sender,
      freezeAssetFrozen: true,
    });

    // Decrease asset amount
    this.assetAmount.value = this.assetAmount.value - 1;
  }

  /**
   * Delete app with ABI method
   * @param ASAid reference to ASA, (!)
   */
  // eslint-disable-next-line no-unused-vars
  deleteApplication(ASAid: AssetID): void {
    /// Only allow app creator to delete the app account
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    /// Send back assets to app creator account
    sendAssetTransfer({
      assetReceiver: globals.creatorAddress,
      xferAsset: this.asset.value,
      assetAmount: 0,
      assetCloseTo: globals.creatorAddress,
    });

    /// Send back Algos to app creator account
    sendPayment({
      receiver: globals.creatorAddress,
      amount: 0,
      closeRemainderTo: globals.creatorAddress,
    });
  }
}
