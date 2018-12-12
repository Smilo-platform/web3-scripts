const EthereumTx = require('ethereumjs-tx');
const keythereum = require("keythereum");
const Web3 = require('web3');
const fs = require('fs');

const TARGET = process.env.TARGET || "localhost";
const SCHEMA = process.env.SCHEMA || "http";
const PORT = process.env.PORT || "22000";
const SENDER = process.env.SENDER || "0xecf7e57d01d3d155e5fc33dbc7a58355685ba39c";
const RECEIVER = process.env.RECEIVER || "0xc0ce2fd65f71c6ce82d22db11fcf7ca43357f172";
const KEY = process.env.KEY || "key1";
const PASSWORD = process.env.PASSWORD || "";
const VALUE = process.env.VALUE || "0.000000000001";
const DEBUG = process.env.DEBUG;

const keyJSON = fs.readFileSync(`keys/${KEY}`, 'utf8');
const keyObj = JSON.parse(keyJSON);
const privateKey = keythereum.recover(PASSWORD, keyObj);

if (!SENDER || !RECEIVER) {
    console.log("PLEASE, specify SENDER & RECEIVER ");
    process.exit(1);
}

var web3 = new Web3(new Web3.providers.HttpProvider(`${SCHEMA}://${TARGET}:${PORT}`));

if (/true/.test(DEBUG)) {
    console.log('[*] WILL ECHO the PrivateKey: ', privateKey.toString('hex'));
}

if (web3.eth.net.isListening()) {
    console.log("[*] WE MANAGED TO CONNECT!!");
} else {
    console.log("[*] COULD NOT CONNECT!!");
    process.exit(1);
}

console.log('[*] SENDER: ', SENDER);

web3.eth.getTransactionCount(SENDER, function (err, nonce) {
    if (err) {
        console.log("[*] ERROR: getTransactionCount, ", err)
    } else {
        console.log('[*] Got a valid nonce: ', nonce);

        var txParams = {
            nonce: '0x0' + nonce,
            gasPrice: '0x00',
            gasLimit: '0x47b760',
            to: RECEIVER,
            value: web3.utils.toWei(VALUE, "ether")
        };

        console.log('[*] Created a valid tx payload: ', txParams);

        const tx = new EthereumTx(txParams);

        tx.sign(privateKey);

        const serializedTx = tx.serialize();
        var rawTx = '0x' + serializedTx.toString('hex');

        console.log('[*] Created a raw transaction, will send it ... ', rawTx);

        web3.eth.sendSignedTransaction(rawTx, function (err, transaction) {
            if (err) {
                console.log("[*] ERROR: sendSignedTransaction, ", err)
                process.exit(1);
            } else {
                console.log("[*] Confirmed transaction, ", transaction)
                process.exit(0);
            }
        })
    }
});

