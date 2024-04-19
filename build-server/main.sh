# it first clone the repository from clone url and then run the script.js file


export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"

git clone "$GIT_REPOSITORY_URL" /home/app/output

exc node script.js

# basicly what we do 
# clone the repo from the gitHub , make the image of the repo on AWS ECR and run that image in container on AWS-ECS.