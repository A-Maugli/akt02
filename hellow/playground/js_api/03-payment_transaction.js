const algosdk = require('algosdk');

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

async function main() {
    // create kmd client
    kmd_client = new algosdk.Kmd(kmd_token, kmd_server, kmd_server_port);

    // get wallet id for default wallet
    wallet_id = await getWalletId(kmd_client, 'unencrypted-default-wallet');
    if(DEBUG) console.log('wallet_id:', wallet_id);
    
    // get wallet_handle for defalt wallet
    wallet_handle = await kmd_client.initWalletHandle(wallet_id, ''); 
    if(DEBUG) console.log('wallet_handle:', wallet_handle);

    // get accounts (addresses) from default wallet
    wallet_addresses = await kmd_client.listKeys(wallet_handle.wallet_handle_token);
    if(DEBUG) console.log('wallet_addresses:', wallet_addresses);
    addr1 = wallet_addresses.addresses[0];
    addr2 = wallet_addresses.addresses[1];
    addr3 = wallet_addresses.addresses[2];

    // create algod client
    algod_client = new algosdk.Algodv2(algod_token, algod_server, algod_server_port);

    // build unsigned transaction
    params = await algod_client.getTransactionParams().do(); 
    params['fee'] = 0;
    if (DEBUG) console.log('params:', params);
    unsigned_txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: addr1,
        to: addr2,
        amount: algosdk.algosToMicroalgos(0.15),
        note: algosdk.encodeObj("Hello World"),
        suggestedParams: params
    });
    if (DEBUG) console.log('unsigned_txn:', unsigned_txn);

    // sign transaction
    addr1_sk = await kmd_client.exportKey(wallet_handle.wallet_handle_token, "", addr1);
    if (DEBUG) console.log('addr1_sk:', addr1_sk);
    signed_txn = unsigned_txn.signTxn(addr1_sk.private_key);
    if (DEBUG) console.log('signed_txn:', signed_txn);

    // submit transaction
    tx_id = await algod_client.sendRawTransaction(signed_txn).do();
    console.log("Successfully sent transaction with tx_id: %s", tx_id);
    console.log('tx_id["txId"]:', tx_id['txId']);

    // wait for confirmation
    console.log('Awaiting confirmation (this may take several seconds)...');
    const roundTimeout = 7;
    const confirmed_txn = await algosdk.waitForConfirmation(
      algod_client,
      tx_id['txId'],
      roundTimeout
    );
    console.log('Transaction is successfully completed');

    // log confirmed transaction
    console.log('confirmed_txn:', confirmed_txn);

    // log decoded note
    let decoded_note = algosdk.decodeObj(confirmed_txn['txn']['txn']['note']);
    console.log('decoded_note:', decoded_note);

    // release wallet handle
    let hr = await kmd_client.releaseWalletHandle(wallet_handle['wallet_handle_token']);
    if (DEBUG) console.log('wallet handle released, hr:', hr)
}

main();