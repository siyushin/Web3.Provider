import Web3 from 'web3'

class ElaphantWeb3Provider extends Web3.providers.HttpProvider {
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
			enable: function () {
				return new Promise((resolve, reject) => {
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
		switch (payload.method) {
			case 'eth_sendTransaction':
				this.sendTransaction(payload.params)
				break

			case 'eth_requestAccounts':
				return new Promise((resolve, reject) => {
					this.authorise().then(address => {
						if (address === '') {
							reject('')
						} else {
							resolve([address])
						}
					}).catch(err => {
						console.error(err)
						reject('')
					})
				})

			default:
				super.send(payload, callback)
			// console.log('payload =', payload)
		}
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