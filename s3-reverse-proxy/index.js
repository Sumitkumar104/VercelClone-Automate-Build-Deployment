const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
// our reverse proxy server run on 8080 port 
const PORT = 8080 



// this Base path is obtain from the S3 bucket link-
// This is our actual link obtain from S3 bucket where we store the build code of our github url https://vercel-clone-outputs.s3.ap-south-1.amazonaws.com/__outputs/a1/index.html
const BASE_PATH = 'https://vercel-clone-outputs.s3.ap-south-1.amazonaws.com/__outputs'
const proxy = httpProxy.createProxy()

// localhost:8080/
// Adding middleware to handle incoming requests.
app.use((req, res) => {
    const hostname = req.hostname;

    // a1.localhost:8080
    const subdomain = hostname.split('.')[0];  // a1

    // Custom Domain - DB Query
    
     // Generating the target URL based on the subdomain.
    const resolvesTo = `${BASE_PATH}/${subdomain}`


    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true })
})


proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
         // Appending 'index.html' to the proxy request path.
        proxyReq.path += 'index.html'
})

app.listen(PORT, () => console.log(`Reverse Proxy Running at port..${PORT}`))