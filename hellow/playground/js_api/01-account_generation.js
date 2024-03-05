const algosdk = require('algosdk');
const DEBUG = 0;

const createAccount = function() {
    try {
        const myAccount = algosdk.generateAccount();
        console.log("Account address:", myAccount.addr);
        if (DEBUG) console.log("Private key:", myAccount.sk);
        let b64_sk = Buffer.from(myAccount.sk).toString('base64');
        console.log("Private key:", b64_sk);
        const accountMnemonic = algosdk.secretKeyToMnemonic(myAccount.sk);
        console.log("Account mnemonic:", accountMnemonic);
        return myAccount;
    }
    catch (err) {
        console.log("err:", err);
    }
}

createAccount();