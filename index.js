const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 3000
const { LINE_ACCESS_TOKEN } = process.env
const mysql = require('./mysql')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.all('/', (req, res) => {
    console.log("Just got a request!")
    res.send('Yo!')
})
app.all('/test', (req, res) => {
    push(req.body.lineID,req.body.messages)
    res.sendStatus(200)
})

app.post('/webhook', (req, res) => {
    console.log(req.body);
    console.log(req.body.events[0].source);
    let reply_token = req.body.events[0].replyToken

    massge = [
        {
            type: 'text',
            text: 'from webhook'
        }
    ]
    reply(reply_token, massge)
    res.sendStatus(200)
})
app.post('/register', async (req, res) => {
    let lineID = req.body.lineID
    let phone = req.body.phone
    let license_plate = req.body.license_plate
    let colour = req.body.colour

    await register(lineID, phone, license_plate, colour)
    res.sendStatus(200)
})
app.all('/beckon', (req, res) => {
    beckon('test')
    res.sendStatus(200)
})
app.listen(port)
console.log('running in port :',port);
function reply(reply_token, messages) {
    // console.log('reply_token = ',reply_token);
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {' + LINE_ACCESS_TOKEN + '}'
    }
    let body = JSON.stringify({
        replyToken: reply_token,
        messages: messages
    })
    request.post({
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}
function push(lineID, messages) {
    console.log(`push(${lineID},${messages})`);
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {' + LINE_ACCESS_TOKEN + '}'
    }
    let body = JSON.stringify({
        to: lineID,
        messages: messages
    })
    console.log('headers');
    console.log(headers);
    console.log('body');
    console.log(body);
    request.post({
        url: 'https://api.line.me/v2/bot/message/push',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
        console.log(res);
    });
    console.log('-------');
}
// register('1','123456','test','1234')
async function register(lineID, phone, license_plate, colour) {
    new Promise(async (resolve, reject) => {
        var user_id = 0
        var users = await mysql.queryDatabase(`select * from users WHERE lineID = '${lineID}'`)
        console.log('users', users);
        if (users.length === 0) {
            await mysql.queryDatabase(`INSERT INTO users(lineID,phone) VALUES ('${lineID}','${phone}');`)

            users = await mysql.queryDatabase(`select * from users WHERE lineID = '${lineID}'`)
            user_id = users[0].user_id
        } else {
            await mysql.queryDatabase(`UPDATE users SET phone = '${phone}' WHERE lineID = '${lineID}'`)
            user_id = users[0].user_id
        }
        console.log('user_id', user_id);


        var cars = await mysql.queryDatabase(`select * from cars WHERE user_id = ${user_id} AND license_plate = '${license_plate}'`)
        var car_id = 0
        if (cars.length === 0) {
            await mysql.queryDatabase(`INSERT INTO cars(user_id,license_plate,colour) VALUES (${user_id},'${license_plate}','${colour}');`)
            cars = await mysql.queryDatabase(`select * from cars WHERE user_id = ${user_id} AND license_plate = '${license_plate}'`)
            car_id = cars[0].car_id
        } else {
            car_id = users[0].car_id
        }
        console.log('car_id =', car_id);
    })
}

async function beckon(license_plate) {
    new Promise(async (resolve, reject) => {
        var user_id = 0
        var cars = await mysql.queryDatabase(`select * from view_cars WHERE license_plate = '${license_plate}'`)
        console.log('cars length :', cars.length);
        if (cars.length !== 0) {
            var car = cars[0]
            let msg = [
                {
                    "type": "text",
                    "text": `มีคนเรียกคุณไปที่รถ\nทะเบียน: ${car.license_plate}\nสีรถ: ${car.colour}`
                }
            ]
            push(car.line_destination, msg)
        } else {

        }
        console.log('user_id', user_id);
    })
}