// Take the gitHub URL from the API and run the container in AWS ECS with the image from the gitHub url
const express = require('express')
const { generateSlug } = require('random-word-slugs') // used to generate a random number used for project id.
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')
const { Server } = require('socket.io') 
const Redis = require('ioredis')
const dotenv = require('dotenv')
dotenv.config();

const app = express() 
app.use(express.json())
const PORT = 9000

const subscriber = new Redis('rediss://default:AVNS_DVmmSQre4_4XiSA88BD@redis-207e1398-vercel-clone-1234.d.aivencloud.com:23987')

const io = new Server({ cors: '*' })

io.on('connection', socket => { 
    socket.on('subscribe', channel => { 
        socket.join(channel) 
        socket.emit('message', `Joined ${channel}`)
    })
})


// our socket server is listen at 9002 port 
io.listen(9002, () => console.log('Socket Server 9002'))

const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.ACCESSKEYID,
        secretAccessKey: process.env.SECRETACCESSKEY
    }
})

const config = { 
    CLUSTER: process.env.CLUSTERID,
    TASK: process.env.TASKID 
    // TASK help to run image in cluster
}


//slug is basicllly a unique id for the project we use it because we not use any database to store the project info,
// our API will take the gitHub url from the API and run the container in AWS ECS with the image from the gitHub url

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body
    const projectSlug = slug ? slug : generateSlug()

    // Spin the container
    const command = new RunTaskCommand({ 
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE', 
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: [process.env.subnetID1, process.env.subnetID2, process.env.subnetID3],
                securityGroups: [process.env.securityGroupID]
            }
        },
        overrides: { // Overriding container settings.
            containerOverrides: [
                {
                    name: 'builder-image', // Name of the container to override.
                    environment: [ 
                        { name: 'GIT_REPOSITORY__URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectSlug }
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    // This 8080 is port at which our s3-reverse-proxy server run
    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8080` } })
    // basiclly it return a random URL where the container is running the image from the gitHub url (url where our project is deploy)
})

// Function to initialize Redis subscription for logs.
async function initRedisSubscribe() { 
    console.log('Subscribed to logs....')
    subscriber.psubscribe('logs:*')
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message) // Emitting the message to clients subscribed to the channel.
    })
}

initRedisSubscribe() // Initializing Redis subscription for logs.

app.listen(PORT, () => console.log(`API Server Running..${PORT}`))

