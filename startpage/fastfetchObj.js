import { make } from "../js/util/injectionUtil.js";

export class fastfetchLine {
    constructor(config) {
        const { keyConfig, valueConfig } = config;

        this.keyObj = new fastfetchKey(keyConfig);
        this.valueObj = {
            el: make("span", valueConfig),
        };
        this.wrapper = make("span", { className: "command-line" }, [
            this.keyObj.el,
            this.valueObj.el,
        ]);
    }
    remove() {
        this.wrapper.remove();
        const toRemoveIdx = fastfetchKey.array.findIndex(
            (key) => key === this.keyObj,
        );
        if (toRemoveIdx !== -1) {
            fastfetchKey.array.splice(toRemoveIdx, 1);
            fastfetchKey.update();
        }
    }
}

class fastfetchKey {
    constructor({ category, emoji, textContent }) {
        this.category = category;
        this._emoji = emoji;
        this._textContent = textContent;
        this.textpadding = textContent.length;
        this.structure = "├";

        this.el = make("span");
        fastfetchKey.array.push(this);
        fastfetchKey.update();
    }

    get emoji() {
        return this._emoji;
    }
    set emoji(emoji) {
        this._emoji = emoji;
        this.update();
    }

    get textContent() {
        return this._textContent;
    }
    set textContent(textContent) {
        this._textContent = textContent;
        this.update();
    }

    update() {
        this.el.textContent =
            `${this.structure} ` +
            `${this._emoji}  ` +
            this.textContent.padEnd(this.textpadding) +
            fastfetchKey.separator;
    }
    static array = [];
    static separator = "  ⇀ ";
    static update() {
        const groups = new Map();
        let maxPadding = 0;
        for (const key of fastfetchKey.array) {
            maxPadding = Math.max(maxPadding, key.textpadding);
            !groups.has(key.category) && groups.set(key.category, []);
            groups.get(key.category).push(key);
        }
        for (const [, keys] of groups) {
            keys.forEach((key, i) => {
                key.structure = i === keys.length - 1 ? "└" : "├";
            });
        }
        for (const key of fastfetchKey.array) {
            key.textpadding = maxPadding;
            key.update();
        }
    }
}
