# Elaphant Web3 Provider

## 测试用地址

Elaphant Web3 Provider Javascript库地址：http://199y00.coding-pages.com/dist/elaphant.web3.provider.min.js 

## 接口说明

```javascript
let ElaProvider = new ElaphantWeb3Provider(rpcURL, appTitle, appID, appName, appPublicKey, developerDID)
```

### 使用说明

1. 在以往使用Metamask等钱包的典型环境下，会进行如下判断：

```javascript
if (typeof window.ethereum === 'undefined') {
	// 当window.ethereum不存在时，就可以使用ElaphantWeb3Provider为Web3提供provider。
	window.web3 = new Web3(new ElaphantWeb3Provider(
		"https://mainrpc.elaeth.io",
		"appTitle",
		"appID",
		"appName",
		"appPublicKey",
		"developerDID"
	));
}
```

2. 然后可以象使用Metamask一样，先连接帐户。

```javascript
window.ethereum.enable().then(() => {
	console.log(ethereum.selectedAddress);
})
```

此时Privoder会跳转到Elaphant Wallet去请求授权，回调后取得钱包帐户的ETH地址。 