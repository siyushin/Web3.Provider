# Elaphant Web3 Provider

## Build

运行“npm run build”，然后在项目目录/dist里会生成最终js文件。

## 接口说明

在web中引用js文件后，用如下方法实例化provider:

``` javascript
let ElaProvider = ElaphantWeb3Provider.initWithParams(rpcURL, appTitle, appID, appName, appPublicKey, developerDID, randomNumber)
```

### 使用说明

1. 在以往使用Metamask等钱包的典型环境下，会进行如下判断：

``` javascript
if (typeof window.ethereum === 'undefined') {
    // 当window.ethereum不存在时，就可以使用ElaphantWeb3Provider为Web3提供provider。
    window.web3 = new Web3(ElaphantWeb3Provider.initWithParams(
        "https://mainrpc.elaeth.io",
        "appTitle",
        "appID",
        "appName",
        "appPublicKey",
        "developerDID",
        12345
    ));
}
```

2. 然后可以象使用Metamask一样，先连接帐户。

``` javascript
window.ethereum.enable().then(() => {
    console.log(window.ethereum.selectedAddress);
})
```

同时也兼容为适配Metamask 8.0以上版的用法。

``` javascript
window.ethereum.request({
    method: 'eth_requestAccounts'
}).then(accounts => {
    console.log(accounts[0]);
})
```

此时Privoder会跳转到Elaphant Wallet去请求授权，回调后取得钱包帐户的ETH地址。 
