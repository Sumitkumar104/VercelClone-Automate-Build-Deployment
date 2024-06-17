
const { exec } = require('child_process'); // For executing shell commands
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const Redis = require('ioredis'); // Redis client for publishing logs
const dotnev=require('dotenv');
dotnev.config();

// Initialize Redis client for publishing logs
const publisher = new Redis(process.env.REDIS_URL);

const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});


const PROJECT_ID = process.env.PROJECT_ID;

// Function to publish logs to Redis
function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}



// Main function to execute the script
async function init() {
    console.log('Executing script.js');
    publishLog('Build Started...'); 

    // Define output directory path
    const outDirPath = path.join(__dirname, 'output');

    // Execute npm install and npm run build commands in the output directory
    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    // Event listener for capturing standard output
    p.stdout.on('data', function (data) {
        console.log(data.toString());
        publishLog(data.toString()); 
    });

    // Event listener for capturing errors
    p.stderr.on('data', function (data) {
        console.log('Error', data.toString());
        publishLog(`error: ${data.toString()}`);
    });

    // Event listener for the completion of the build process
    p.on('close', async function () {
        console.log('Build Complete');
        publishLog('Build Complete');

        // Define path to the distribution folder
        const distFolderPath = path.join(__dirname, 'output', 'dist');

        // Get the contents of the distribution folder recursively
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true });


// -----------------------------------------------------------------------------------------------------------
        // Upload all content of build folder in S3 storage service 
        publishLog('Starting to upload');

        // Iterate through each file in the distribution folder
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);           

            // Skip directories
            if (fs.lstatSync(filePath).isDirectory()) continue;          // the fs module's lstatSync method synchronously to get the file status information for the file specified by filePath.

            console.log('uploading', filePath);
            publishLog(`uploading ${file}`); 

            // Create a PutObjectCommand to upload the file to S3
            const command = new PutObjectCommand({
                Bucket: 'sumit104vercelclone',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath) 
            });

            // Send the PutObjectCommand to upload the file to S3
            await s3Client.send(command);

            publishLog(`uploaded ${file}`);
            console.log('uploaded', filePath);
        }

        publishLog('Done');
        console.log('Done...');
    });
}

// Call the init function to start the execution of the script
init();
