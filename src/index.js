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

		window.ethereum = {
			provider: this,
			enable: function () {
				return new Promise((resolve, reject) => {
					resolve(['0x17B9fdc6f4eb2E9F4fBbF8F2d356d8e3E6346e33'])
				})
			}
		}
	}

	// send(
	// 	payload: object,
	// 	callback?: (
	// 		error: Error | null,
	// 		result: JsonRpcResponse | undefined
	// 	) => void
	// ): void;
	send(payload, callback) {
		super.send(payload, callback)
		console.log('调用了send()')
		console.log(payload)
	}
}

window.ElaphantWeb3Provider = ElaphantWeb3Provider