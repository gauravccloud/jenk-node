var express = require("express");
var bodyParser = require("body-parser");
var configuration = require("./apps/configuration");
var app = express();

app.use(require('./middleware/https-redirect'));
app.use(require('./middleware/remove-hash'));
app.use(require("./apps/static"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/',require('./apps/home'));
var port = 8085 || process.env.port;


function startServer() {
    app.listen(port, function() {
        console.log("Server running at", port);
    });
}

configuration.getCofigurationPages(function(config_pages){
    configuration.getConfigurationAds(function(config_ads){
        startServer();
    })
})

