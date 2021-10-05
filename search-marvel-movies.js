const AWS = require('aws-sdk');

var region = 'us-east-2';
var domain = process.env.DOMAIN_URL; // e.g. search-domain.region.es.amazonaws.com
var index = 'marvel_movies';
var api_type = '_search';

const searchDocument = async (key) => {
    try {

        let query = {
            "size": 25,
            "query": {
                "multi_match": {
                    "query": key,
                    "fields": ["Title^4", "Plot^2", "Cast"]
                }
            }
        };
        //creating a request body
        var endpoint = new AWS.Endpoint(domain); //creating Endpoint
        var request = new AWS.HttpRequest(endpoint, region); //creating request body with endpoint and region
        request.method = 'GET';  // method PUT, POST, GET & Delete
        request.path += index + '/' + api_type + '/';
        request.body = JSON.stringify(query);
        request.headers['host'] = domain;
        request.headers['Content-Type'] = 'application/json';
        request.headers['Content-Length'] = Buffer.byteLength(request.body);

        console.log('OpenSearch Request: ', { request });


        //Signing the request with authorized credentails like IAM user or role
        var credentials = new AWS.EnvironmentCredentials('AWS');
        var signer = new AWS.Signers.V4(request, 'es');
        signer.addAuthorization(credentials, new Date());

        //http request to the server
        var client = new AWS.HttpClient();
        return new Promise((resolve, reject) => {
            client.handleRequest(
                request,
                null,
                function (response) {
                    console.log(response.statusCode + ' ' + response.statusMessage);
                    var responseBody = '';
                    response.on('data', function (chunk) {
                        responseBody += chunk;
                    });
                    response.on('end', function (chunk) {
                        console.log('Response body: ' + responseBody);
                        resolve(responseBody);
                    });
                },
                function (error) {
                    console.log('Error: ' + error);
                    reject(error);
                }
            );
        });
    } catch (err) {
        console.log(err);
    }
};

exports.handler = async (event) => {

    console.log("Event: ", JSON.stringify(event));

    const key = event.queryStringParameters.key;
    console.log("key", key);

    //calling the function to query
    let res = await searchDocument(key);
    console.log("Results Fetched..........");
    res = JSON.parse(res);

    //remove additional data
    let records = [];
    res.hits.hits.forEach(data => {
        records.push(data._source);
    });

    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify(records)
    };
    return response;

};
