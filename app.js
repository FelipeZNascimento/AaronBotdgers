const http = require('http');
const request = require('request');
const express = require('express');
const TeleBot = require('telebot');
const CONSTANTS = require('./constants.js')

//Environment variables
const BOT_KEY = process.env.BOT_KEY;
const API_DOMAIN = process.env.API_DOMAIN;
process.env.TZ = 'America/Sao_Paulo';

const WEEKS = CONSTANTS.WEEKS;
const currentSeason = '6';

const bot = new TeleBot(BOT_KEY);

function getRanking (week) {
    url = API_DOMAIN + 'getRanking.php?season=' + currentSeason;
    if (week)
        url += "&week="+week;
    
    return requestAPI(url);
}

function getScore (week) {
    url = API_DOMAIN + 'getMatches.php?season=' + currentSeason;

    if (week) {
        url += "&week="+week;
    } else {
        nowTimetamp = Date.now() / 1000;
        for (var i = 0; i < WEEKS.length; i++) {
            if (nowTimetamp < WEEKS[i].timestamp) {
                week = WEEKS[i].number;
                url += "&week="+week;
                break;
            }
        }
    }
    return requestAPI(url);
}

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

function leftJustify (name, size) {
    while (name.length <= size) {
        name += " ";
    }
    return name;
}

function rightJustify (name, size) {
    while (name.length <= size) {
        name = " " + name;
    }
    return name;
}

//bot.on('text', (msg) => msg.reply.text(msg.text)); //Copycat message

bot.on(['/start'], (msg) =>     msg.reply.text('Olá, eu sou o Aaron Botdgers e estou aqui pra entregar cada request que você fizer (assim como minha versão humana).'));
bot.on(['/help'], (msg) =>      msg.reply.text('Eu respondo aos seguintes comandos: /start, /help, /belt, /hailmary, /ranking'));
bot.on(['/belt'], (msg) =>      msg.reply.file('https://media.giphy.com/media/3o6wrpD9aOjLc5Q61W/giphy.gif', {asReply: true}));
bot.on(['/hailmary'], (msg) =>  msg.reply.file('https://i.makeagif.com/media/12-04-2015/9p8g5g.gif', {asReply: true}));
bot.on(['audio'], (msg) =>      msg.reply.text('Audible tá proibido nesse huddle.', { asReply: true }));
bot.on('edit', (msg) =>         msg.reply.text('Eu vi você editando essa mensagem aí... 👀', { asReply: true }));

bot.on(['/ranking'], (msg) => {
    var str = "";
    var param = "";
    var chat_id = msg.chat.id;
    
    if (msg.text.length > 8) {
        param = msg.text.substring(8);
        param = param.trim();
        if (param == "@BotdgersBot" ||
            param < 1 ||
            param > 21)
            param = "";
    }
    var getRankingPromise = getRanking(param);
    getRankingPromise.then(function(response) {
        
        str += "<code>";
        
        if (param.length > 0)
            str += "Semana " + param + "\n\n";
        
        str += leftJustify("", 3);
        str += leftJustify("Nome", 15);
        str += leftJustify("Pts", 4);
        str += "\n";
        for (var i = 1; i < response.length; i++) {
            position = leftJustify(response[i].position + ".", 3);
            name = leftJustify(response[i].name, 15);
            points = leftJustify(response[i].points_with_extras, 4);
            str += position + name + points + "\n";
        }
        str += "</code>";
        bot.sendMessage(chat_id, str, {"parseMode": "HTML"}).catch(err => console.log(err));

    }, function (err) {
        console.log(err);
    });    
});
     
bot.on(['/placar', '/placar_mini'], (msg) => {
    var str = "";
    var placar_mini = false;
    var param = "";
    var chat_id = msg.chat.id;
    
    if (msg.text.substring(0, 12) == "/placar_mini")
        placar_mini = true;
    
    if (!placar_mini && msg.text.length > 7)
        param = msg.text.substring(7);
    else if (placar_mini && msg.text.length > 12)
        param = msg.text.substring(12);

    param = param.trim();
  
    if (param == "@BotdgersBot" ||
        param < 1 ||
        param > 21)
        param = "";

    var getScorePromise = getScore(param);
    getScorePromise.then(function(response) {
        
        str += "<code>";
        if (param.length > 0)
            str += "Semana " + param + "\n\n";
        
        if (!placar_mini) {
            str += leftJustify("Status", 17);
            str += leftJustify("Away", 10);
            str += leftJustify("", 8);
            str += rightJustify("Home", 10);
            str += "\n";
            for (var i = 0; i < response.length; i++) {
                match = response[i];

                if (match.status == "P") {
                    var jsDate = new Date(match.timestamp * 1000);
                    time =  (jsDate.getDate()<10?'0':'') + jsDate.getDate() + "/" + 
                            (jsDate.getMonth()<10?'0':'') + jsDate.getMonth() + " " + 
                            (jsDate.getHours()<10?'0':'') + jsDate.getHours() + ":" + 
                            (jsDate.getMinutes()<10?'0':'') + jsDate.getMinutes();

                } else {
                    time = match.status;
                }
                away_team = match.team_away_alias;
                away_points = match.away_points.toString();
                home_points = match.home_points.toString();
                home_team = match.team_home_alias;
                possession = match.possession;

                time = leftJustify(time, 16);
                away_team = leftJustify(away_team, 10);
                away_team_points = leftJustify(away_points, 3);                        
                home_team_points = rightJustify(home_points, 3);
                home_team = rightJustify(home_team, 10);
                str += time;
                if (possession == "away")
                    str += "»";
                else str += " ";

                str += away_team + away_team_points + "@" + home_team_points + home_team;

                if (possession == "home")
                    str += "«\n";
                else str += " \n";

            }
        } else {
            for (var i = 0; i < response.length; i++) {
                match = response[i];

                if (match.status == "P") {
                    var jsDate = new Date(match.timestamp * 1000);
                    time =  (jsDate.getDate()<10?'0':'') + jsDate.getDate() + "/" + 
                            (jsDate.getMonth()<10?'0':'') + jsDate.getMonth() + " " + 
                            (jsDate.getHours()<10?'0':'') + jsDate.getHours() + ":" + 
                            (jsDate.getMinutes()<10?'0':'') + jsDate.getMinutes();

                } else {
                    time = match.status;
                }
                away_team = match.team_away_code;
                away_points = match.away_points.toString();
                home_points = match.home_points.toString();
                home_team = match.team_home_code;
                possession = match.possession;

                str += time + "\n";
                
                if (possession == "away")
                    str += "»";
                else str += " ";
                                
                str += leftJustify(away_team, 3) + " " + rightJustify(away_points, 2) + " @ " + leftJustify(home_points, 2) + " " + rightJustify(home_team, 3);
                
                if (possession == "home")
                    str += "«\n";
                else str += " \n";                
            }
        }
        str += "\n\nHorário de Brasília (GMT-3)"
        str += "</code>";
        bot.sendMessage(chat_id, str, {"parseMode": "HTML"}).catch(err => console.log(err));

    }, function (err) {
        console.log(err);
    });    
});


bot.start();

//const server = http.createServer((req, res) => {
//    res.statusCode = 200;
////    res.setHeader('Content-Type', 'text/plain');
////    res.end('Hello World\n');
//    index.sayHelloInEnglish();
//});
//
//server.listen(port, hostname, () => {
//    console.log(`Server running at http://${hostname}:${port}/`);
//});

var app = express();

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
