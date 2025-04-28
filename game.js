const fs = require('fs');

class Game{
    constructor(){}
    new(){
        const data = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
        const obj = {}
        obj.country = data[Math.floor(Math.random()*(data.length-1))]
        obj.country.flag = `https://raw.githubusercontent.com/hampusborgos/country-flags/refs/heads/main/svg/${obj.country["code"].toLowerCase()}.svg`
        const choices = []
        data.filter((item) => item.name !== obj.country.name).forEach((item) => {
            if (choices.length < 4) {
                let a = data[Math.floor(Math.random() * data.length)]
                a.flag = `https://raw.githubusercontent.com/hampusborgos/country-flags/refs/heads/main/svg/${obj.country["code"].toLowerCase()}.svg`
                choices.push(a);
            }
        });
        obj.choices = choices;
        return obj;
    }
}

module.exports = Game;
