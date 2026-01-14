import { make } from "./util/injectionUtil.js";
import * as clock from "./clock.js";
import * as cookieUtil from "./util/cookieUtil.js";

const injectors = [
  	{
		selector: "#navbar",
		load: async () => {
			const html = await fetch("../donatorPages/navBar.html").then(r => r.text());
			const el = document.createRange().createContextualFragment(html);
			clock.init(el);
			return el;
		},
  	},
	{
		selector: ".center-pillar",
		load: async () => {
			const blinkies = [
				{file:"blinkiesCafe-7m.gif" ,href:"https://blinkies.cafe/"},
				{file:"blinkiesCafe-ji.gif" ,href:"https://blinkies.cafe/"},
				{file:"autism_blinkie2.gif" ,cookie:"tbh"},
				{file:"obs_blinkie.gif"     ,href:"https://discord.gg/owobot"},
				{file:"anydice_blinkie.gif" ,href:"https://anydice.com/"},
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
			return wrapper;
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

if ('cookieStore' in window && cookieStore.addEventListener) {
  cookieStore.addEventListener('change', checkForTBH);
}
checkForTBH();

function checkForTBH(){
	document.body.classList.toggle(
		"tbh",
		cookieUtil.getCookie("tbh")=="true"
	)
}

initInjectors();

/*if (document.readyState === 'loading'){
	document.addEventListener("DOMContentLoaded", initInjectors);
}else{
	initInjectors();
}*/

function initInjectors(){
	injectors.forEach(({ selector, load }) => {
		const el = document.querySelector(selector);
		if (!el) return;
		load().then(child => el.append(child));
	});
}