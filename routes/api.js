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
        .then(processDBResult, getAltDBPedia)
        .then(processDBResult)
        .catch(function(err) {
            res.json({
                "err" : err.toString()
            });
        });
});

router.get('/barcode/:barcode/food-search', function(req, res) {
    var resp_obj = {
        'barcode' : req.params.barcode,
        "res"     : res
    };

    callFoodFacts(resp_obj)
        .then(getFoodSearch)
        .then(processOpenFoodResult)
        .catch(function(err) {
            res.json({
                "err" : err.toString()
            });
        });
})

// helper functions
function callFoodFacts(resp_obj) {
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

    return new Promise(function(resolve, reject) {
        var encoded_name = encodeNameForDBPedia(foodInfo.body.product.generic_name);
        var options = {
            uri: "http://lookup.dbpedia.org/api/search/KeywordSearch?QueryClass=food&QueryString="+encoded_name,
            json: true
        };

        return request(options, function(err, resp, body) {
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

function getAltDBPedia(foodInfo) {
    
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

    var params = {
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
    };

    return new Promise(function(resolve, reject) {
        var options = {
            uri: "https://www.openfood.ch/api/v3/products/_search",
            json: true,
            headers: {
                "Authorization" : "Token token="+process.env.OPEN_FOOD_KEY,
                "Content-Type"  : "application/json"
            },
            method: "POST",
            body: { 
                _source: { 
                    includes: [ 
                        "display_name_translations",
                        "ingredients", 
                        "nutrients"
                    ] 
                },
                size: 20,
                query: { 
                    query_string: { 
                        fields: [], 
                        query: foodInfo.body.product.generic_name 
                    } 
                } 
            },
        }

        return request(options, function(err, resp, body) {
            if (body.status == 400) {
                err = "Search failed";
                return reject(err);
            }

            var response = {
                "body" : body,
                "res"  : foodInfo.res
            }
            return resolve(response);
        });
    });
}

function processDBResult(foodResult) {
    var resultArray = [];
    foodResult.body.results.forEach(function(item) {
        var obj = {
            "label"       : item.label,
            "description" : item.description
        }
        resultArray.push(obj);
    });

    var json_obj = {
        "status" : 1,
        "result" : resultArray
    };
    return foodResult.res.json(json_obj);
}

function processOpenFoodResult(foodResult) {
    var json_obj = {
        "status" : 1,
        "result" : foodResult.body
    };
    return foodResult.res.json(json_obj);
}

function encodeNameForDBPedia(foodName) {
    return foodName.replace(/ /gi, "_");
}

module.exports = router;
