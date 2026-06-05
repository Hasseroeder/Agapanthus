import { make } from "../js/util/injectionUtil.js";

export class fastfetchLine {
    constructor({ category, emoji, key, value }) {
        this.keyObj = new fastfetchKey({ category, emoji, key });
        this.valueObj = {
            el: make("span", { textContent: value }),
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
            fastfetchKey.array.splice(idx, 1);
            fastfetchKey.update();
        }
    }
}

class fastfetchKey {
    constructor({ category, emoji, key }) {
        this.category = category;
        this._emoji = emoji;
        this._key = key;
        this.textpadding = key.length;
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

    get key() {
        return this._key;
    }
    set key(key) {
        this._key = key;
        this.update();
    }

    update() {
        this.el.textContent =
            `${this.structure} ` +
            `${this._emoji}  ` +
            this.key.padEnd(this.textpadding) +
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
            for (let i = 0; i < keys.length; i++) {
                keys[i].structure = i === keys.length - 1 ? "└" : "├";
            }
        }
        for (const key of fastfetchKey.array) {
            key.textpadding = maxPadding;
            key.update();
        }
    }
}
