// LIBRARY
const AWS = require("aws-sdk");

// AWS SERVICES
const docClient = new AWS.DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    region: 'ap-northeast-1'
});
const rekognition = new AWS.Rekognition({
    apiVersion: '2016-06-27',
    region: 'ap-northeast-1'
});

// GLOBAL FUNCTION
function throwError (message) {
    var payload = {
        statusCode: 400, 
        message: message,
    }
    return payload;
}
async function errorPayload (statusCode, message) {
    try {
        var payload = {
            statusCode: statusCode,
            headers: {
                "Content-Type": "application/json",
                "x-amzn-ErrorType": statusCode
            },
            isBase64Encoded: false,
            body: JSON.stringify({
                message: message,
                statusCode: statusCode,
            })
        }

        return payload
    }
    catch (error) {
        throw error
    }
}
async function successPayload (type, input) {
    try {
        var body = {};
        switch (type) {
            case 'data':
                body = {
                    data: input,
                    statusCode: 200,
                }
                break;
            case 'message':
                body = {
                    message: input,
                    statusCode: 200,
                }
                break;
        }

        var payload = {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            isBase64Encoded: false,
            body: JSON.stringify(body),
        }

        return payload
    }
    catch (error) {
        throw error
    }
}


// MAIN FUNCTION
exports.functionHandler = async (event) => {
    try {
        if (!event.body) {
            throw throwError("Not found.")
        }

        let { body } = event;
        const incomingBody = JSON.parse(body);
        let { base64Image, faceName } = incomingBody;

        if (!base64Image || !faceName) {
            throw throwError("Parameter Not found.")
        }

        var params = {
            MaxResults: 10
        };
        var listCollectionsResp = await rekognition.listCollections(params).promise();
        let { CollectionIds, FaceModelVersions } = listCollectionsResp;

        if (CollectionIds.length == 0) {
            var params = {
                CollectionId: "UserPoolFaceRecognitionDoorLock"
            };
            await rekognition.createCollection(params).promise();

            var response  = await successPayload('message', "Collection not found. Create a new collection. Please retry to save image.");
            return response
        } else {
            var bitmap = new Buffer.from(base64Image, 'base64');

            var params = {
                CollectionId: CollectionIds[0],
                Image: {
                  Bytes: bitmap
                },
                ExternalImageId: faceName,
                QualityFilter: "AUTO"
            };
            var indexFacesResp = await rekognition.indexFaces(params).promise();

            let { FaceRecords } = indexFacesResp;
          
            var response  = await successPayload('data', { 
                faceDetected: FaceRecords.length
            })
            return response
        }
    }
    catch (error) {
        var response = await errorPayload(error.statusCode, error.message);
        return response;
    }
}
