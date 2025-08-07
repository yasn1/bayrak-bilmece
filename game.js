const fs = require('fs');

class Game{
    constructor(){}
    new(filtered=[]){
        const data = JSON.parse(fs.readFileSync("./world-data.json", "utf-8")).filter(x => !filtered.includes(x.code));
        const obj = {}
        obj.country = data[Math.floor(Math.random()*(data.length-1))]
        obj.country.flag = `https://raw.githubusercontent.com/hampusborgos/country-flags/refs/heads/main/svg/${obj.country["code"].toLowerCase()}.svg`
        const choices = [];
        while (choices.length < 4) {
            let a = data[Math.floor(Math.random() * data.length)];
            if (a.name === obj.country.name || choices.some(choice => choice.name === a.name)) {
                continue;
            }
            a.flag = `https://raw.githubusercontent.com/hampusborgos/country-flags/refs/heads/main/svg/${a.code.toLowerCase()}.svg`;
            choices.push(a);
        }
        obj.choices = choices;
        return obj;
    }
}

module.exports = Game;
