'use strict';

const express = require('express');
const path = require('path');
const STATIC_PATH = path.join(__dirname, '..', '..', 'client');
const STATIC_OPTS = {
  maxAge: 31536000000
};

module.exports = express.static(STATIC_PATH, STATIC_OPTS);