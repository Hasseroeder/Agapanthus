const select = document.getElementById("categories")
const wrapper = document.getElementById("artWrapper");

console.log("hello freya!!!!");

await fetch('../csv/mydata.csv')
  .then(r => r.text())
  .then(txt => txt.split(/\r?\n/))
  .then(txt => console.log(txt))
