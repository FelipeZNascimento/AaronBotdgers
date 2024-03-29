const express = require('express');
const TeleBot = require('telebot');
const CONSTANTS = require('./constants.js');
const dotenv = require('dotenv');
const util = require('./util.js');

//Environment variables
dotenv.config();
const BOT_KEY = process.env.BOT_KEY;
const API_DOMAIN = process.env.API_DOMAIN;
process.env.TZ = 'America/Sao_Paulo';

const WEEKS = CONSTANTS.WEEKS;
const CURRENT_SEASON = CONSTANTS.CURRENT_SEASON;
const FLEAFLICKER_TRANSACTIONS = CONSTANTS.FLEAFLICKER_TRANSACTIONS;
const bot = new TeleBot(BOT_KEY);

function getDynastyTransactions() {
    let url = `https://www.fleaflicker.com/api/FetchLeagueActivity?league_id=294555`;
    return util.requestAPI(url);
}

function getRanking(week) {
    let url = `${API_DOMAIN}ranking/`;

    if (week) {
        url += `${CURRENT_SEASON}/${week}`
    } else {
        url += `season/${CURRENT_SEASON}`;
    }

    return util.requestAPI(url);
}

function getScore(week) {
    let url = `${API_DOMAIN}matches/${CURRENT_SEASON}/`;

    if (week) {
        url += week;
    } else {
        nowTimetamp = Date.now() / 1000;
        for (let i = 0; i < WEEKS.length; i++) {
            if (nowTimetamp < WEEKS[i].timestamp) {
                const currentWeek = WEEKS[i].number;
                url += currentWeek;
                break;
            }
        }
    }
    return util.requestAPI(url);
}

//bot.on('text', (msg) => msg.reply.text(msg.text)); //Copycat message

bot.on(['/start'], (msg) => msg.reply.text('Olá, eu sou o Aaron Botdgers e estou aqui pra entregar cada request que você fizer (assim como minha versão humana).'));
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

    bot.sendMessage(chat_id, str, { "parseMode": "HTML" }).catch(err => console.log(err));
});

bot.on(['/belt'], (msg) => msg.reply.file('https://media.giphy.com/media/3o6wrpD9aOjLc5Q61W/giphy.gif', { asReply: true }));
bot.on(['/hailmary'], (msg) => msg.reply.file('https://i.makeagif.com/media/12-04-2015/9p8g5g.gif', { asReply: true }));
bot.on(['voice'], (msg) => msg.reply.text('Audible tá proibido nesse huddle.', { asReply: true }));
bot.on('edit', (msg) => msg.reply.text('Eu vi você editando essa mensagem aí... 👀', { asReply: true }));

bot.on(['/dynasty_transacoes'], (msg) => {
    const chat_id = msg.chat.id;
    let transactionsCounter = 0;
    let str = "";
    let getPromisse = getDynastyTransactions();
    getPromisse.then(function (response) {
        str += "<code>";
        str += `ÚLTIMAS TRANSAÇÕES - LIGA DYNASTY\n\n`;
        const transactions = response.items;
        transactions.forEach((item) => {
            if (item.transaction && transactionsCounter < 10) {
                transactionsCounter++;
                const { team, player, type, bidAmount } = item.transaction;
                const { nameShort, position, proTeam } = player.proPlayer;
                const timeEpoch = parseInt(item.timeEpochMilli, 10);
                const date = new Date(timeEpoch).toLocaleString('pt-br');

                str += `${date}\n`;
                str += `[${position}] `;
                str += `${nameShort} `;
                str += `(${proTeam.abbreviation})\n`;

                if (!type) {
                    str += "Free Agency (Add) -> ";
                    str += team.name;
                } else if (type === FLEAFLICKER_TRANSACTIONS.DROP.TYPE) {
                    str += team.name;
                    str += ` -> Free Agency (${FLEAFLICKER_TRANSACTIONS.DROP.DESCRIPTION})`;
                } else if (type === FLEAFLICKER_TRANSACTIONS.CLAIM.TYPE) {
                    str += `Free Agency (${FLEAFLICKER_TRANSACTIONS.CLAIM.DESCRIPTION}: $${bidAmount}) -> `;
                    str += team.name;
                }
                str += "\n\n";
            }
        })
        str += "</code>";
        bot.sendMessage(chat_id, str, { "parseMode": "HTML" }).catch(err => console.log(err));

    }, function (err) {
        console.log(err);
    });

    // https://www.fleaflicker.com/api/FetchLeagueActivity?league_id=294555
});
bot.on(['/ranking'], (msg) => {
    const chat_id = msg.chat.id;
    let str = "";
    let param = "";

    if (msg.text.length > 8) {
        param = msg.text.substring(8);
        param = param.trim();
        if (param == "@BotdgersBot" ||
            param < 1 ||
            param > 21)
            param = "";
    }
    var getRankingPromise = getRanking(param);
    getRankingPromise.then(function (response) {

        str += "<code>";

        if (param.length > 0)
            str += "Semana " + param + "\n\n";

        str += util.leftJustify("", 4);
        str += util.leftJustify("Nome", 18);
        str += util.leftJustify("Pts", 4);
        str += "\n";
        for (var i = 0; i < response.users.length; i++) {
            let normalizedPosition = response.users[i].position < 10
                ? `0${response.users[i].position}`
                : `${response.users[i].position}`;
            let position = util.leftJustify(normalizedPosition + ".", 4);
            let name = util.leftJustify(response.users[i].name, 18);
            let points = util.leftJustify(response.users[i].totalPoints, 4);
            str += position + name + points + "\n";
        }
        str += "</code>";
        bot.sendMessage(chat_id, str, { "parseMode": "HTML" }).catch(err => console.log(err));

    }, function (err) {
        console.log(`error: ${err}`);
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
    getScorePromise.then(function (response) {

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

        for (var i = 0; i < response.matches.length; i++) {
            match = response.matches[i];

            if (match.status == "P") {
                var jsDate = new Date(match.timestamp * 1000);
                time = (jsDate.getDate() < 10 ? '0' : '') + jsDate.getDate() + "/" +
                    (jsDate.getMonth() < 10 ? '0' : '') + jsDate.getMonth() + " " +
                    (jsDate.getHours() < 10 ? '0' : '') + jsDate.getHours() + ":" +
                    (jsDate.getMinutes() < 10 ? '0' : '') + jsDate.getMinutes();

            } else {
                time = match.status;
            }
            away_team = match.away.code;
            away_points = match.away.score.toString();
            home_points = match.home.score.toString();
            home_team = match.home.code;
            possession = match.possession;

            if (placar_mini)
                str += time + "\n";
            else
                str += util.leftJustify(time, 16);

            if (match.away.possession)
                str += "»";
            else str += " ";

            str += util.leftJustify(away_team, 4) + util.rightJustify(away_points, 2) + " @ " + util.leftJustify(home_points, 2) + util.rightJustify(home_team, 4);

            if (match.home.possession)
                str += "«\n";
            else str += " \n";

        }
        str += "\n\nHorário de Brasília (GMT-3)"
        str += "</code>";
        bot.sendMessage(chat_id, str, { "parseMode": "HTML" }).catch(err => console.log(err));

    }, function (err) {
        console.log(err);
    });
});

bot.start();

var app = express();

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});
