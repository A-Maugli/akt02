import algosdk from "algosdk";
import fs from "fs";

const DEBUG=false;

// define sandbox values for kmd client
const kmd_token = "a".repeat(64);
const kmd_server = "http://localhost";
const kmd_server_port = 4002;

// define sandbox values for algod client
const algod_token = "a".repeat(64);
const algod_server = "http://localhost";
const algod_server_port = 4001;

async function getWalletId(
    kmdClient: algosdk.Kmd, 
    walletName: string): Promise<string> {
    
    // list wallets
    const wallets = await kmdClient.listWallets();
    if(DEBUG) console.log('wallets:', wallets);
    
    // get wallet index for default wallet
    let walletId: string ='';
    wallets.wallets.forEach((item: { name: string; id: string; }) => {
        if (item.name === walletName) {
            walletId = item.id;
        }
    })   
    return walletId;
}

function getAssetIndex(fname: string): bigint {
    let asset_index = BigInt(0);  // 0n can be used when "target": "ES2020" or later
    try {
        const data = fs.readFileSync(fname, 'utf8');
        asset_index = BigInt(data);
        if (DEBUG) console.log(asset_index);
    } catch (err) {
        console.error(err);
    }
    return asset_index;
}

async function main() {
    // create kmd client
    const kmd_client = new algosdk.Kmd(kmd_token, kmd_server, kmd_server_port);
    
    // get wallet index for default wallet
    const wallet_id = await getWalletId(kmd_client, 'unencrypted-default-wallet');

    // get wallet handle for default wallet
    const wallet_pw = '';
    const wallet_handle = await kmd_client.initWalletHandle(wallet_id, wallet_pw); 
    if (DEBUG) console.log('wallet_handle:', wallet_handle);

    // get account addresses from default wallet
    const wallet_addresses = await kmd_client.listKeys(wallet_handle.wallet_handle_token);
    if (DEBUG) console.log('wallet_addresses:', wallet_addresses);
    //const addr1 = wallet_addresses.addresses[0];
    const addr2 = wallet_addresses.addresses[1];
    //const addr3 = wallet_addresses.addresses[2];

    // get asset index from file
    const asset_index = getAssetIndex('5-asset-index.txt');
    if (DEBUG) console.log('asset_index:', asset_index);

    // create algod client
    const algod_client = new algosdk.Algodv2(algod_token, algod_server, algod_server_port);

    // get params
    const params = await algod_client.getTransactionParams().do();
    if (DEBUG) console.log('params:', params);
    console.log('params:', params);

    // build asset opt in transaction
    const asset_optin_txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams: params,
        sender: addr2,
        receiver: addr2,
        assetIndex: asset_index,
        amount: 0,        
    });
    if (DEBUG) console.log('asset opt in txn:', asset_optin_txn);

    // sign transaction
    const addr2_sk = await kmd_client.exportKey(wallet_handle.wallet_handle_token, "", addr2);
    const signed_txn = asset_optin_txn.signTxn(addr2_sk.private_key);

    // submit transaction
    const tx_id = await algod_client.sendRawTransaction(signed_txn).do();

    // wait for confirmation
    console.log('Awaiting confirmation (this may take several seconds)...');
    const roundTimeout = 7;
    const confirmed_txn = await algosdk.waitForConfirmation(
      algod_client,
      tx_id['txid'],
      roundTimeout
    );
    console.log('Transaction is successfully completed');    

    // log confirmed transaction
    console.log('confirmed_txn:', confirmed_txn);

    // release wallet handle
    const hr = await kmd_client.releaseWalletHandle(wallet_handle['wallet_handle_token']);
    if (DEBUG) console.log('wallet handle released, hr:', hr)
}

main();