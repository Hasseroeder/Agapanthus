import {loadJson} from "../js/util/jsonUtil.js"
import {make} from "../js/util/injectionUtil.js"

const select = document.getElementById("categories")
const wrapper = document.getElementById("artWrapper");

const categories  = await loadJson("../gallery/categories/manifest.json").then(res => res.folders);
// categories = ["pixelart", "traditional art"]
categories.forEach(category => 
	select.add(
		make("option",{text:category, value:category})
	)
);

async function show(){
	const currentCategory = select.value;
	const currentManifest = await loadJson("../gallery/categories/"+currentCategory+"/manifest.json");
	console.log(currentManifest);
}

show();