function downloadImage(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => console.error("Error downloading image:", error));
}

const bigData = [

];

const passiveNames = [
    "str",  //1
    "mag",  //2
    "hp",   //3
    "wp",   //4
    "pr",   //5
    "mr",   //6
    "ls",   //7
    "th",   //8
    "mtap", //9
    "absv", //10
    "sg",   //11
    "crit", //12
    "dc",   //13
    "kkaze",//14
    "hgen", //15
    "wgen", //16
    "sprout",//17
    "enrage",//18
    "sac",  //19
    "snail",//20
    "kno"   //21
]

const qualityNames = [
    "c_",
    "u_",
    "r_",
    "e_",
    "m_",
    "l_",
    "f_"
]

//for (var i=0; i<bigData.length; i++){
//    for (var j=0; j<bigData[1].length;j++){
//        downloadImage(`https://cdn.discordapp.com/emojis/${bigData[i][j]}.png?size=96`, qualityNames[j]+passiveNames[i]+".jpg");
//    }
//}