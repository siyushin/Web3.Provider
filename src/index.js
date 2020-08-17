import HttpProvider from 'web3-providers-http'

class ElaphantWeb3Provider extends HttpProvider {
	constructor(rpcURL, appTitle, appID, appName, appPublicKey, developerDID) {
		super(rpcURL, {
			keepAlive: true,
			withCredentials: false,
			timeout: 20000,
			headers: [{
				name: 'Access-Control-Allow-Origin',
				value: '*'
			}]
		})

		this.appTitle = appTitle
		this.appID = appID
		this.appName = appName
		this.appPublicKey = appPublicKey
		this.developerDID = developerDID

		this.setEthereum()
	}

	setEthereum() {
		window.ethereum = {
			provider: this,
			selectedAddress: '',

			init: function () {
				this.enable()
			},

			enable: function () {
				let currentURL = window.location.href
				let itsURL = new URL(currentURL)
				let action = itsURL.searchParams.get('action')
				if (action && action === 'auth') {
					let data = itsURL.searchParams.get('Data')
					let dataJson = JSON.parse(decodeURIComponent(data))
					this.selectedAddress = dataJson.ETHAddress

					return new Promise((resolve, reject) => {
						return resolve(this.selectedAddress)
					})
				} else {
					itsURL.searchParams.set('action', 'auth')

					let elaphantURL = "elaphant://identity?" +
						"AppID=" + this.provider.appID +
						"&AppName=" + encodeURIComponent(this.provider.appName) +
						"&RandomNumber=" + Math.floor(Math.random() * 100000000) +
						"&DID=" + this.provider.developerDID +
						"&PublicKey=" + this.provider.appPublicKey +
						"&ReturnUrl=" + encodeURIComponent(itsURL.toString()) +
						"&RequestInfo=ELAAddress,BTCAddress,ETHAddress"
					let url = "https://launch.elaphant.app/?appName=" + encodeURIComponent(this.provider.appTitle) +
						"&appTitle=" + encodeURIComponent(this.provider.appTitle) +
						"&autoRedirect=True&redirectURL=" + encodeURIComponent(elaphantURL)
					window.location.href = url
				}
			}
		}
	}

	send(payload, callback) {
		if (payload.method === 'eth_sendTransaction') {
			return this.sendTransaction(payload.params)
		}

		super.send(payload, callback)
		console.log('payload =', payload)
	}

	sendTransaction(args) {
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

window.ElaphantWeb3Provider = ElaphantWeb3Provider