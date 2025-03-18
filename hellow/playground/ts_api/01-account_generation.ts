import algosdk from 'algosdk';

function generateAccount(): algosdk.Account {
  const acc = algosdk.generateAccount();
  return acc;
}

function listAccount(acc: algosdk.Account): void {
  // Address, "external" format, base32 human readable format
  console.log("Account address as 58 char string: %s", acc.addr.toString());
  // Address, "internal" format, UInt8Array(32) format
  console.log("Account address as Uint8Array: ", acc.addr.publicKey);
  // Private key, base64 human readable format
  console.log("Account private key as base64 string: %s", algosdk.bytesToBase64(acc.sk));
  // Private key, mnemonic format
  console.log("Account private key as mnemonic: %s", algosdk.secretKeyToMnemonic(acc.sk));
  // Private key, UInt8Array(32) format (remaining 32 bytes are the publicKey)
  console.log("Account private key as Uint8Array: ", acc.sk.slice(0, 32));
}

const acc = generateAccount();
listAccount(acc);