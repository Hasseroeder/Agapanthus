import {make} from "../js/util/injectionUtil.js"
import * as csv from "/js/util/csvUtil.js"

const inputWrapper = document.querySelector(".button-wrapper");
const [prevButton,select,nextButton] = inputWrapper.children;
const wrapper = document.getElementById("artWrapper");

const ImageArray  = (await csv.load("/media/csv/galleryImages.csv")).map(image=>{
	image._idx;
	image.filenames = image.filenames.split(",").map(name=>name.trim());
	Object.defineProperty(image, 'idx', {
		configurable: true,
		get() { return this._idx },
		set(value) {
			const len = image.filenames.length;
			this._idx = ((value % len) + len) % len;
			
			image.el.src = "../gallery/images/" + image.filenames[this._idx]
			image.el.alt = image.filenames[this._idx]; 
		}
	});
	return image;
});

const categories = {
    array: [...new Set(ImageArray.map(i => i.category))],
    _idx: 0,

    get idx() { return this._idx },
    set idx(value) {
        const len = this.array.length;
        this._idx = ((value % len) + len) % len; // wrap
		this._syncUI();
	},

    get current() { return this.array[this.idx] },
    set current(categoryName) {
        const i = this.array.indexOf(categoryName);
        if (i !== -1) this.idx = i;				// ignore invalid inputs
		this._syncUI();
    },

	_syncUI() {
		select.text  = this.current;
		select.value = this.current;
		render();
	}
};

categories.array.forEach(category => 
	select.add(
		make("option",{text:category, value:category})
	)
);

categories.current = window.location.hash.slice(1);

select.addEventListener("change",	()=> categories.current=select.value );
prevButton.addEventListener("click",()=> categories.idx--);
nextButton.addEventListener("click",()=> categories.idx++);

function render(){
	wrapper.innerHTML = "";
	const categoryArray = ImageArray
		.filter(image => image.category == categories.current)
		.sort((a, b) => {
			const da = new Date(a.creationDate).getTime();
			const db = new Date(b.creationDate).getTime();
			return da - db;
		});
	
	categoryArray.forEach(image => {
		image.el = make("img", {className: "piece-image"});
		image.idx = 0;

		const pieceChildren = image.filenames.length==1
			? [image.el]
			: [
				make("button", { textContent:"<<", onclick: ()=>image.idx--}), 
				image.el, 
				make("button", { textContent:">>", onclick: ()=>image.idx++})
			];

		const pieceWrapper = make("div", {className:"piece-wrapper"},[
			make("div",{className:"many-image-wrapper"},pieceChildren),
			make("h3", {className:"image-title", textContent: image.title}),
			make("p",{innerHTML: image.description})
		]);
		wrapper.append(pieceWrapper);
	});
}

render();

// prefetch
function prefetch(){
	setTimeout(() => {
        const arrayClone = JSON.parse(JSON.stringify(ImageArray));

        requestIdleCallback(function idlePrefetch(deadline){
            const BATCH = 3;
            while (deadline.timeRemaining() > 0 && arrayClone.length) {
                const image = arrayClone.shift();
                image.filenames.slice(0, BATCH).forEach(fn => {
                    const img = new Image();
                    img.decoding = 'async';
                    img.src = "../gallery/images/" + fn;
                });
            }

            if (arrayClone.length) {
                requestIdleCallback(idlePrefetch);
            }
        });
    }, 500);
}

if (document.readyState == "loading") 
	document.addEventListener("DOMContentLoaded", prefetch);
else
	prefetch();