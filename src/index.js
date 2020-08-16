import HttpProvider from 'web3-providers-http'

class ElaphantWeb3Provider extends HttpProvider {
	constructor(rpcURL, appTitle, appID, appName, appPublicKey, developerDID) {
		console.log('参数：', rpcURL, appTitle, appID, appName, appPublicKey, developerDID)
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

		if (!window.Web3) {
			let script = document.createElement('script')
			script.type = "text/javascript"
			script.src = 'https://unpkg.com/web3@latest/dist/web3.min.js'
			if (script.readyState) {
				script.onreadystatechange = () => {
					if (script.readyState == "loaded" || script.readyState == "complete") {
						script.onreadystatechange = null;
						this.setEthereum()
					}
				}
			} else {
				script.onload = () => {
					this.setEthereum()
				}
			}
			document.body.appendChild(script)
		} else {
			this.setEthereum()
		}
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
				let data = itsURL.searchParams.get('Data')
				if (data) {
					// BTCAddress: "12iekRGdkJAg42vDVu3R9HFrzKA3Y2asTb"
					// DID: "idNSQQ6CaXQEGHB7QeqcD12zeu7UB8Acs4"
					// ELAAddress: "ENma6kd2r4qKR7Qa3Q2vRrZkNC4GPrEQiF"
					// ETHAddress: "0xBAE4229e6d7D7404c9AaE150ccA99ae53FebAdBF"
					// PublicKey: "03ddd9b47aa1fd44cf6125134c4a782e1be34165f71ea04cc5ab232835eaf82730"
					// RandomNumber: "26587889"
					let dataJson = JSON.parse(decodeURIComponent(data))
					this.selectedAddress = dataJson.ETHAddress

					return new Promise((resolve, reject) => {
						return resolve(this.selectedAddress)
					})
				} else {
					return new Promise((resolve, reject) => {
						let elaphantURL = "elaphant://identity?" +
							"AppID=" + this.provider.appID +
							"&AppName=" + encodeURIComponent(this.provider.appName) +
							"&RandomNumber=" + Math.floor(Math.random() * 100000000) +
							"&DID=" + this.provider.developerDID +
							"&PublicKey=" + this.provider.appPublicKey +
							"&ReturnUrl=" + encodeURIComponent(currentURL) +
							"&RequestInfo=ELAAddress,BTCAddress,ETHAddress"
						let url = "https://launch.elaphant.app/?appName=" + encodeURIComponent(this.provider.appTitle) +
							"&appTitle=" + encodeURIComponent(this.provider.appTitle) +
							"&autoRedirect=True&redirectURL=" + encodeURIComponent(elaphantURL)
						// window.open(url, "_blank")
						window.location.href = url
					})
				}
			}
		}
	}

	send(payload, callback) {
		super.send(payload, callback)
		// console.log(payload)
	}
}

window.ElaphantWeb3Provider = ElaphantWeb3Provider