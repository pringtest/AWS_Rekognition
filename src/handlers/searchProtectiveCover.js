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
        let { base64Image } = incomingBody;

        if (!base64Image) {
            throw throwError("Parameter Not found.")
        }

        var bitmap = new Buffer.from(base64Image, 'base64');

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
        var detectProtectiveEquipmentResp = await rekognition.detectProtectiveEquipment(params).promise();
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
            faceMaskStatus,
            faceMaskConfidence,
        })
        return response
    }
    catch (error) {
        var response = await errorPayload(error.statusCode, error.message);
        return response;
    }
}
