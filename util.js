const request = require('request');
//Useful functions

//Makes API request
function requestAPI(url) {
    var options = {
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    };
    
    //For console debugging purposes
    console.log(url);

    return new Promise(function(resolve, reject) {
        request.get(options, function(err, resp, body) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(body));
            }
        })
    })
}

//Justify string 'name' until length = 'size' to the left
function leftJustify (name, size) {
    while (name.length < size) {
        name += " ";
    }
    return name;
}

//Justify string 'name' until length = 'size' to the right
function rightJustify (name, size) {
    while (name.length < size) {
        name = " " + name;
    }
    return name;
}

module.exports = {
    requestAPI : requestAPI,
    leftJustify : leftJustify,
    rightJustify : rightJustify    
}