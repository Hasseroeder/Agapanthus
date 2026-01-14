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

var categories = [];
const ImageArray  = await loadJson(URL);

ImageArray.forEach(image => {
	if (!categories.includes(image.category))
		categories.push(image.category);
});

categories.forEach((category,i) => 
	select.add(
		make("option",{text:category, value:i})
	)
);

var currentIndex = 0;

select.addEventListener("change",()=>changeIndex(+select.value));
prevButton.addEventListener("click",()=>changeIndex(currentIndex-1));
nextButton.addEventListener("click",()=>changeIndex(currentIndex+1));

function changeIndex(num){
	currentIndex = num;
	if (currentIndex<0) currentIndex = categories.length-1;
	else if (currentIndex==categories.length) currentIndex = 0;
	show();
}

async function show(){
	wrapper.innerHTML = "";
	select.text  = categories[currentIndex];
	select.value = currentIndex;

	const categoryArray = ImageArray.filter(image => image.category == categories[currentIndex]);

  	// Parse creation_date and sort ascending (oldest → newest).
	categoryArray.sort((a, b) => {
		const da = new Date(a.creationDate).getTime();
		const db = new Date(b.creationDate).getTime();
		return da - db; // use db - da for newest → oldest
	});

  	// Render in sorted order
	categoryArray.forEach(image => {
		const { title, creationDate, description, filename } = image;
		const pieceWrapper = make("div", {className:"piece-wrapper"});

		pieceWrapper.append(
			make("img", {
				src: `../gallery/images/${filename}`,
				className: "piece-image",
				alt: filename
			}),
			make("h3", { className:"image-title", textContent: title }),
			make("p",{ innerHTML:description })
		);
		wrapper.append(pieceWrapper);
	});
}

show();