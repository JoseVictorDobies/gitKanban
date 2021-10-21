const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const jsonParser = bodyParser.json();
app.use(cors());

let port = 3000;

let dataServer = {};
let arrTags = [];
let mapTagsAntennas = {};
let inventoryArr = [];

let inventory = {
    "productA": {
        name: "Bateria 12V 7Ah",
        image: "./src/images/bateria.jpg",
        qtdMin: 1,
        qtdIdeal: 3,
        qtd: 0,
        ids: []
    }, 
    "productB": {
        name: "Bobina cobre esmaltado",
        image: "./src/images/bobina.jpg",
        qtdMin: 1,
        qtdIdeal: 2,
        qtd: 0,
        ids: []
    }, 
    "productC": {
        name: "Multímetro Minipa",
        image: "./src/images/multimentro.jpg",
        qtdMin: 0,
        qtdIdeal: 1,
        qtd: 0,
        ids: []
    }, 
}

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
                    if (inventoryArr.indexOf(val) === -1) {
                        console.log("Entrou!");
                        inventoryArr.push(val);
                        let obj = inventory[tagsProd[val]];
                        let newArr = obj["ids"];
                        let objTime = {
                            time: Math.round(Date.now() / 1000),
                            id: val
                        }
                        newArr.push(objTime);
                        obj["qtd"] += 1;
                        obj["ids"] = newArr;
                    }
                } else {
                    if (inventoryArr.indexOf(val) !== -1) {
                        console.log("Saiu!");
                        inventoryArr.splice(inventoryArr.indexOf(val), 1)
                        let obj = inventory[tagsProd[val]];
                        let newArr = obj["ids"];
                        obj["qtd"] += -1;
                        let index = newArr.findIndex(x => x.id===val);
                        newArr.splice(index, 1);
                        obj["ids"] = newArr;
                    }
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

app.get('/dataInfo', (req, res) => {
    return res.send(JSON.stringify({ dataServer, arrTags, mapTagsAntennas, inventoryArr }));
});

app.get('/data', (req, res) => {
    return res.send(JSON.stringify({ inventory }));
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
})
