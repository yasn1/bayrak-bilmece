const fs = require('fs');
const wd = JSON.parse(fs.readFileSync("./world-data-2023.json","utf8"));
const data = JSON.parse(fs.readFileSync("./data.json","utf8"));
wd.forEach((item,index) => {
    const code = item?.Abbreviation;
    const i = data.findIndex(x => x.code === code);
    if(i!=-1){
        console.log(i)
        wd[index].Country = data[i].name;
    }
})
fs.writeFileSync("world-data.json",JSON.stringify(wd))