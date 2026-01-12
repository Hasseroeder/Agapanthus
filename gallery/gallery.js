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
	wrapper.innerHTML = "";
	const currentCategory = select.value;
	const currentManifest = await loadJson(`../gallery/categories/${currentCategory}/manifest.json`);

  	// Convert manifest object into array of [key, data]
	const entries = Object.entries(currentManifest)
		.filter(([key, data]) => data.type === "image")
		.map(([key, data]) => ({ key, data }));

  	// Parse creation_date and sort ascending (oldest → newest).
	entries.sort((a, b) => {
		const da = new Date(a.data.meta.creation_date).getTime();
		const db = new Date(b.data.meta.creation_date).getTime();
		return da - db; // use db - da for newest → oldest
	});

  	// Render in sorted order
	for (const { key, data } of entries) {
		const { creation_date, title = "untitled", description } = data.meta;
		const pieceWrapper = make("div", {className:"piece-wrapper"});

		pieceWrapper.append(
			make("img", {
				src: `../gallery/categories/${currentCategory}/${key}`,
				className: "piece-image",
				alt: title
			}),
			make("h3", { className:"image-title", textContent: title }),
			make("p",{ innerHTML:description })
		);
		wrapper.append(pieceWrapper);
	}
}

show();