const express = require('express') // Importing the Express framework to create a server.
const httpProxy = require('http-proxy') // Importing the http-proxy module for proxying HTTP requests.

const app = express() // Creating an instance of the Express application.
const PORT = 8080 // Setting the port number for the server to listen on.

const BASE_PATH = 'https://vercel-clone-outputs.s3.ap-south-1.amazonaws.com/__outputs' // Defining the base path for proxying requests.

const proxy = httpProxy.createProxy() // Creating a proxy instance.

app.use((req, res) => { // Adding middleware to handle incoming requests.
    const hostname = req.hostname; // Extracting the hostname from the request.
    const subdomain = hostname.split('.')[0]; // Extracting the subdomain from the hostname.

    // Custom Domain - DB Query

    const resolvesTo = `${BASE_PATH}/${subdomain}` // Generating the target URL based on the subdomain.

    // Proxying the request to the resolved URL.
    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true })
})

// Event listener for the 'proxyReq' event, allowing modification of the proxy request.
proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url; // Extracting the URL from the request.
    if (url === '/') // Checking if the URL is the root path.
        proxyReq.path += 'index.html' // Appending 'index.html' to the proxy request path.
})

app.listen(PORT, () => console.log(`Reverse Proxy Running at port..${PORT}`)) // Starting the server and logging a message upon successful start.