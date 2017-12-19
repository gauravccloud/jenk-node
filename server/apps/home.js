var express = require("express");
var home = express();
var path = require('path');
var fs = require('fs');

var libraryPath = path.join(__dirname, '..', '..', 'client');
var viewPath = path.join(__dirname, '..', '..', 'views');

home.set('views', viewPath);
home.set('view engine', 'ejs');
home.get('/', function(req, res){
    console.log("Request Comes");
    res.render('index');    
});
module.exports = home;