# it first clone the repository from clone url and then run the script.js file


export GIT_REPOSITORY_URL = "$GIT_REPOSITORY_URL"

git clone "$GIT_REPOSITORY_URL" /home/app/output

exc node script.js