const algosdk = require('algosdk');
const fs = require('fs');
const DEBUG=0;

// define sandbox values for kmd client
const kmd_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const kmd_server = "http://localhost";
const kmd_server_port = 4002;

// define sandbox values for algod client
const algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const algod_server = "http://localhost";
const algod_server_port = 4001;

async function getWalletId(
    kmdClient, 
    walletName) {
    
    // list wallets
    wallets = await kmdClient.listWallets();
    if(DEBUG) console.log('wallets:', wallets);
    
    // get wallet index for default wallet
    let walletId='';
    wallets.wallets.forEach(item => {
        if (item.name === walletName) {
            walletId = item.id;
        }
    })   
    return walletId;
}

function getAssetIndex(fname) {
    var asset_index = undefined;
    try {
        var data = fs.readFileSync(fname, 'utf8');
        asset_index = Number(data);
        if (DEBUG) console.log(asset_index);
    } catch (err) {
        console.error(err);
    }
    return asset_index;
}

async function main() {
    // create kmd client
    kmd_client = new algosdk.Kmd(kmd_token, kmd_server, kmd_server_port);

    // connect to wallet
    const wallet_name = 'unencrypted-default-wallet';
    const wallet_pw = '';
    wallet_id = await getWalletId(kmd_client, wallet_name);
    wallet_handle = await kmd_client.initWalletHandle(wallet_id, wallet_pw);

    // gather the first three accounts from the wallet
    wallet_addresses = await kmd_client.listKeys(wallet_handle.wallet_handle_token);
    addr1 = wallet_addresses.addresses[0];
    addr2 = wallet_addresses.addresses[1];
    addr3 = wallet_addresses.addresses[2];

    // create algod client
    algod_client = new algosdk.Algodv2(algod_token, algod_server, algod_server_port);

    // get asset index from file
    asset_index = getAssetIndex('5_asset_index.txt');
    if (DEBUG) console.log('asset_index:', asset_index);

    // get params
    params = await algod_client.getTransactionParams().do(); 
    if (DEBUG) console.log('params:', params);

    // build unsigned payment transaction
    txn_1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        suggestedParams: params, 
        from: addr2,
        to: addr1,
        amount: algosdk.algosToMicroalgos(1.0)
    });

    // build unsigned asset transfer transaction
    txn_2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams: params,
        from: addr1,
        to: addr2,
        assetIndex: asset_index,
        amount: 100     // this ASA has 2 decimal places, so this is 1.00 FUNTOK
    });

    // compute group id for transactions
    gid = algosdk.computeGroupID([txn_1, txn_2]);
    txn_1.group = gid;
    txn_2.group = gid;

    // sign transactions
    addr2_sk = await kmd_client.exportKey(wallet_handle.wallet_handle_token, wallet_pw, addr2);
    if (DEBUG) console.log('addr2_sk:', addr2_sk);
    stxn_1 = await txn_1.signTxn(addr2_sk.private_key);

    addr1_sk = await kmd_client.exportKey(wallet_handle.wallet_handle_token, wallet_pw, addr1);
    if (DEBUG) console.log('addr1_sk:', addr1_sk);
    stxn_2 = await txn_2.signTxn(addr1_sk.private_key);

    // assemble transaction group
    signed_group = [stxn_1, stxn_2];

    // submit atomic transaction group
    tx_id = await algod_client.sendRawTransaction(signed_group).do();
    console.log("Successfully sent transaction gropup with tx_id: %s", tx_id);
    console.log('tx_id["txId"]:', tx_id['txId']);

    // wait for confirmation
    console.log('Awaiting confirmation (this may take several seconds)...');
    const roundTimeout = 7;
    const confirmed_txn = await algosdk.waitForConfirmation(
      algod_client,
      tx_id['txId'],
      roundTimeout
    );
    console.log('Transaction group is successfully completed');

    // log confirmed transaction
    if (DEBUG) console.log('confirmed_txn:', confirmed_txn);

    // release wallet handle
    hr = await kmd_client.releaseWalletHandle(wallet_handle['wallet_handle_token']);
    if (DEBUG) console.log('wallet handle released, hr:', hr)
}

main();