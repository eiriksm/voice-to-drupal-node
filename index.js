'use strict';
var wit = require('node-wit');
var rec = require('node-record-lpcm16');
var request = require('request');
var uuid = require('node-uuid');
var async = require('async');
var fs = require('fs');
var path = require('path');

function voicePoster(config) {
  this.config = config;
  return this;
}

module.exports = voicePoster;

// @todo. All of these small functions should be moved into files and be unit
// tested.

function findRandomFile(animal, files, callback) {
  // Avoid the file .DS_Store
  files = files.filter(function(f) {
    return f != '.DS_Store';
  });
  var filePath = path.join(__dirname, animal, files[Math.floor(Math.random() * files.length)]);
  console.log('Filepath is', filePath);
  callback(null, filePath);
}

function base64EncodeFile(fileContent, callback) {
  callback(null, fileContent.toString('base64'));
}

function postFile(config, base64, callback) {
  var filename = uuid.v4();
  var baseUrl = config.baseUrl;
  var data = {
    '_links': {
      type: {
        href: baseUrl + '/rest/type/file/file'
      }
    },
    filename: [
      {
        value: filename
      }
    ],
    filemime: [
      {
        value: 'image/gif'
      }
    ],
    uri: [
      {
        value: 'public://' + filename + '.gif'
      }
    ],
    data: [
      {
        value: base64
      }
    ]
  };
  sendPostRequest(config, 'file', data, function(err, res, bod) {
    console.log('sent post req')
    if (err) {
      callback(err);
    }
    else if (res.statusCode != 201) {
      console.log(bod)
      callback(new Error('Wrong status code. was ' + res.statusCode));
    }
    else {
      callback(err, filename);
    }
  });
}

function sendPostRequest(config, method, data, callback) {
  request({
    method: 'POST',
    uri: config.baseUrl + '/entity/' + method,
    headers: {
      'Content-type': 'application/hal+json',
      'Accept': 'application/hal+json'
    },
    body: JSON.stringify(data),
    auth: {
      user: config.user,
      pass: config.pass
    }
  }, callback);
}

function getFile(config, filename, callback) {
  // @todo. Make this more generic and not rely on a custom view. That would be
  // nice.
  request({
    uri: config.baseUrl + '/rest-file/' + filename + '?_format=hal_json',
    headers: {
      'Content-type': 'application/hal+json',
      'Accept': 'application/hal+json'
    }
  }, function(err, res, bod) {
    var d;
    try {
      d = JSON.parse(bod);
    }
    catch (e) {
      console.log('HORRIBLE problem with parsing something we wanted to be JSON');
      callback(e)
      return;
    }
    callback(null, d[0]);
  });
}

function postNode(config, animal, file, callback) {
  console.log(file)
  var filename = file.filename[0].value;
  var url = file._links.self.href;
  var uuid = file.uuid[0].value;
  var obj = {
    _links: {
      type: {
        href: config.baseUrl + '/rest/type/node/article'
      },
      [config.baseUrl + "/rest/relation/node/article/field_image"]: [
            {
                "href": url
            }
        ]
    },
    "_embedded": {
        [config.baseUrl + "/rest/relation/node/article/field_image"]: [
            {
                "_links": {
                    "self": {
                        "href": url
                    },
                    "type": {
                        "href": config.baseUrl + "/rest/type/file/file"
                    }
                },
                "uuid": [
                    {
                        "value": uuid
                    }
                ]
            }
        ]
    },
    title: [
      {
        value: 'a picture of a ' + animal
      }
    ],
    promote: [
       {
        value: 1
        }
    ],
    "status": [
        {
            "value": "1",
        }
    ],
    type: [
      {
        target_id: 'article'
      }
    ]
  };
  sendPostRequest(config, 'node', obj, function(err, st, bod) {
    console.log(arguments);
  })
}

function postNodeWithFile(animal, config) {
  console.log('posting', animal);
  // Find a random file from the corresponding animal catalog.
  async.waterfall([
    fs.readdir.bind(null, path.join(__dirname, animal)),
    findRandomFile.bind(null, animal),
    fs.readFile,
    base64EncodeFile,
    postFile.bind(null, config),
    getFile.bind(null, config),
    postNode.bind(null, config, animal)
  ], function(err, file) {
    console.log(err, file, 'wat')
  });
}

voicePoster.prototype.init = function() {
  var initRec = () => {
    console.log('Recording until silence');

    var file = rec.start();

    wit.captureSpeechIntent(this.config.token, file, "audio/wav", (err, res) => {
      console.log('Response on audio stream');
      if (err) console.log("Error: ", err);
      console.log('Possible text:', res._text);
      if (!res._text) {
        console.log('No text found. Try again');
      }
      else if (res._text.indexOf('cat') > -1) {
        postNodeWithFile('cat', this.config);
      }
      else if (res._text.indexOf('dog') > -1) {
        postNodeWithFile('dog', this.config);
      }
      // @todo. Expose a stop function.
      initRec();
    });
  }
  initRec();
}
