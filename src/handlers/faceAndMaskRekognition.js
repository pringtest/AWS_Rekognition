// LIBRARY
const AWS = require("aws-sdk");
const q = require("q");

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
        let { base64Image } = incomingBody;

        if (!base64Image) {
            throw throwError("Parameter Not found.")
        }

        var params = {
            MaxResults: 10
        };
        var listCollectionsResp = await rekognition.listCollections(params).promise();
        let { CollectionIds } = listCollectionsResp;

        if (CollectionIds.length == 0) {
            var params = {
                CollectionId: "UserPoolFaceRecognitionDoorLock"
            };
            await rekognition.createCollection(params).promise();

            var response  = await successPayload('message', "Collection not found. Create a new collection. Please retry to search image.");
            return response
        } else {

            colletionId = CollectionIds[0];
            var bitmap = new Buffer.from(base64Image, 'base64');
            var promises = [];

            // face recognition
            var params = {
                CollectionId: CollectionIds[0],
                Image: {
                    Bytes: bitmap,
                },
                FaceMatchThreshold: 80.0,
                QualityFilter: "AUTO"
            };
            promises.push(rekognition.searchFacesByImage(params).promise());

            // face mask detector
            var params = {
                Image: {
                    Bytes: bitmap,
                },
                SummarizationAttributes: {
                    MinConfidence: 80,
                    RequiredEquipmentTypes: [
                        'FACE_COVER',
                    ]
                }
            };
            promises.push(rekognition.detectProtectiveEquipment(params).promise());
            var promiseResp = await q.all(promises);

            // face recognition
            var searchFacesByImageResp = promiseResp[0]
            let { FaceMatches } = searchFacesByImageResp;
            
            var ExternalImageId = "";
            FaceMatches.forEach(function(eachImage) {
                if (eachImage.Similarity >= 80) {
                    if (eachImage.Face.ExternalImageId) {
                        ExternalImageId = eachImage.Face.ExternalImageId;
                    }
                }
            })
            
            // face mask detector
            var detectProtectiveEquipmentResp = promiseResp[1];
            let { Persons } = detectProtectiveEquipmentResp;
            let { BodyParts } = Persons[0];
    
            let faceMaskStatus = false;
            let faceMaskConfidence = 0;
            
            BodyParts.forEach(function (eachItem) {
                let { Name, Confidence, EquipmentDetections } = eachItem;
                if (Name == 'FACE' && Confidence >= 80 && EquipmentDetections.length > 0) {
                    EquipmentDetections.forEach(function(eachEquipment) {
                        if (eachEquipment.Confidence >= 80 && eachEquipment.Type == "FACE_COVER") {
                            faceMaskStatus = true;
                            faceMaskConfidence = eachEquipment.Confidence;
                        }
                    })
                }
            })
            
            var response  = await successPayload('data', {
                result: FaceMatches.length,
                status: FaceMatches.length > 0 ? true : false,
                name: ExternalImageId,
                faceMaskStatus,
                faceMaskConfidence,
            })

            return response
        }
    }
    catch (error) {
        var response = await errorPayload(error.statusCode, error.message);
        return response;
    }
}
