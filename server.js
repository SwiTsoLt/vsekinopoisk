const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const axios = require('axios').default;
const { getRows } = require("./my_modules/googleAuth")
const { sendUserAnalytic } = require("./my_modules/analytics")

const app = express()
const PORT = process.env.PORT || config.get("PORT")
const TOKEN = process.env.TOKEN || config.get("TOKEN")
const bot = new TelegramBot(TOKEN, { polling: true });
const delay = 60000

const regularOptions = {
    start: /\/start/,
    code: /([0-9]+|secret)/,
    help: /\/help/
}

async function start() {

    try {
        bot.onText(regularOptions.start, message => {
            greeting(message)
        })

        bot.onText(regularOptions.code, async message => {
            try {
                const loadingMessage = await bot.sendMessage(message.chat.id, "Загружаю фильм...")

                const isSubscribe = checkSubscribe(message, loadingMessage)

                if (isSubscribe) {
                    const response = await getRows({ range: "data" })
                    bot.deleteMessage(message.chat.id, loadingMessage.message_id)
                    const data = formatResponse(response)
                    if (data[message.text]) {
                        sendUserAnalytic(message)
                        bot.sendMessage(message.chat.id, data[message.text])
                    } else {
                        bot.sendMessage(message.chat.id, `Фильм/Сериал по коду '${message.text}' не найден.`)
                    }
                } else {
                    bot.sendMessage(message.chat.id, "Чтобы бот работал ван нужно подписаться на каналы:")
                }
            } catch (e) {
                console.log(e);
                bot.sendMessage(message.chat.id, "Что-то пошло не так")
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
    } catch (e) {
        console.log(e);
    }
}

function greeting(message) {
    bot.sendMessage(message.chat.id, `Привет, ${message.from.first_name}!`)
    bot.sendMessage(message.chat.id, "Введите код фильма/сериала, например \"1\"")
}

function help(message) {
    bot.sendMessage(message.chat.id, "Я умею отправлять названия фильмов/сериалов. Просто введите код фильма/сериала, например \"1\"")
}

function checkSubscribe(message, loadingMessage) {
    if (true) {
        return true
    }

    bot.deleteMessage(message.chat.id, loadingMessage.message_id)
}

function formatResponse(response) {
    return response.data.values.reduce((acc, cur, index) => {
        if (index === 0) {
            return acc
        }

        return { ...acc, [cur[0]]: cur[1] }
    }, {})
}

function trigger() {
    setInterval(() => {
        setInterval(() => {
            axios.get("https://vsekinopoisk-trigger.onrender.com/")
        }, delay)  
    })
}

start()
trigger()

// EXPRESS

app.get("/", (req, res) => {
    res.end()
})

app.listen(PORT, async () => {
    console.log(console.log(`Server start on port ${PORT}`));
})