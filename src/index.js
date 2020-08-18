import Web3 from 'web3'

class ElaphantWeb3Provider extends Web3.providers.HttpProvider {
	static initWithConfig(embeddedConfig) {
		let object = new ElaphantWeb3Provider(embeddedConfig.rpcUrl)
		object.isEmbedded = true
		object.address = embeddedConfig.address
		object.setEthereum()

		return object
	}

	static initWithParams(rpcURL, appTitle, appID, appName, appPublicKey, developerDID) {
		let object = new ElaphantWeb3Provider(rpcURL)
		object.isEmbedded = false
		object.appTitle = appTitle
		object.appID = appID
		object.appName = appName
		object.appPublicKey = appPublicKey
		object.developerDID = developerDID
		object.callback = null
		object.setEthereum()

		return object
	}

	constructor(rpcURL) {
		super(
			rpcURL,
			{
				keepAlive: true,
				withCredentials: false,
				timeout: 20000,
				headers: [{
					name: 'Access-Control-Allow-Origin',
					value: '*'
				}]
			})
	}

	setEthereum() {
		window.ethereum = {
			provider: this,
			selectedAddress: this.isEmbedded ? this.address : '',
			enable: function () {
				return new Promise((resolve, reject) => {
					if (this.provider.isEmbedded) {
						if (this.provider.address) {
							this.selectedAddress = this.provider.address
							resolve([this.selectedAddress])
						} else {
							reject([])
						}
					} else {
						this.provider.authorise().then(address => {
							this.selectedAddress = address
							if (address === '') {
								reject('')
							} else {
								resolve(address)
							}
						}).catch(err => {
							console.error(err)
							reject('')
						})
					}
				})
			},
			request(payload) {
				return new Promise((resolve, reject) => {
					this.provider.send(payload).then(res => {
						resolve(res)
					}).catch(err => {
						reject(err)
					})
				})
			}
		}
	}

	authorise() {
		let currentURL = window.location.href
		let itsURL = new URL(currentURL)
		let action = itsURL.searchParams.get('action')
		if (action && action === 'auth') {
			var data = ''
			var dataJson = null
			var err = null
			try {
				data = itsURL.searchParams.get('Data')
				dataJson = JSON.parse(decodeURIComponent(data))
				this.selectedAddress = dataJson.ETHAddress
			} catch (error) {
				err = error
			}

			return new Promise((resolve, reject) => {
				if (!this.selectedAddress || err) {
					reject('')
				} else {
					resolve(this.selectedAddress)
				}
			})
		} else {
			itsURL.searchParams.set('action', 'auth')

			let elaphantURL = "elaphant://identity?" +
				"AppID=" + this.appID +
				"&AppName=" + encodeURIComponent(this.appName) +
				"&RandomNumber=" + Math.floor(Math.random() * 100000000) +
				"&DID=" + this.developerDID +
				"&PublicKey=" + this.appPublicKey +
				"&ReturnUrl=" + encodeURIComponent(itsURL.toString()) +
				"&RequestInfo=ELAAddress,BTCAddress,ETHAddress"
			let url = "https://launch.elaphant.app/?appName=" + encodeURIComponent(this.appTitle) +
				"&appTitle=" + encodeURIComponent(this.appTitle) +
				"&autoRedirect=True&redirectURL=" + encodeURIComponent(elaphantURL)
			window.location.href = url
		}
	}

	send(payload, callback) {
		if (this.isEmbedded) {
			this.callback = callback
		}

		switch (payload.method) {
			case 'eth_sendTransaction':
				this.sendTransaction(payload.params)
				break

			case 'eth_requestAccounts':
				if (this.isEmbedded) {
					if (this.address) {
						this.callback(null, this.address)
					} else {
						this.callback('NO ADDRESS!', null)
					}
				} else {
					return new Promise((resolve, reject) => {
						this.authorise().then(address => {
							if (address === '') {
								reject('')
							} else {
								resolve([address])
							}
						}).catch(err => {
							console.error(err)
							reject([])
						})
					})
				}

			case 'personal_sign':
				if (this.isEmbedded) {
					window.webkit.messageHandlers['signPersonalMessage'].postMessage({
						name: 'signPersonalMessage',
						object: payload.params,
						id: 0
					})
				} else {
					super.send(payload, callback)
				}
				break

			case 'personal_ecRecover':
				if (this.isEmbedded) {
					window.webkit.messageHandlers['ecRecover'].postMessage({
						name: 'ecRecover',
						object: payload.params,
						id: 0
					})
				} else {
					super.send(payload, callback)
				}
				break

			default:
				super.send(payload, callback)
			// console.log('payload =', payload)
		}
	}

	sendTransaction(args) {
		if (this.isEmbedded) {
			window.webkit.messageHandlers['signTransaction'].postMessage({
				name: 'signPersonalMessage',
				object: args,
				id: 0
			})
		} else {
			let returnUrl = new URL(window.location.href)
			if (returnUrl.searchParams.get('action') === 'auth') {
				returnUrl.searchParams.delete('Data')
				returnUrl.searchParams.delete('Sign')
			}
			returnUrl.searchParams.set('action', 'tx')

			let arg = args[0]
			let orderID = "";
			let elaphantURL = "elaphant://calleth?DID=" + this.developerDID +
				"&AppID=" + this.appID +
				"&AppName=" + encodeURIComponent(this.appName) +
				"&Description=" + encodeURIComponent(this.appName) +
				"&PublicKey=" + this.appPublicKey +
				"&OrderID=" + orderID +
				"&CoinName=Ethsc" +
				"&to=" + arg.to +
				"&value=" + parseInt(arg.value) +
				"&price=" + parseInt(arg.gasPrice) +
				"&gas=" + parseInt(arg.gas) +
				"&data=" + arg.data +
				"&ReturnUrl=" + encodeURIComponent(returnUrl.toString());

			let url = "https://launch.elaphant.app/?appName=" + encodeURIComponent(this.appTitle) +
				"&appTitle=" + encodeURIComponent(this.appTitle) +
				"&autoRedirect=True&redirectURL=" + encodeURIComponent(elaphantURL);
			window.location.href = url;
		}
	}

	sendResponse(id, result) {
		if (this.isEmbedded && this.callback) {
			this.callback(result)
		}
		this.callback = null
	}
}

window.ElaphantWeb3Provider = ElaphantWeb3Provider
window.Trust = ElaphantWeb3Provider