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
    // get wallet handle for default wallet
    const wallet_handle = await kmd_client.initWalletHandle(wallet_id, ''); 
    if (DEBUG) console.log('wallet_handle:', wallet_handle);

    // get account addresses from default wallet
    const wallet_addresses = await kmd_client.listKeys(wallet_handle.wallet_handle_token);
    if (DEBUG) console.log('wallet_addresses:', wallet_addresses);

    // create algod client
    const algod_client = new algosdk.Algodv2(algod_token, algod_server, algod_server_port);

    // get account info for each account address
    wallet_addresses.addresses.forEach(async (addr: string) => {
        if (DEBUG) console.log('addr', addr);
        const account_info = await algod_client.accountInformation(addr).do();
        console.log('account_info', account_info);
    });

    // release wallet handle
    const hr = await kmd_client.releaseWalletHandle(wallet_handle['wallet_handle_token']);
    if (DEBUG) console.log('wallet handle released, hr:', hr)
}

main();