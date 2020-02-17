# Airdrop

To run an airdrop, first clone this repo and then run:

```
yarn
```
(or npm i)

Create a file in the directory named `.private_key` and paste in a key.  Do not use you usual wallet for this.  One way to create a private key is to generate a new account with Metamask and then under 'Account Details' 'Export Private Key'.

When you run the script it will tell you exactly how much ETH it needs. You don't need to send more than it asks for.

Now update `settings.json`:
 - Set the provider to the correct network, e.g. `mainnet`
 - Update config including the airdrop amount
 - Populate the array of addresses

Run `yarn start` and the bot will tell you how much it needs. e.g.

```
Script account: 0x44446D0d742c7BA82238Fe5Ad047daba53F76dd9 has 0 ETH
Bot cannot afford this drop - we need 0.0020420042 more
```

Send the script account's address exactly the eth specified (make sure you are on the same network!) and then run the bot again.