import { make } from "./util/injectionUtil.js";
import * as cookieUtil from "./util/cookieUtil.js"

function createImage(attrs = {}, styles = {}) {
	const img = document.createElement("img");
	Object.entries(attrs).forEach(([key, val]) => {
		if ((key === "width" || key === "height") && typeof val === "number") {
			img[key] = val;
		} else {
			img.setAttribute(key, val);
		}
	});
	Object.assign(img.style, styles);
	return img;
}

const injectors = [
  	{
		selector: "#navbar",
		load: () => {
			return fetch("./donatorPages/navBar.html")
				.then(r => r.text())
				.then(async html => document.createRange().createContextualFragment(html));
		},
  	},
	{
		selector: ".center-pillar",
		load: () => {
			const blinkies = [
				{file:"blinkiesCafe-7m.gif" ,href:"https://blinkies.cafe/"},
				{file:"blinkiesCafe-ji.gif" ,href:"https://blinkies.cafe/"},
				{file:"autism_blinkie2.gif" ,cookie:"tbh"},
				{file:"advert_blinkie.gif"  ,href:"https://github.com/Hasseroeder/Basement/"},
				{file:"rbot_blinkie.gif"    ,href:"https://discord.com/oauth2/authorize?client_id=519287796549156864&scope=bot%20applications.commands&permissions=347200"},
				{file:"obs_blinkie.gif"     ,href:"https://discord.gg/owobot"},
				{file:"anydice_blinkie.gif" ,href:"https://anydice.com/"},
				{file:"neon_blinkie.gif"    ,href:"https://discord.gg/neonutil"},
				{file:"dontasktoask_blinkie.png",href:"https://dontasktoask.com/"}
			];

			const myBlinkies = fourRandoms(blinkies);

			const wrapper = make("footer",{
				style:"margin: 2rem 4rem; gap: 0.5rem; display: flex;"
			});

			myBlinkies.forEach(blinkie => {
				const img = make("img",{
					src:"../media/blinkies/" + blinkie.file,
					className:"blinkie"
				});
				const a = make("a",{
					style:"display:block; flex: 1 1 0;",
					target:"_blank",
				});
        		if (blinkie.href) a.href = blinkie.href;
        		if (blinkie.cookie) a.onclick = () =>
					cookieUtil.setCookie(
						blinkie.cookie, 
						cookieUtil.getCookie(blinkie.cookie) !== "true", 
						30
					);

				a.append(img); 
				wrapper.append(a);    
			});
			return Promise.resolve(wrapper);
		},
	}
];

function fourRandoms(myArray){
 	for (let i = myArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[myArray[i], myArray[j]] = [myArray[j], myArray[i]];
  	}
  	const count = Math.min(4, myArray.length);
  	return myArray.slice(0, count);
}

function initInjectors() {
  	injectors.forEach(({ selector, load }) => {
		const el = document.querySelector(selector);
		if (!el) return;
		load().then(child => el.append(child));
  	});
}

window.addEventListener("DOMContentLoaded", initInjectors);

cookieStore.addEventListener('change', () => {
  	checkForTBH();
});

checkForTBH();

function checkForTBH(){
	if (cookieUtil.getCookie("tbh")=="true"){
		document.body.classList.add("tbh");
	}else{
		document.body.classList.remove('tbh');
	}
}