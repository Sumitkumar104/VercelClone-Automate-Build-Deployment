// Import necessary modules
const { exec } = require('child_process'); // For executing shell commands
const path = require('path'); // For working with file paths
const fs = require('fs'); // For working with the file system
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // AWS SDK for S3 (simple storage service - object storage)
const mime = require('mime-types'); // For determining MIME types of files  ( based on file extensions  )
const Redis = require('ioredis'); // Redis client for publishing logs
const dotnev=require('dotenv');
dotnev.config();

// Initialize Redis client for publishing logs
const publisher = new Redis(process.env.REDIS_URL);

// Initialize S3 client with AWS credentials and region
const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Get the PROJECT_ID from environment variables
const PROJECT_ID = process.env.PROJECT_ID;

// Function to publish logs to Redis
function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

// Main function to execute the script
async function init() {
    console.log('Executing script.js');
    publishLog('Build Started...'); // Publish build start log to Redis

    // Define output directory path
    const outDirPath = path.join(__dirname, 'output');

    // Execute npm install and npm run build commands in the output directory
    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    // Event listener for capturing standard output
    p.stdout.on('data', function (data) {
        console.log(data.toString());
        publishLog(data.toString()); // Publish output logs to Redis
    });

    // Event listener for capturing errors
    p.stderr.on('data', function (data) {
        console.log('Error', data.toString());
        publishLog(`error: ${data.toString()}`); // Publish error logs to Redis
    });

    // Event listener for the completion of the build process
    p.on('close', async function () {
        console.log('Build Complete');
        publishLog('Build Complete'); // Publish build completion log to Redis

        // Define path to the distribution folder
        const distFolderPath = path.join(__dirname, 'output', 'dist');       // Path to the dist folder in the output directory

        // Get the contents of the distribution folder recursively
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true });     // Get the contents of the dist folder

        publishLog('Starting to upload'); // Publish upload start log to Redis

        // Iterate through each file in the distribution folder
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);                 // Get the full path of the file

            // Skip directories
            if (fs.lstatSync(filePath).isDirectory()) continue;          // the fs module's lstatSync method synchronously to get the file status information for the file specified by filePath.

            console.log('uploading', filePath);
            publishLog(`uploading ${file}`); // Publish upload progress log to Redis

            // Create a PutObjectCommand to upload the file to S3
            const command = new PutObjectCommand({
                Bucket: 'sumit104vercelclone', // Specify the S3 bucket name
                Key: `__outputs/${PROJECT_ID}/${file}`, // Specify the key under which to store the object in the bucket
                Body: fs.createReadStream(filePath), // Readable stream of the file content
                ContentType: mime.lookup(filePath) // Determine MIME type of the file
            });

            // Send the PutObjectCommand to upload the file to S3
            await s3Client.send(command);

            publishLog(`uploaded ${file}`); // Publish upload completion log to Redis
            console.log('uploaded', filePath);
        }

        publishLog('Done'); // Publish upload completion log to Redis
        console.log('Done...');
    });
}

// Call the init function to start the execution of the script
init();
