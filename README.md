# AWS Rekognition 
## Introduction 
- This repo contain basic example of **AWS Rekognition** deploy by using **SAM**. 
- **API Gateway** was used to trigger **Lambda** to execute **AWS Rekognition**.
- Please Refer **AWS Rekognition SDK** for more detail : [Click ME][awssdk]
- Feel free to explore the code at your own risk. :stuck_out_tongue_winking_eye:

## Method Used
- Delete Collection (create face collection)
- Create Collection (delete face collection)
- Index Faces (save face into collection)
- Detect Protective Equipment (detect face mask, safety helmet, etc)
- List Collection (collection list created in AWS Rekognition)

## Project Involved
- Security Door lock with Face Recognition (RaspberryPi)
- Attandance System using Face Recognition with Mask Detection (RaspberryPi)

## Tech
This repo uses open source projects to work properly:
- [node.js] - used for the backend
- [AWS CLI] - used for enviroment
- [SAM CLI] - used for build and deployment

## Installation

- Requires latest [Node.js][node.js] to run.
- Requires latest [SAM CLI][SAM CLI] to run.
- Requires latest [AWS CLI][AWS CLI] to run.

Install the dependencies and devDependencies.
```sh
cd AWS_Rekognition
npm install
```
SAM build and deploy. Used --guided for the first deployment
```sh
aws configure
sam build
sam deploy --guided
```


## License

MIT

**Free Software, Syukran Alhamdulillah Thank to Allah!**
    
   [awssdk]: <https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Rekognition.html>
   [node.js]: <http://nodejs.org>
   [SAM CLI]: <https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html>
   [AWS CLI]: <https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html>
