import { Contract } from '@algorandfoundation/tealscript';
import { makePaymentTxnWithSuggestedParams } from 'algosdk';

// eslint-disable-next-line no-unused-vars
class BizKor extends Contract {
  assetAmount = GlobalStateKey<uint64>();

  assetPrice = GlobalStateKey<uint64>();

  asset = GlobalStateKey<AssetID>();

  sellPeriodEnd = GlobalStateKey<uint64>();

  /**
   * Init the values of global keys
   */
  initGlobalKeys(): void {
    this.assetAmount.value = 0;
    this.assetPrice.value = 0;
    this.asset.value = AssetID.zeroIndex;
    this.sellPeriodEnd.value = 0;
  }

  /**
   * For test only, create an asset
   */
  createAssetTest(): AssetID {
    const asset = sendAssetCreation({
      configAssetTotal: 10,
      configAssetName: 'teszt',
    });
    return asset;
  }

  /**
   * Opt in to an asset for the app account
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
   * Start asset selling period
   * @param price asset price in /uAlgos
   * @param length selling period length in secs
   * @param axfer initial asset transfer to the app account
   */
  startAssetSell(price: uint64, length: uint64, axfer: AssetTransferTxn): void {
    /// Only allow app creator to start asset sell for the app account
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    /// Ensure the asset selling period hasn't started yet
    assert(this.sellPeriodEnd.value === 0);

    /// Verify axfer is to app.address
    verifyAssetTransferTxn(axfer, { assetReceiver: this.app.address });

    /// Set global state
    this.assetAmount.value = axfer.assetAmount;
    this.assetPrice.value = price;
    this.sellPeriodEnd.value = globals.latestTimestamp + length;
  }

  /**
   * Send assets clawed back to app account
   * @param axfer asset transfer to the app account
   */
  continueAssetSell(axfer: AssetTransferTxn): void {
    // Only allow app creator to continue asset sell for the app account
    verifyAppCallTxn(this.txn, { sender: globals.creatorAddress });

    // Ensure the asset selling has already been started
    assert(this.sellPeriodEnd.value !== 0);

    // Ensure asset selling hasn't ended yet
    assert(globals.latestTimestamp < this.sellPeriodEnd.value);

    /// Verify axfer
    verifyAssetTransferTxn(axfer, {
      assetReceiver: this.app.address,
      xferAsset: this.asset.value,
    });

    /// Increase asset amount
    this.assetAmount.value = this.assetAmount.value + axfer.assetAmount;
  }

  /**
   * Buy 1 piece of the asset
   * @param payment in /uAlgos
   */
  buyAsset(payment: PayTxn): void {
    /// Ensure asset selling period hasn't ended yet
    assert(globals.latestTimestamp < this.sellPeriodEnd.value);

    /// Verify payment transaction
    verifyPayTxn(payment, {
      sender: this.txn.sender,
      amount: { greaterThanEqualTo: this.assetPrice.value, lessThanEqualTo: this.assetPrice.value },
    });

    /// Check asset amount of app
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
