# take docker image from local storage if not found then in dockerHub.com
FROM ubuntu:local  
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -   
RUN apt-get upgrade -y
RUN apt-get install -y node.js
RUN apt-get install git -y

WORKDIR /home/app
COPY main.sh main.sh

ENTRYPOINT [ "/home/app/main.sh" ]
