import {loadJson} from "../js/util/jsonUtil.js"
import {make} from "../js/util/injectionUtil.js"

const inputWrapper = document.querySelector(".button-wrapper");
const [prevButton,select,nextButton] = inputWrapper.children;
const wrapper = document.getElementById("artWrapper");

const URL = [
	"https://opensheet.elk.sh",
	"1r_v31yc0E_cZmXlfYO8iFPYet_qYKwQU5t_sBBoTpRQ",
	"Sheet1"
].join("/");

const ImageArray  = await loadJson(URL);

const categories = {
    array: [...new Set(ImageArray.map(i => i.category))],
    _idx: 0,

    get idx() { return this._idx },
    set idx(value) {
        const len = this.array.length;
        this._idx = ((value % len) + len) % len; // wrap
		show();
	},

    get current() { return this.array[this.idx] },
    set current(categoryName) {
        const i = this.array.indexOf(categoryName);
        if (i !== -1) this.idx = i;				// ignore invalid inputs
		show();
    }
};

categories.array.forEach(category => 
	select.add(
		make("option",{text:category, value:category})
	)
);

select.addEventListener("change",	()=> categories.current=select.value );
prevButton.addEventListener("click",()=> categories.idx--);
nextButton.addEventListener("click",()=> categories.idx++);

async function show(){
	wrapper.innerHTML = "";
	select.text  = categories.current;
	select.value = categories.current;

	const categoryArray = ImageArray.filter(image => image.category == categories.current);

  	// Parse creationDate and sort ascending (oldest → newest).
	categoryArray.sort((a, b) => {
		const da = new Date(a.creationDate).getTime();
		const db = new Date(b.creationDate).getTime();
		return da - db; // use db - da for newest → oldest
	});

  	// Render in sorted order
	categoryArray.forEach(image => {
		const { title, creationDate, description } = image;
		const filenames = image.filenames.split(",").map(name=>name.trim());
		const pieceWrapper = make("div", {className:"piece-wrapper"});
		var imageIndex = 0;

		const imageElement = make("img", {
			src: "../gallery/images/" + filenames[imageIndex],
			className: "piece-image",
			alt: filenames[imageIndex]
		});

		if (filenames.length==1){
			pieceWrapper.append(
				make("div",{className:"many-image-wrapper"},[
					imageElement
				]),
				make("h3", { className:"image-title", textContent: title }),
				make("p",{ innerHTML:description })
			);
		}
		else {
			var imageIndex = 0;

			const prevImgButton = make("button", {onclick: ()=>{
				imageIndex--;
				imageElement.src = "../gallery/images/" + filenames[imageIndex]
				imageElement.alt = filenames[imageIndex]; 
			}});
			const nextImgButton = make("button", {onclick: ()=>{
				imageIndex++;
				imageElement.src = "../gallery/images/" + filenames[imageIndex]
				imageElement.alt = filenames[imageIndex]; 
			}});

			pieceWrapper.append(
				make("div",{className:"many-image-wrapper"},[
					prevImgButton,
					imageElement,
					nextImgButton
				]),
				make("h3", { className:"image-title", textContent: title }),
				make("p",{ innerHTML:description })
			);
		}

		wrapper.append(pieceWrapper);
	});
}

show();