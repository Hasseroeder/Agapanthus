import {loadJson} from "../js/util/jsonUtil.js"
import {make} from "../js/util/injectionUtil.js"

const inputWrapper = document.querySelector(".button-wrapper");
const [prevButton,select,nextButton] = inputWrapper.children;
const wrapper = document.getElementById("artWrapper");

const categories  = await loadJson("../gallery/categories/manifest.json").then(res => Object.keys(res));
// categories = ["pixelart", "traditional art"]
categories.forEach((category,i) => 
	select.add(
		make("option",{text:category, value:i})
	)
);

var currentIndex = 0;

select.addEventListener("change",()=>{
		currentIndex = select.value;
		show();
});
prevButton.addEventListener("click",()=>{
		currentIndex--;
		if (currentIndex<0) currentIndex = categories.length-1;
		show();
});
nextButton.addEventListener("click",()=>{
		currentIndex++;
		if (currentIndex==categories.length) currentIndex = 0;
		show();
});

async function show(){
	wrapper.innerHTML = "";
	select.text  = categories[currentIndex];
	select.value = currentIndex;
	const currentManifest = await loadJson(`categories/${categories[currentIndex]}/manifest.json`);

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
		const { creation_date, description } = data.meta;
		const title = data.meta.title ?? key;
		const pieceWrapper = make("div", {className:"piece-wrapper"});

		pieceWrapper.append(
			make("img", {
				src: `../gallery/categories/${categories[currentIndex]}/${key}`,
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