# wssProxy
## Secure Websocket Proxy Script

Accepts secure WebSocket connections and passes them to an insecure WebSocket. 

If you have OpenSSL installed you can create a self signed cert run

```npm run createCert```

Then start the server using

```npm start```

This starts the proxy with the following settings:

listenPort=443  
listenAddress=0.0.0.0   
forwardAddress=localhost   
forwardPort=8080   
certificateFile=cert.pem  
privateKeyFile=key.pem

You can use the following command to change these settings:

```npm start listenPort=443 listenAddress=0.0.0.0 forwardAddress=localhost forwardPort=8080 certificateFile=cert.pem privateKeyFile=key.pem```