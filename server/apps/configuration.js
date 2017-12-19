var request = require("request");
exports.getCofigurationPages = function(callback) {
    request('https://sony.cognitiveclouds.com/api/configuration/config_pages', function(error, response_pages, body){
        console.log("Response came")    
        callback(response_pages);
    });
};

exports.getConfigurationAds = function(callback) {
    request('https://sony.cognitiveclouds.com/api/configuration/config_ads', function(error, response_pages, body){
        console.log("Response came")    
        callback(response_pages);
    });
};