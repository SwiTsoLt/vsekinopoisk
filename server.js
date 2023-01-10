const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const { getRows } = require("./googleAuth")

const app = express()
const PORT = process.env.PORT || config.get("PORT")
const TOKEN = process.env.TOKEN || config.get("TOKEN")
const bot = new TelegramBot(TOKEN, { polling: true });

const regularOptions = {
    start: /\/start/,
    code: /([0-9]+|secret)/,
    help: /\/help/
}

async function start() {
    bot.onText(regularOptions.start, message => {
        greeting(message)
    })

    bot.onText(regularOptions.code, async message => {
        const isSubscribe = checkSubscribe()

        if (isSubscribe) {
            const response = await getRows({ range: "data" })
            const data = formatResponse(response)
            if (data[message.text]) {
                bot.sendMessage(message.chat.id, data[message.text])
            } else {
                bot.sendMessage(message.chat.id, `Фильм/Сериал по коду '${message.text}' не найден.`)
            }
            
        } else {
            bot.sendMessage(message.chat.id, "Чтобы бот работал ван нужно подписаться на каналы:")
        }
    })

    bot.onText(regularOptions.help, message => {
        help(message)
    })

    bot.on("message", message => {
        let notFound = 0

        for (key in regularOptions) {
            notFound += !regularOptions[key].test(message.text) ? 1 : 0
        }

        if (notFound >= Object.keys(regularOptions).length) {
            console.log(message.text);
            bot.sendMessage(message.chat.id, "Простите, я вас не понимаю.\nВведите /help чтобы узнать, что я умею.", { parse_mode: "HTML" })
        }
    })
}

function greeting(message) {
    bot.sendMessage(message.chat.id, `Привет, ${message.from.first_name}!`)
    bot.sendMessage(message.chat.id, "Введите код фильма/сериала, например \"1\"")
}

function help(message) {
    bot.sendMessage(message.chat.id, "Я умею отправлять названия фильмов/сериалов. Просто введите код фильма/сериала, например \"123\"")
}

start()

function checkSubscribe() {
    return true
}

function formatResponse(response) {
    return response.data.values.reduce((acc, cur, index) => {
        if (index === 0) {
            return acc
        }

        return { ...acc, [cur[0]]:cur[1] }
    }, {})
}

// EXPRESS

app.get("/", (req, res) => {
    res.end()
})

app.listen(PORT, () => console.log(`Server start on port ${PORT}`))