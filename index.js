const Web3 = require('web3')
const fs = require('fs')
const BigNumber = require('bignumber.js')

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

(async () => {
  if (!fs.existsSync(`${process.cwd()}/settings.json`)) {
    console.log('Missing `settings.json`')
    process.exit()
  }

  const settings = require(`${process.cwd()}/settings.json`)

  if (!fs.existsSync(`${process.cwd()}/.private_key`)) {
    console.log('Missing `.private_key`')
    process.exit()
  }
  let privateKey = fs.readFileSync(`${process.cwd()}/.private_key`).toString()
  privateKey = `0x${privateKey.replace('0x', '')}`

  if (!settings.provider) {
    console.log('`settings.json` requires a web3 `provider`')
    process.exit()
  }
  const web3 = new Web3(settings.provider)
  const scriptAccount = web3.eth.accounts.privateKeyToAccount(privateKey)

  const ethBalance = new BigNumber(await web3.eth.getBalance(scriptAccount.address))
  console.log(`Script account: ${scriptAccount.address} has ${web3.utils.fromWei(ethBalance.toFixed(), 'ether')} ETH`)

  const dropCount = settings.accounts.length
  if (!dropCount) {
    console.log('Missing `settings.accounts`')
    process.exit()
  }
  if (!settings.amountToDropInEther) {
    console.log('Missing `settings.amountToDropInEther`')
    process.exit()
  }
  if (!settings.gasPriceInGwei) {
    console.log('Missing `settings.gasPriceInGwei`')
    process.exit()
  }

  const dropAmountInWei = new BigNumber(web3.utils.toWei(settings.amountToDropInEther, 'ether'))
  const gasPriceInWei = web3.utils.toWei(settings.gasPriceInGwei, 'gwei')
  const gasCostInWei = new BigNumber(gasPriceInWei).times(21000)

  let costInWei = new BigNumber(0)
  if (!settings.dropTargetsTotalAccountBalance) {
    const totalCostPerDropInWei = gasCostInWei.plus(dropAmountInWei)
    costInWei = new BigNumber(dropCount).times(totalCostPerDropInWei)
  } else {
    for (let i = 0; i < settings.accounts.length; i++) {
      const account = settings.accounts[i]
      const balance = new BigNumber(await web3.eth.getBalance(account))
      const delta = dropAmountInWei.minus(balance)
      if (delta.gt(0)) {
        costInWei = costInWei.plus(delta).plus(gasCostInWei)
      }
    }
  }

  if (ethBalance.lt(costInWei)) {
    const deltaInEth = web3.utils.fromWei(costInWei.minus(ethBalance).toFixed(), 'ether')
    console.log(`Cannot afford this drop - the script needs ${deltaInEth} more ETH`)
    process.exit()
  }

  let nonce = await web3.eth.getTransactionCount(
    scriptAccount.address,
    'pending'
  )

  for (let i = 0; i < settings.accounts.length; i++) {
    const account = settings.accounts[i]
    let amount = dropAmountInWei

    const balance = new BigNumber(await web3.eth.getBalance(account))
    const delta = dropAmountInWei.minus(balance)
    if (settings.dropTargetsTotalAccountBalance) {
      if (!delta.gt(0)) {
        console.log(`Skipping ${account}`)
        continue
      }
      amount = delta
    }

    console.log(`Dropping ${web3.fromWei(amount.toFixed(), 'ether')} ETH to ${account}`)
    const tx = await scriptAccount.signTransaction({
      to: account, value: amount.toFixed(), gas: 21000, gasPrice: gasPriceInWei, nonce: nonce++
    })

    web3.eth.sendSignedTransaction(tx.rawTransaction)
    await sleep(1000) // Sleeping so we don't get banned by the provider
  }

  console.log('Completed successfully')
  process.exit()
})()
