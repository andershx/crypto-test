// configurations for BCH deposit service
var bitcorecash = require('bitcoincashjs');
Networks = bitcorecash.Networks;
Networks.enableRegtest();

module.exports = {
    'network': Networks.testnet,
    'host': 'localhost',
    'username': 'admin',
    'password':'password',
    'port': 8332,
    'minStartBlock': 0, // When scan the block, the starting point
    'minConfirmation':20,
    "coinsPerBCH":1000,
    'withdrawSourceHDPath': ['m/0\'/1\'/0\''],//The address associate with this HDpath is mvpVLHH3UmACHJ1JV6tcneZFB5pqpvVs9j.
    'minTxFee':0.001
};