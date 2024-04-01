import { Contract } from '@algorandfoundation/tealscript';
// import { makePaymentTxnWithSuggestedParams } from 'algosdk';

// eslint-disable-next-line no-unused-vars
class BizKor extends Contract {
  assetAmountInitial = GlobalStateKey<uint64>();

  assetAmount = GlobalStateKey<uint64>();

  assetPrice = GlobalStateKey<uint64>();

  asset = GlobalStateKey<AssetID>();

  sellPeriodEnd = GlobalStateKey<uint64>();

  /**
   * Init the values of global keys
   */
  createApplication(): void {
    this.assetAmountInitial.value = 0;
    this.assetAmount.value = 0;
    this.assetPrice.value = 0;
    this.asset.value = AssetID.zeroIndex;
    this.sellPeriodEnd.value = 0;
  }

  /**
   * boostrap, create ASA, set global key values
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
   * Obsolete, Opt in to an asset for the app account
   * @param asset Asset to opt into
   */
  optIntoAsset(asset: AssetID): void {
    /// Only allow app creator to opt the app account into asset
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    /// Verify asset hasn't already been opted into
    assert(this.asset.value === AssetID.zeroIndex);

    /// Save asset in global state
    this.asset.value = asset;

    /// Submit opt-in transaction: 0 asset transfer to self
    sendAssetTransfer({
      assetReceiver: this.app.address,
      xferAsset: asset,
      assetAmount: 0,
    });
  }

  /**
   * Buy 1 piece of the asset
   * @param payment Payment in /uAlgos
   */
  buyAsset(payment: PayTxn): void {
    /// Ensure asset selling period hasn't ended yet
    assert(globals.latestTimestamp < this.sellPeriodEnd.value);

    /// Verify payment transaction
    verifyPayTxn(payment, {
      sender: this.txn.sender,
      // receiver: globals.creatorAddress,
      // amount: { greaterThanEqualTo: this.assetPrice.value, lessThanEqualTo: this.assetPrice.value },
      rekeyTo: globals.zeroAddress,
      closeRemainderTo: globals.zeroAddress,
    });

    /// Verify asset amount
    assert(this.assetAmount.value > 0);

    /// @todo: check asset amount in  buyer account

    /// Send asset to payer
    sendAssetTransfer({
      assetReceiver: this.txn.sender,
      xferAsset: this.asset.value,
      assetAmount: 1,
    });

    // Decrease asset amount
    this.assetAmount.value = this.assetAmount.value - 1;
  }

  deleteApplication(): void {
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
