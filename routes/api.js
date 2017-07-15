var express = require('express');
var router = express.Router();

/* GET a barcode, return ingredients */
router.get('/barcode/:barcode', function(req, res){
    //http://world.openfoodfacts.org/api/v0/product/:barcode.json
    console.log(req.params);
});

module.exports = router;
