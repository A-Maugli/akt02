var algosdk = require('algosdk');

const DEBUG=0;

// define sandbox values for kmd client
const kmd_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const kmd_server = "http://localhost";
const kmd_server_port = 4002;

// define sandbox values for algod client
const algod_token = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const algod_server = "http://localhost";
const algod_server_port = 4001;

async function main() {
    // create kmd client
    const kmdClient = new algosdk.Kmd(kmd_token, kmd_server, kmd_server_port);
    
    // list wallets
    wallets = await kmdClient.listWallets();
    if(DEBUG) console.log('wallets:', wallets);
    
    // get wallet index for default wallet
    let wallet_id=''
    wallets.wallets.forEach(item => {
        if (item.name === 'unencrypted-default-wallet') {
            wallet_id = item.id;
        }
    })
    // get wallet_handle for defalt wallet
    wallet_handle = await kmdClient.initWalletHandle(wallet_id, ''); 
    if(DEBUG) console.log('wallet_handle:', wallet_handle);

    // get accounts (addresses) from default wallet
    wallet_addresses = await kmdClient.listKeys(wallet_handle.wallet_handle_token);
    if(DEBUG) console.log('wallet_addresses:', wallet_addresses);

    // create algod client
    const algodClient = new algosdk.Algodv2(algod_token, algod_server, algod_server_port);

    // check account balance for each account
    wallet_addresses.addresses.forEach(async (addr) => {
        if(DEBUG) console.log('addr', addr);
        account_info = await algodClient.accountInformation(addr).do();
        console.log('account_info', account_info);
    });

    // release wallet handle
    let hr = await kmdClient.releaseWalletHandle(wallet_handle['wallet_handle_token']);
    if (DEBUG) console.log('wallet handle released, hr:', hr)
}

main();