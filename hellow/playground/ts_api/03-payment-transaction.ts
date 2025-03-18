import algosdk from "algosdk";

const DEBUG=false;

// define sandbox values for kmd client
const kmd_token = "a".repeat(64);
const kmd_server = "http://localhost";
const kmd_server_port = 4002;

// define sandbox values for algod client
const algod_token = "a".repeat(64);
const algod_server = "http://localhost";
const algod_server_port = 4001;

async function main() {
    // create kmd client
    const kmd_client = new algosdk.Kmd(kmd_token, kmd_server, kmd_server_port);
    
    // list wallets
    const wallets = await kmd_client.listWallets();
    let wallet_id: string = '';
    if (DEBUG) console.log('wallets:', wallets);
    
    // get wallet index for default wallet
    wallets.wallets.forEach((item: { name: string; id: string; }) => {
        if (item.name ==='unencrypted-default-wallet') {
            wallet_id = item.id;
            return;
        }    
    })
    ////debugger;
    // throw error, to see source-map-support
    // throw new Error("LG001, generated error");

    // get wallet handle for default wallet
    const wallet_handle = await kmd_client.initWalletHandle(wallet_id, ''); 
    if (DEBUG) console.log('wallet_handle:', wallet_handle);

    // get account addresses from default wallet
    const wallet_addresses = await kmd_client.listKeys(wallet_handle.wallet_handle_token);
    if (DEBUG) console.log('wallet_addresses:', wallet_addresses);
    const addr1 = wallet_addresses.addresses[0];
    const addr2 = wallet_addresses.addresses[1];
    //const addr3 = wallet_addresses.addresses[2];

    // create algod client
    const algod_client = new algosdk.Algodv2(algod_token, algod_server, algod_server_port);

    // build unsigned transaction
    const params = await algod_client.getTransactionParams().do();
    if (DEBUG) console.log('params:', params);
    
    const unsigned_txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: addr1,
        receiver: addr2,
        amount: algosdk.algosToMicroalgos(0.123),
        note: algosdk.msgpackRawEncode("Hello world, Üdv mindenkinek, árvíztűrő kanyarfúrógép"),
        suggestedParams: params
    })
    if (DEBUG) console.log('unsigned txn:', unsigned_txn);

    // sign transaction
    const addr1_sk = await kmd_client.exportKey(wallet_handle.wallet_handle_token, "", addr1);
    const signed_txn = unsigned_txn.signTxn(addr1_sk.private_key);

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

    // log decoded note
    const decoded_note = algosdk.msgpackRawDecode(confirmed_txn['txn']['txn']['note']);
    console.log('decoded note:', decoded_note);

    // release wallet handle
    const hr = await kmd_client.releaseWalletHandle(wallet_handle['wallet_handle_token']);
    if (DEBUG) console.log('wallet handle released, hr:', hr)
}

main();