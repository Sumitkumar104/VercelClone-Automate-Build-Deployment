// take the gitHub url from the API and run the container in AWS ECS with the image from the gitHub url
const express = require('express') // Importing the Express framework to create a server.
const { generateSlug } = require('random-word-slugs') // Importing a function to generate random slugs.
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs') // Importing AWS SDK modules for interacting with ECS.
const { Server } = require('socket.io') // Importing Socket.IO server class.
const Redis = require('ioredis') // Importing the Redis client library.
const dotenv = require('dotenv') // Importing the dotenv library to read environment variables.
dotenv.config() // Loading environment variables from the .env file.

const app = express() // Creating an instance of the Express application.
app.use(express.json()) // Adding middleware to parse JSON requests.
const PORT = 9000 // Setting the port number for the API server to listen on.

const subscriber = new Redis('') // Creating a Redis client instance for subscribing to logs.

const io = new Server({ cors: '*' }) // Creating a Socket.IO server instance with CORS enabled.

io.on('connection', socket => { // Event listener for when a client connects to the Socket.IO server.
    socket.on('subscribe', channel => { // Event listener for when a client subscribes to a channel.
        socket.join(channel) // Joining the client to the specified channel.
        socket.emit('message', `Joined ${channel}`) // Emitting a message to the client indicating successful subscription.
    })
})

io.listen(9002, () => console.log('Socket Server 9002')) // Starting the Socket.IO server on port 9002 and logging a message.

const ecsClient = new ECSClient({ // Creating an ECS client instance for interacting with AWS ECS.
    region: 'ap-south-1', // Setting the AWS region.
    credentials: { // Providing AWS credentials.
        accessKeyId: process.env.ACCESSKEYID, // Access Key ID.
        secretAccessKey: process.env.SECRETACCESSKEY // Secret Access Key.
    }
})

const config = { // Configuration object for ECS.
    CLUSTER: process.env.CLUSTERID, // ECS Cluster name.
    TASK: process.env.TASKID // ECS Task definition name.
    // TASK help to run image in cluster
}


//slug is basicllly a unique id for the project we use it because we not use any database to store the project info,
// our API will take the gitHub url from the API and run the container in AWS ECS with the image from the gitHub url

app.post('/project', async (req, res) => { // Route for creating a new project.
    const { gitURL, slug } = req.body // Extracting git URL and optional slug from request body.
    const projectSlug = slug ? slug : generateSlug() // Generating a project slug if not provided.
    // Spin the container
    const command = new RunTaskCommand({ // Creating a RunTaskCommand to start an ECS task.
        cluster: config.CLUSTER, // Setting the ECS cluster name.
        taskDefinition: config.TASK, // Setting the ECS task definition name.
        launchType: 'FARGATE', // Specifying the launch type.
        count: 1, // Number of tasks to run.
        networkConfiguration: { // Configuring network settings for the task.
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED', // Assigning a public IP to the task.
                subnets: [process.env.subnetID1, process.env.subnetID2, process.env.subnetID3], // Specifying the subnets for the task.
                securityGroups: [process.env.securityGroupID] // Specifying security groups for the task.
            }
        },
        overrides: { // Overriding container settings.
            containerOverrides: [
                {
                    name: 'builder-image', // Name of the container to override.
                    environment: [ // Setting environment variables for the container.
                        { name: 'GIT_REPOSITORY__URL', value: gitURL }, // Git repository URL.
                        { name: 'PROJECT_ID', value: projectSlug } // Project ID (slug).
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command); // Sending the ECS command to start the task.

    // Responding with JSON indicating project creation status and URL.
    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } })
    // basiclly it return a random URL where the container is running the image from the gitHub url (url where our project is deploy)
})

async function initRedisSubscribe() { // Function to initialize Redis subscription for logs.
    console.log('Subscribed to logs....') // Logging a message indicating successful subscription.
    subscriber.psubscribe('logs:*') // Subscribing to all channels matching the pattern 'logs:*'.
    subscriber.on('pmessage', (pattern, channel, message) => { // Event listener for when a message is received.
        io.to(channel).emit('message', message) // Emitting the message to clients subscribed to the channel.
    })
}

initRedisSubscribe() // Initializing Redis subscription for logs.

app.listen(PORT, () => console.log(`API Server Running..${PORT}`)) // Starting the API server and logging a message upon successful start.

