const http = require('http');
const request = require('request');
const express = require('express');
const TeleBot = require('telebot');
const CONSTANTS = require('./constants.js');
var util = require('./util.js');

//Environment variables
const BOT_KEY = process.env.BOT_KEY;
const API_DOMAIN = process.env.API_DOMAIN;
process.env.TZ = 'America/Sao_Paulo';

const WEEKS = CONSTANTS.WEEKS;
const CURRENT_SEASON = CONSTANTS.CURRENT_SEASON;

const bot = new TeleBot(BOT_KEY);

function getRanking (week) {
    url = API_DOMAIN + 'getRanking.php?season=' + CURRENT_SEASON;
    if (week)
        url += "&week="+week;
    
    return util.requestAPI(url);
}

function getScore (week) {
    url = API_DOMAIN + 'getMatches.php?season=' + CURRENT_SEASON;

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
    return util.requestAPI(url);
}

//bot.on('text', (msg) => msg.reply.text(msg.text)); //Copycat message

bot.on(['/start'], (msg) =>     msg.reply.text('Olá, eu sou o Aaron Botdgers e estou aqui pra entregar cada request que você fizer (assim como minha versão humana).'));
bot.on(['/help'], (msg) => {
    var chat_id = msg.chat.id;
    
    var str = "Eu respondo aos seguintes comandos:\n\n";
    str += "<code>";
    str += "/ranking\n"
    str += "    Retorna ranking geral da atual temporada\n";
    str += "/ranking [semana]\n"
    str += "    Retorna ranking da semana escolhida\n";
    str += "/placar\n"
    str += "    Retorna placar da atual semana\n";
    str += "/placar [semana]\n"
    str += "    Retorna placar da semana escolhida\n";
    str += "/placar_mini\n"
    str += "    Retorna placar da atual semana (versão mobile)\n";
    str += "/placar_mini [semana]\n"
    str += "    Retorna placar da semana escolhida (versão mobile)\n";
    str += "/belt\n"
    str += "    Retorna um gif do Aaron Rodgers fazendo a comemoração cinturão\n";
    str += "/hailmary\n"
    str += "    Retorna um gif da Hail Mary contra Detroit (Milagre de Detroit)\n";
    str += "</code>";

    bot.sendMessage(chat_id, str, {"parseMode": "HTML"}).catch(err => console.log(err));
});

bot.on(['/belt'], (msg) =>      msg.reply.file('https://media.giphy.com/media/3o6wrpD9aOjLc5Q61W/giphy.gif', {asReply: true}));
bot.on(['/hailmary'], (msg) =>  msg.reply.file('https://i.makeagif.com/media/12-04-2015/9p8g5g.gif', {asReply: true}));
bot.on(['voice'], (msg) =>      msg.reply.text('Audible tá proibido nesse huddle.', { asReply: true }));
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
        
        str += util.leftJustify("", 3);
        str += util.leftJustify("Nome", 18);
        str += util.leftJustify("Pts", 4);
        str += "\n";
        for (var i = 1; i < response.length; i++) {
            position = util.leftJustify(response[i].position + ".", 3);
            name = util.leftJustify(response[i].name, 18);
            points = util.leftJustify(response[i].points_with_extras, 4);
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
        
        //Header only if not mini scoreboard
        if (!placar_mini) {
            str += util.leftJustify("Status", 17);
            str += "Away";
            str += util.leftJustify("", 7);
            str += "Home";
            str += "\n";
        }
        
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

            if (placar_mini)
                str += time + "\n";
            else
                str += util.leftJustify(time, 16);

            if (possession == "away")
                str += "»";
            else str += " ";

            str += util.leftJustify(away_team, 4) + util.rightJustify(away_points, 2) + " @ " + util.leftJustify(home_points, 2) + util.rightJustify(home_team, 4);

            if (possession == "home")
                str += "«\n";
            else str += " \n";

        }
        str += "\n\nHorário de Brasília (GMT-3)"
        str += "</code>";
        bot.sendMessage(chat_id, str, {"parseMode": "HTML"}).catch(err => console.log(err));

    }, function (err) {
        console.log(err);
    });    
});

bot.start();

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
