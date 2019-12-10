import { debugTest } from '../../src/config/debug'
import Controller from '../../src/controllers/wallet'
import PrivateKey from '../../src/models/private-key'
import ERROR_MESSAGES from '../../src/common/error-messages'
import mockRequest from '../helpers/mock-request'
import mockResponse from '../helpers/mock-response'
import MongoClient from '../../src/config/db'

// Connect to database
// setup database name to connect to different databases per test on mongo
const options = { databaseName: 'test-controller-wallet' }
new MongoClient(options).getInstance()

const email = 'matias.barriosn@gmail.com'
const phone = '+56986673341'


describe('wallet controller unit testing', () => {
  describe('createWallet unit tests', () => {
    beforeAll(async () => {
      await PrivateKey.deleteMany({})
    })

    it('should store email and phone on the private-key collection', async () => {
      const req = mockRequest({ body: { email, phone } })
      const res = mockResponse()
      await Controller.createWallet(req, res)
      const storedKey = await PrivateKey.findOne({ email, phone })
      expect(storedKey).not.toBeNull()
      expect(storedKey.email).toBe(email)
      expect(storedKey.phone).toBe(phone)
      expect(storedKey.privateKey).toBeDefined()
      expect(storedKey.address).toBeDefined()
    })

    it('should not store the same email or phone number twice', async () => {
      // try with the same email and number
      let req = mockRequest({ body: { email, phone } })
      let res = mockResponse()
      await Controller.createWallet(req, res)
      let error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.EMAIL_OR_PHONE_ALREADY_REGISTERED)

      // try with the same email but different phone
      req = mockRequest({ body: { email, phone: '0' } })
      res = mockResponse()
      await Controller.createWallet(req, res)
      // eslint-disable-next-line prefer-destructuring
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.EMAIL_OR_PHONE_ALREADY_REGISTERED)

      // try with the same phone but different email
      req = mockRequest({ body: { email: 'm', phone } })
      res = mockResponse()
      await Controller.createWallet(req, res)
      // eslint-disable-next-line prefer-destructuring
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.EMAIL_OR_PHONE_ALREADY_REGISTERED)
    })

    it('should return an object with email, phone and address fields when registering', async () => {
      const req = mockRequest({ body: { email: 'matias', phone: '1234' } })
      const res = mockResponse()
      await Controller.createWallet(req, res)
      const response = res.success.mock.calls[0][0]
      expect(response.email).toBe('matias')
      expect(response.phone).toBe('1234')
      expect(response.address).toBeDefined()
    })
  })

  describe('fetchWallet unit tests', () => {
    let req
    let res
    beforeEach(async () => {
      await PrivateKey.deleteMany({})
      req = mockRequest({ body: { email, phone } })
      res = mockResponse()
      await Controller.createWallet(req, res)
    })

    it('should throw 401 if private key is not present for stated email or phone', async () => {
      // Fetch the wallet with wrong email
      req = mockRequest({ body: { email: 'matias', phone } })
      await Controller.fetchWallet(req, res)
      let error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)

      // Fetch the wallet with wrong phone
      req = mockRequest({ body: { email, phone: '1234' } })
      await Controller.fetchWallet(req, res)
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)

      // Fetch the wallet with both wrong
      req = mockRequest({ body: { email: 'matias', phone: '1234' } })
      await Controller.fetchWallet(req, res)
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)
    })

    it('should fetch an object with email, phone and address', async () => {
      await Controller.fetchWallet(req, res)
      const response = res.success.mock.calls[0][0]
      expect(response.email).toBe(email)
      expect(response.phone).toBe(phone)
      expect(response.address).toBeDefined()
    })
  })

  describe('deleteWallet unit tests', () => {
    let req
    let res
    beforeEach(async () => {
      req = mockRequest({ body: { email, phone } })
      res = mockResponse()
      await PrivateKey.deleteMany({})
      // Create a wallet
      await Controller.createWallet(req, res)
    })


    it('should throw 401 if private key is not present for stated email or phone', async () => {
      // Delete the wallet with wrong email
      req = mockRequest({ body: { email: 'matias', phone } })
      await Controller.deleteWallet(req, res)
      let error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)

      // Delete the wallet with wrong phone
      req = mockRequest({ body: { email, phone: '1234' } })
      await Controller.deleteWallet(req, res)
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)

      // Delete the wallet with both wrong
      req = mockRequest({ body: { email: 'matias', phone: '1234' } })
      await Controller.deleteWallet(req, res)
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)
    })

    it('should return an object with deleted email, phone and address', async () => {
      res = mockResponse()
      await Controller.deleteWallet(req, res)
      const response = res.success.mock.calls[0][0]
      expect(response.email).toBe(email)
      expect(response.phone).toBe(phone)
      expect(response.address).toBeDefined()
    })
  })

  describe('updateWallet unit tests', () => {
    let req
    let res
    beforeEach(async () => {
      req = mockRequest({ body: { email, phone } })
      res = mockResponse()
      await PrivateKey.deleteMany({})
      // Create a wallet
      await Controller.createWallet(req, mockResponse())
    })

    it('should throw 401 if private key is not present for stated email or phone', async () => {
      // Update the wallet with wrong email
      req = mockRequest({ body: { email: 'matias', phone } })
      await Controller.updateWallet(req, res)
      let error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)

      // Update the wallet with wrong phone
      req = mockRequest({ body: { email, phone: '1234' } })
      await Controller.updateWallet(req, res)
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)

      // Update the wallet with both wrong
      req = mockRequest({ body: { email: 'matias', phone: '1234' } })
      await Controller.updateWallet(req, res)
      error = res.error.mock.calls[0]
      expect(error[1]).toBe(401)
      expect(error[0]).toBe(ERROR_MESSAGES.WALLET_NOT_FOUND)
    })

    it('should return an object with email, phone and updated address', async () => {
      // res = mockResponse()
      const oldKey = await PrivateKey.findOne({ email, phone }, { _id: 0, address: 1 }).lean()
      debugTest(oldKey)
      await Controller.updateWallet(req, res)
      const response = res.success.mock.calls[0][0]
      debugTest(response)
      debugTest(response)
      expect(response.email).toBe(email)
      expect(response.phone).toBe(phone)
      expect(response.address).not.toBe(oldKey.address)
      expect(response.address).toBeDefined()
    })
  })
})
