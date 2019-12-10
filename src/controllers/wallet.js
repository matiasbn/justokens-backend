/* eslint-disable max-len */
import { newKit } from '@celo/contractkit'
import { debugControllers } from '../config/debug'
import PrivateKey from '../models/private-key'
import ERROR_MESSAGES from '../common/error-messages'

const keySize = Number(process.env.KEY_SIZE)
// Create kit
const kit = newKit('https://alfajores-forno.celo-testnet.org/')
const { web3 } = kit

const createWallet = async (request, response) => {
  try {
    debugControllers(request.body)
    const { email, phone } = request.body
    // Create crypto key for AES
    // const crypto = (web3.utils.randomHex(keySize)).replace('0x', '')

    // Create random seed for wallet
    const randomSeed = (web3.utils.randomHex(keySize)).replace('0x', '')
    debugControllers(randomSeed)

    // Create wallet
    const wallet = web3.eth.accounts.wallet.create(1, randomSeed)

    // Encrypt and store wallet
    const { address, privateKey } = wallet['0']
    debugControllers(privateKey)

    // Clear wallets
    web3.eth.accounts.wallet.clear()

    const privateKeys = await PrivateKey.find({ $or: [{ email }, { phone }] })
    debugControllers(privateKeys)
    if (privateKeys.length > 0) {
      response.error(ERROR_MESSAGES.EMAIL_OR_PHONE_ALREADY_REGISTERED, 401)
    } else {
      const state = new PrivateKey({
        email, privateKey, phone, address,
      })
      await state.save()
      const resp = { address: state.address, email: state.email, phone: state.phone }
      debugControllers(resp)
      response.success(resp)
    }
  } catch (error) {
    debugControllers(error)
    response.error(error, 500)
  }
}

const fetchWallet = async (request, response) => {
  const projections = {
    _id: 0, address: 1, email: 1, phone: 1,
  }
  try {
    const { email, phone } = request.body
    const privateKey = await PrivateKey.findOne({ email, phone }, projections).lean()
    if (!privateKey) {
      response.error(ERROR_MESSAGES.WALLET_NOT_FOUND, 401)
    } else {
      response.success(privateKey)
    }
  } catch (error) {
    debugControllers(error)
    response.error(error, 500)
  }
}

const deleteWallet = async (request, response) => {
  try {
    const { email, phone } = request.body
    const deletedKey = await PrivateKey.findOneAndDelete({ email, phone }).lean()
    debugControllers(deletedKey)
    if (!deletedKey) {
      response.error(ERROR_MESSAGES.WALLET_NOT_FOUND, 401)
    } else {
      const resp = {
        email: deletedKey.email,
        phone: deletedKey.phone,
        address: deletedKey.address,
      }
      debugControllers(resp)
      response.success(resp)
    }
  } catch (error) {
    debugControllers(error)
    response.error(error, 500)
  }
}

const updateWallet = async (request, response) => {
  try {
    const { email, phone } = request.body
    // Create random seed for wallet
    const randomSeed = (web3.utils.randomHex(keySize)).replace('0x', '')
    debugControllers(randomSeed)

    // Create wallet
    const wallet = web3.eth.accounts.wallet.create(1, randomSeed)

    // Encrypt and store wallet
    const { address, privateKey: newPrivateKey } = wallet['0']
    debugControllers(newPrivateKey)

    // Clear wallets
    web3.eth.accounts.wallet.clear()

    // Update wallet
    const newWallet = { address, privateKey: newPrivateKey }
    const updatedKey = await PrivateKey.findOneAndUpdate({ email, phone }, { $set: newWallet }).lean()
    debugControllers(updatedKey)
    if (!updatedKey) {
      response.error(ERROR_MESSAGES.WALLET_NOT_FOUND, 401)
    } else {
      const resp = {
        address,
        email: updatedKey.email,
        phone: updatedKey.phone,
      }
      debugControllers(resp)
      response.success(resp)
    }
  } catch (error) {
    debugControllers(error)
    response.error(error, 500)
  }
}


export default {
  createWallet,
  fetchWallet,
  deleteWallet,
  updateWallet,
}
