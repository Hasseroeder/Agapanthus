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
		const { creation_date, title, description } = data.meta;
		const pieceWrapper = make("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				alignItems: "center"
			}
		});
		const desc = document.createElement("p");
		desc.innerHTML = "\"Life is too short to pretend to be someone you're not.\"\\n Art drawn by @hsse\\n Holiday pet created on June 2024 Holidays!"

		pieceWrapper.append(
			make("h3", { textContent: title }),
			make("img", {
				src: `../gallery/categories/${currentCategory}/${key}`,
				style: { width: "50%" },
				alt: title
			}),
			desc
		);
		wrapper.append(pieceWrapper);
	}
}


show();