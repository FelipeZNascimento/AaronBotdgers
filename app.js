const http = require('http');
const request = require('request');
const express = require('express');
const TeleBot = require('telebot');

const BOT_KEY = process.env.BOT_KEY;
const API_DOMAIN = process.env.API_DOMAIN;

const currentSeason = '6';

const bot = new TeleBot(BOT_KEY);

const weeks = [
    {
        number: 1,
        text: 'Semana 1',
        text_en: 'Week 1',
        timestamp: 1536721200
    },
    {
        number: 2,
        text: 'Semana 2',
        text_en: 'Week 2',
        timestamp: 1537326000
    },
    {
        number: 3,
        text: 'Semana 3',
        text_en: 'Week 3',
        timestamp: 1537930800
    },
    {
        number: 4,
        text: 'Semana 4',
        text_en: 'Week 4',
        timestamp: 1538535600
    },
    {
        number: 5,
        text: 'Semana 5',
        text_en: 'Week 5',
        timestamp: 1539140400
    },
    {
        number: 6,
        text: 'Semana 6',
        text_en: 'Week 6',
        timestamp: 1539745200
    },
    {
        number: 7,
        text: 'Semana 7',
        text_en: 'Week 7',
        timestamp: 1540350000
    },
    {
        number: 8,
        text: 'Semana 8',
        text_en: 'Week 8',
        timestamp: 1540954800
    },
    {
        number: 9,
        text: 'Semana 9',
        text_en: 'Week 9',
        timestamp: 1541556000
    },
    {
        number: 10,
        text: 'Semana 10',
        text_en: 'Week 10',
        timestamp: 1542160800
    },
    {
        number: 11,
        text: 'Semana 11',
        text_en: 'Week 11',
        timestamp: 1542765600
    },
    {
        number: 12,
        text: 'Semana 12',
        text_en: 'Week 12',
        timestamp: 1543370400
    },
    {
        number: 13,
        text: 'Semana 13',
        text_en: 'Week 13',
        timestamp: 1543975200
    },
    {
        number: 14,
        text: 'Semana 14',
        text_en: 'Week 14',
        timestamp: 1544580000
    },
    {
        number: 15,
        text: 'Semana 15',
        text_en: 'Week 15',
        timestamp: 1545184800
    },
    {
        number: 16,
        text: 'Semana 16',
        text_en: 'Week 16',
        timestamp: 1545789600
    },
    {
        number: 17,
        text: 'Semana 17',
        text_en: 'Week 17',
        timestamp: 1546394400
    },
    {
        number: 18,
        text: 'Wild Card',
        text_en: 'Wild Card',
        timestamp: 1546999200
    },
    {
        number: 19,
        text: 'Rodada Divisional',
        text_en: 'Divisional Round',
        timestamp: 1547604000
    },
    {
        number: 20,
        text: 'Finais de Conferência',
        text_en: 'Conference Finals',
        timestamp: 1548208800
    },
    {
        number: 21,
        text: 'Super Bowl',
        text_en: 'Super Bowl',
        timestamp: 1559887200 //2019 June, 07
    }
];

function getRanking (week) {
    url = API_DOMAIN + 'getRanking.php?season=' + currentSeason;
    if (week)
        url += "&week="+week;
    
    var options = {
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    };

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

function getScore (week) {
    url = API_DOMAIN + 'getMatches.php?season=' + currentSeason;

    if (week) {
        url += "&week="+week;
    } else {
        nowTimetamp = Date.now() / 1000;
        for (var i = 0; i < weeks.length; i++) {
            if (nowTimetamp < weeks[i].timestamp) {
                week = weeks[i].number;
                url += "&week="+week;
                break;
            }
        }
    }
    var options = {
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    };
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
        
        str += leftJustify("Pos", 4);
        str += leftJustify("Nome", 18);
        str += leftJustify("Pts", 4);
        str += "\n";
        for (var i = 1; i < response.length; i++) {
            position = leftJustify(response[i].position + ".", 4);
            name = leftJustify(response[i].name, 18);
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
