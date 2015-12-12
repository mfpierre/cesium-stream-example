// most basic dependencies
var express = require('express')
  , http = require('http')
  , os = require('os')
  , path = require('path')
  , fs = require('fs')
  , Chance = require('chance');

// create the app
var app = express();
var chance = new Chance();

// configure everything, just basic setup
app.set('port', process.env.PORT || 3000);
app.use(function(req, resp, next) {
  resp.header("Access-Control-Allow-Origin", "*");
  resp.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Serve the www directory statically
app.use(express.static('www'));

//---------------------------------------
// mini app
//---------------------------------------
var openConnections = [];

app.get('/czml', function(req, resp) {

    req.socket.setTimeout(2 * 60 * 1000);

    // send headers for event-stream connection
    // see spec for more information
    resp.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    resp.write('\n');

    // push this res object to our global variable
    openConnections.push(resp);

    // send document packet
    var d = new Date();
    resp.write('id: ' + d.getMilliseconds() + '\n');
    resp.write('data:' + JSON.stringify({ "id":"document", "version":"1.0" })+   '\n\n'); // Note the extra newline

    // When the request is closed, e.g. the browser window
    // is closed. We search through the open connections
    // array and remove this connection.
    req.on("close", function() {
        var toRemove;
        for (var j =0 ; j < openConnections.length ; j++) {
            if (openConnections[j] == resp) {
                toRemove =j;
                break;
            }
        }
        openConnections.splice(j,1);
    });
});

setInterval(function() {
    // we walk through each connection
    openConnections.forEach(function(resp) {

        // send doc
        var d = new Date();
        resp.write('id: ' + d.getMilliseconds() + '\n');
        resp.write('data:' + createMsg() +   '\n\n'); // Note the extra newline
    });

}, 1000);

function createMsg() {
    var d = new Date();
    var entity = {
        "id": d.getMilliseconds(),
        "polyline": {
            "positions": {
                "cartographicDegrees": [
                  chance.latitude(), chance.longitude(), 0
                  ,chance.latitude(), chance.longitude(), 0
              ]
        },
        "width": 2,
        "material":
            { "solidColor":
                { "color" :
                    {"rgba": [0,0,255,255]}
                }
            }
        }
    };

    return JSON.stringify(entity);;
}

// startup everything
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
})
