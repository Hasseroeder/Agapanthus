import {loadJson} from "../js/util/jsonUtil.js"
import {make} from "../js/util/injectionUtil.js"

const select = document.getElementById("categories")
const wrapper = document.getElementById("artWrapper");

const categories  = await loadJson("../gallery/categories/manifest.json").then(res => Object.keys(res));
// categories = ["pixelart", "traditional art"]
categories.forEach(category => 
	select.add(
		make("option",{text:category, value:category})
	)
);

async function show(){
	wrapper.innerHTML="";
	const currentCategory = select.value;
	const currentManifest = await loadJson("../gallery/categories/"+currentCategory+"/manifest.json");
	for (let key in currentManifest) {
		const data = currentManifest[key];
		if (data.type == "image"){
			const meta = data.meta;
			const pieceWrapper = make("div",{
				style:{
					display: "flex",
					flexDirection: "column",
					alignItems: "center"
				}
			});
			pieceWrapper.append(
				make("h3",{textContent: meta.title}),
				make("img",{
					src:"../gallery/categories/"+currentCategory+"/"+key,
					style:{width:"50%"}
				})
			);

			wrapper.append(pieceWrapper);
		}
	}
}

show();