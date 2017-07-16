var express = require('express');
var router = express.Router();
var request = require('request');

// routes
/* GET a barcode, return ingredients */
router.get('/barcode/:barcode', function(req, res) {
    var resp_obj = {
        'barcode' : req.params.barcode,
        "res"     : res
    };
    callFoodFacts(resp_obj)
        .then(getDBPedia)
        .then(processResult, getAltDBPedia)
        .then(processResult)
        .catch(function(err) {
            res.json({
                "err" : err.toString()
            });
        });

    //  callFoodFacts(resp_obj)
    //     .then(getFoodSearch)
    //     .then(processResult)
    //     .catch(function(err) {
    //         res.json({
    //             "err" : err.toString()
    //         });
    //     });
});

// helper functions
function callFoodFacts(resp_obj) {
    console.log(resp_obj.barcode);
    return new Promise(function(resolve, reject) {
        var options = {
            uri: "http://world.openfoodfacts.org/api/v0/product/"+resp_obj.barcode+".json",
            json: true // Automatically parses the JSON string in the response 
        };

        return request(options, function(err, resp, body) {
            if (err || !body.status) {
                if (!body.status) {
                    err = "Invalid barcode supplied";
                }
                return reject(err);
            }
            if (body.status) {
                var response = {
                    "body" : body,
                    "res"  : resp_obj.res
                };
                return resolve(response);
            }
        });
    });
}

function getDBPedia(foodInfo) {
    // use this link otherwise use the below link if no results found and show me the results
    // http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=food&QueryString=scotch_egg
    // http://lookup.dbpedia.org/api/search/KeywordSearch?QueryString=scotch_egg
    // console.log(foodInfo.body);
    return new Promise(function(resolve, reject) {
        var encoded_name = encodeNameForDBPedia(foodInfo.body.product.generic_name);
        var options = {
            uri: "http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=food&QueryString="+encoded_name,
            json: true
        };

        return request(options, function(err, resp, body) {
            if (err || body.results.length < 1) {
                console.log('bye friends');
                return reject(foodInfo);
            }
            console.log('hello friends');
            var response = {
                "body" : body,
                "res"  : foodInfo.res
            };
            return resolve(response);
        });
    });

}

function getAltDBPedia(foodInfo) {
    // console.log(foodInfo.body);
    return new Promise(function(resolve, reject) {
        var encoded_name = encodeNameForDBPedia(foodInfo.body.product.generic_name);
        var options = {
            uri: "http://lookup.dbpedia.org/api/search/KeywordSearch?QueryString="+encoded_name,
            json: true
        };

        return request(options, function(err, resp, body) {
            // console.log(body.results.length);
            if (err || body.results.length < 1) {
                return reject(foodInfo);
            }

             var response = {
                "body" : body,
                "res"  : foodInfo.res
            };
            return resolve(response);
        });
    });
}

function getFoodSearch(foodInfo) {
    return new Promise(function(resolve, reject) {
        var options = {
            uri: "https://www.openfood.ch/api/v3/products/_search",
            json: true,
            headers: {
                "Authorization" : "Token token=9b116e0e80512b17eae9a72d3067d287"
            },
            method: "POST",
            postData: {
                params: {
                    "_source": {
                        "includes": [
                        "name_translations",
                        "barcode",
                        "ingredients",
                        "nutrients"
                        ]
                    },
                    "size": 20,
                    "query": {
                        "query_string": {
                        "fields" : [

                        ],
                        "query" : "Walkers Shortbread"
                        }
                    }
                }
            }
        }

        return request(options, function(err, resp, body) {
            var response = {
                "body" : body,
                "res"  : foodInfo.res
            }
            return resolve(response);
        });
    });
}

function processResult(foodResult) {
    // console.log(foodResult.body);
    // return new Promise(function(resolve, reject){
    // console.log('hello');
    var json_obj = {
        "status" : 1,
        "result" : foodResult.body
    };
    return foodResult.res.json(json_obj);
    // });
}

function encodeNameForDBPedia(foodName) {
    return foodName.replace(" ", "_");
}

module.exports = router;
