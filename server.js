const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const jsonParser = bodyParser.json();
app.use(cors());

let dataServer = {};
let arrTags = [];
let mapTagsAntennas = {};
let inventory = [];

let tagsProd = {
    "13508321591558200320517128226": "productA",
    "1350808159278700320517128226": "productA",
    "13508381591558800320517128226": "productA",
    "1350808159918700320517128226": "productA",
    "1480822252769100320517128226": "productB",
    "1480820052758200320517128226": "productB",
    "1070286112258300320517128226": "productC"
}

setInterval(check, 1000);

function check(){
    arrTags.forEach((val) => {
        if (mapTagsAntennas[val].length > 1){
            let arrTimeA = dataServer[val][mapTagsAntennas[val][0]];
            let arrTimeB = dataServer[val][mapTagsAntennas[val][1]];
            if ((Date.now() - arrTimeA[(arrTimeA.length - 1)] > 1000) && (Date.now() - arrTimeB[(arrTimeB.length - 1)] > 1000)){
                if (isAscending(mapTagsAntennas[val])){
                    console.log("Entrou!");
                    inventory.indexOf(val) === -1 ? inventory.push(val) : console.log("Já estava dentro!");
                } else {
                    console.log("Saiu!");
                    inventory.indexOf(val) !== -1 ? inventory.splice(inventory.indexOf(val), 1) : console.log("Não entrou!");
                }
                delete dataServer[val];
                arrTags.splice(arrTags.indexOf(val), 1);
                delete mapTagsAntennas[val];
            }

        } else if (mapTagsAntennas[val].length === 1){
            // remover se aparecer em apenas uma antena e ficar fora do alcance por mais de 10s
            let arrTime = dataServer[val][mapTagsAntennas[val][0]];
            if ((Date.now() - arrTime[(arrTime.length - 1)]) > 30000) {
                delete dataServer[val];
                arrTags.splice(arrTags.indexOf(val), 1);
                delete mapTagsAntennas[val];
            }
            //deixa apenas os ultimos 20 dados
            if (arrTime.length > 20) {
                dataServer[val][mapTagsAntennas[val][0]] = arrTime.splice((arrTime.length - 20));
            }
        }
    })
}

function isAscending(arr) {
    return arr.every(function (x, i) {
        return i === 0 || x >= arr[i - 1];
    });
}

function processData(body){
    arrTags.findIndex( x => x===body.id) === -1 ? arrTags.push(body.id) : false;
    if (mapTagsAntennas[body.id]) {
        mapTagsAntennas[body.id].findIndex(x => x===body.antenna) === -1 ? mapTagsAntennas[body.id].push(body.antenna) : false;
    } else {
        mapTagsAntennas[body.id] = [body.antenna]
    }
    //arrTags.findIndex( x => x===body.id) === -1 ? arrTags.push(body.id) : false;
    //arrIds.findIndex( x => (x.antenna===body.antenna && x.id===body.id)) === -1 ? arrIds.push(body) : false;
    let arrMillis = [];
    if (dataServer[body.id]){
        arrMillis = dataServer[body.id][body.antenna];
        if (arrMillis) {
            arrMillis.push(Date.now());
        } else {
            arrMillis = [ Date.now() ];
        }
        dataServer[body.id][body.antenna] = arrMillis
    } else {
        dataServer[body.id] = { [body.antenna]:[ Date.now() ] }
    }
}

app.post('/data', jsonParser, (req, res) => {
    res.sendStatus(200);
    let body = req.body;

    console.log(body);
    
    body.forEach((val) => {
        processData(val);
    });

    
    return;
});

app.get('/data', (req, res) => {
    return res.send(JSON.stringify({ dataServer, arrTags, mapTagsAntennas, inventory }));
});

app.listen(3000, () => {
    console.log('App running on port 3000');
})