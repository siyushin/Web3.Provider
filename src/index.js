import Web3 from "web3"
import HttpProvider from "web3-providers-http"

window.resCallback = null

class ElaphantWeb3Provider extends HttpProvider {
	/**
	 * 用于在iOS移动端向webview进行注入。参数为原生代码里定义的Provider配置对象。
	 * @param {Object} embeddedConfig Provider的配置对象。
	 */
	static initWithConfig(embeddedConfig) {
		let object = new ElaphantWeb3Provider(embeddedConfig.rpcUrl)
		object.isEmbedded = true
		object.address = embeddedConfig.address
		window.resCallback = null
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
		window.resCallback = null
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
				isEmbedded: this.isEmbedded,
				// resCallback: this.resCallback,
				selectedAddress: this.isEmbedded ? this.address : '',
				sendResponse: this.sendResponse,
				_send: this._send,
				rawSendWithinApp: this.rawSendWithinApp,
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
		console.log("开始调用 send……", this, payload, callback)

		if (callback) {
			window.resCallback = callback
			this._send(payload)
		} else {
			return new Promise(resolve => {
				window.resCallback = result => {
					resolve(result)
				}

				this._send(payload)
			})
		}
	}

	rawSendWithinApp(payload) {
		console.log("组装请求对象 rawSendWithinApp")

		let jsBridge
		if (this.isEmbedded) {
			const param = {
				name: payload.method,
				object: payload.params,
				id: payload.id ? payload : new Date().getTime()
			}

			console.log("window.JsBridgeAndroid =", window.JsBridgeAndroid)

			if (window.JsBridgeAndroid) {
				jsBridge = window.JsBridgeAndroid
				jsBridge.postMessage(JSON.stringify(param))

				console.log("提交Android", JSON.stringify(param))
			} else {
				jsBridge = window.webkit.messageHandlers[payload.method]
				jsBridge.postMessage(param)

				console.log("提交iOS", param)
			}
		} else {
			super.send(payload, window.resCallback)
		}
	}

	_send(payload) {
		let jsBridge
		switch (payload.method) {
			case "eth_getBalance": case "eth_call":
				console.log("window.JsBridgeAndroid =", window.JsBridgeAndroid)
				this.rawSendWithinApp(payload)
				break

			case 'eth_sendTransaction':
				console.log("这是一个eth_sendTransaction交易。", payload.params)

				this.sendTransaction(payload.params, payload.id)
				break

			case 'eth_requestAccounts': case "eth_accounts":
				if (this.isEmbedded) {
					if (window.resCallback) {
						if (this.address) {
							window.resCallback([this.address])
						} else {
							window.resCallback([])
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
					if (window.resCallback) {
						this.authorise().then(address => {
							if (address === '') {
								window.resCallback("NO ADDRESS!", [])
							} else {
								window.resCallback(null, [address])
							}
						}).catch(err => {
							window.resCallback(err, [])
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
					if (window.JsBridgeAndroid) {
						jsBridge = window.JsBridgeAndroid
					} else {
						jsBridge = window.webkit.messageHandlers['signPersonalMessage']
					}

					jsBridge.postMessage({
						name: 'signPersonalMessage',
						object: payload.params,
						id: 0
					})
				} else {
					super.send(payload, window.resCallback)
				}
				break

			case 'personal_ecRecover':
				if (this.isEmbedded) {
					if (window.JsBridgeAndroid) {
						jsBridge = window.JsBridgeAndroid
					} else {
						jsBridge = window.webkit.messageHandlers['ecRecover']
					}

					jsBridge.postMessage({
						name: 'ecRecover',
						object: payload.params,
						id: 0
					})
				} else {
					super.send(payload, window.resCallback)
				}
				break

			case "net_version":
				if (this.isEmbedded) {
					const param = {
						name: 'net_version',
						object: payload.params,
						id: payload.id ? payload : 0
					}

					if (window.JsBridgeAndroid) {
						jsBridge = window.JsBridgeAndroid
						jsBridge.postMessage(JSON.stringify(param))
					} else {
						jsBridge = window.webkit.messageHandlers['net_version']
						jsBridge.postMessage(param)
					}
				} else {
					super.send(payload, window.resCallback)
				}
				break

			default:
				super.send(payload, window.resCallback)
		}
	}

	sendTransaction(args, id) {
		console.log("开始调用　sendTransaction", args)

		if (this.isEmbedded) {
			const param = {
				name: 'signTransaction',
				object: args,
				id: id
			}

			let jsBridge
			if (window.JsBridgeAndroid) {
				jsBridge = window.JsBridgeAndroid
				jsBridge.postMessage(JSON.stringify(param))
			} else {
				jsBridge = window.webkit.messageHandlers['signTransaction']
				jsBridge.postMessage(param)
			}
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
		console.log("调用 sendResponse", id, result, this.isEmbedded, window.resCallback)

		if (this.isEmbedded && window.resCallback) {
			window.resCallback(result)
		}
		window.resCallback = null
	}
}

window.Web3 = Web3
window.ElaphantWeb3Provider = ElaphantWeb3Provider
window.Trust = ElaphantWeb3Provider
window.detectEthereumProvider = function () { return new Promise(function (resolve, reject) { if (window.web3.currentProvider) { resolve(window.web3.currentProvider); } else { reject(null); } }); };