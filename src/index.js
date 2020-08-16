import HttpProvider from 'web3-providers-http'

class ElaphantWeb3Provider extends HttpProvider {
	constructor(rpcURL) {
		super(rpcURL, {
			keepAlive: true,
			withCredentials: false,
			timeout: 20000,
			headers: [{
				name: 'Access-Control-Allow-Origin',
				value: '*'
			}]
		})

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
				return new Promise((resolve, reject) => {
					this.selectedAddress = '0x...'
					resolve('0x17B9fdc6f4eb2E9F4fBbF8F2d356d8e3E6346e33')
				})
			}
		}
		window.ethereum.init()
	}

	send(payload, callback) {
		super.send(payload, callback)
		// console.log(payload)
	}
}

window.ElaphantWeb3Provider = ElaphantWeb3Provider