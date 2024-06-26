### Setup Guide

This Project contains following services and folders:

- `api-server`: HTTP API Server for REST API's
- `build-server`: Docker Image code which clones, builds and pushes the build to S3
- `s3-reverse-proxy`: Reverse Proxy the subdomains and domains to s3 bucket static assets(build code)

### Local Setup

1. Run `npm install` in all the 3 services i.e. `api-server`, `build-server` and `s3-reverse-proxy`
2. Docker build the `build-server` and push the image to AWS ECR.
3. Setup the `api-server` by providing all the required config such as TASK ARN and CLUSTER arn.
4. Run `node index.js` in `api-server` and `s3-reverse-proxy`

At this point following services would be up and running:

| S.No | Service            | PORT    |
| ---- | ------------------ | ------- |
| 1    | `api-server`       | `:9000` |
| 2    | `socket.io-server` | `:9002` |
| 3    | `s3-reverse-proxy` | `:8000` |

### SetUp Database

1. Start a PostgreSQL database using Docker:

   ```bash
   docker run -d \
       --name cms-db \
       -e POSTGRES_USER=myuser \
       -e POSTGRES_PASSWORD=mypassword \
       -e POSTGRES_DB=mydatabase \
       -p 5432:5432 \
       postgres
   ```

   based on this command the connection url will be

   ```
   DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydatabase?schema=public
   ```

2. Create a `.env` file based on the `.env.example` file and configure the `DATABASE_URL` with your postgreSQL connection string.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Run database migrations:

   ```bash
   npm run prisma:migrate

### Demo

[Watch The Demo Video](https://imgur.com/I6KgmNR)

### Architecture

![Architecture](https://i.imgur.com/r7QUXqZ.png)
