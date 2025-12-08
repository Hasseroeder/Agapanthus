export const make = (tag, props = {}, children) => {
    const el = document.createElement(tag);
    if (props.style && typeof props.style == "object") {
        Object.assign(el.style, props.style);
        delete props.style;
    }
    if (props.dataset && typeof props.dataset === "object") {
        Object.assign(el.dataset, props.dataset);
        delete props.dataset;
    }

    Object.assign(el, props);
    if (children){
        el.append(...children);
    }
    return el;
};

export function doTimestamps(){
	document.querySelectorAll('.discord-timestamp').forEach(el=>el.textContent=new Date().toTimeString().slice(0,5));
}