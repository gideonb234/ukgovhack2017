var express = require('express');
var router = express.Router();
var rp = require('request-promise');

/* GET a barcode, return ingredients */
router.get('/barcode/:barcode', function(req, res, next){
    var foodObject = callFoodFacts(req.params.barcode)
        .then(function(result) {
            if (result.status == 1) {
                res.json({
                    "ingredients"   : result.product.ingredients,
                    "nutrients"     : result.product.nutriments
                });
            } else {
                res.json({
                    'status'    : 0,
                    'error'     : 'No product found'
                });
            }
        }).catch(function(err) {
            res.json(err);
        });
});

function callFoodFacts(barcode) {
    var options = {
        uri: "http://world.openfoodfacts.org/api/v0/product/"+barcode+".json",
        json: true // Automatically parses the JSON string in the response 
    };
    
    return rp(options) 
}

module.exports = router;
