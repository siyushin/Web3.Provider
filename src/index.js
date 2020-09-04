import Web3 from 'web3'

class ElaphantWeb3Provider extends Web3.providers.HttpProvider {
	/**
	 * 用于在iOS移动端向webview进行注入。参数为原生代码里定义的Provider配置对象。
	 * @param {Object} embeddedConfig Provider的配置对象。
	 */
	static initWithConfig(embeddedConfig) {
		let object = new ElaphantWeb3Provider(embeddedConfig.rpcUrl)
		object.isEmbedded = true
		object.address = embeddedConfig.address
		object.resCallback = null
		object.setEthereum()

		return object
	}

	/**
	 * 用指定的Web App相关的参数去初始化一个Web3 Provider。
	 * @param {String} rpcURL
	 * @param {String} appTitle
	 * @param {String} appID 
	 * @param {String} appName 
	 * @param {String} appPublicKey 
	 * @param {String} developerDID 
	 * @param {Number} randomNumber 
	 * @param {String} accountAddress 如果已知钱包地址，可以在这里传入，则web不再需要频繁去请求用户钱包地址。
	 */
	static initWithParams(rpcURL, appTitle, appID, appName, appPublicKey, developerDID, randomNumber, accountAddress) {
		let object = new ElaphantWeb3Provider(rpcURL)
		object.isEmbedded = false
		object.appTitle = appTitle
		object.appID = appID
		object.appName = appName
		object.appPublicKey = appPublicKey
		object.developerDID = developerDID
		object.randomNumber = randomNumber
		object.resCallback = null
		object.address = accountAddress ? accountAddress : ''
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
		if (!window.ethereum) {
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
									reject([])
								} else {
									resolve([address])
								}
							}).catch(err => {
								console.error(err)
								reject([])
							})
						}
					})
				},
				request(payload, callback) {
					if (callback) {
						this.provider.send(payload, callback)
					} else {
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
				"&RandomNumber=" + this.randomNumber +
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
		if (callback) {
			this.resCallback = callback
		}

		switch (payload.method) {
			case 'eth_sendTransaction':
				this.sendTransaction(payload.params)
				break

			case 'eth_requestAccounts':
				if (this.isEmbedded) {
					if (callback) {
						if (this.address) {
							callback(null, [this.address])
						} else {
							callback('NO ADDRESS!', [])
						}
					} else {
						return new Promise((resolve, reject) => {
							if (this.address) {
								resolve([this.address])
							} else {
								reject([])
							}
						})
					}
				} else {
					if (callback) {
						this.authorise().then(address => {
							if (address === '') {
								callback("NO ADDRESS!", [])
							} else {
								callback(null, [address])
							}
						}).catch(err => {
							callback(err, [])
						})
					} else {
						return new Promise((resolve, reject) => {
							this.authorise().then(address => {
								if (address === '') {
									reject([])
								} else {
									resolve([address])
								}
							}).catch(err => {
								console.error(err)
								reject([])
							})
						})
					}
				}
				break

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
		if (this.isEmbedded && this.resCallback) {
			this.resCallback(result)
		}
		this.resCallback = null
	}
}

window.ElaphantWeb3Provider = ElaphantWeb3Provider
window.Trust = ElaphantWeb3Provider