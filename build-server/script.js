// first build the code and push in S3 bucket

const {exec}=require('child-process')
const path=require('path')

async function init(){

    console.log("Executing script .js file")
    const outDirPath=path.join(__dirname,'output')
    
    const p=exec(`cd${outDirPath} && npm install && npm run build`);

    p.stdout.on('data - ' , function (data){
        console.log(data.string())
    })

    p.stdout.on('error - ',function(data){
        console.log(data.string())
    })

    p.on('close',function(d){
        console.log('build complete')
    })

     

}