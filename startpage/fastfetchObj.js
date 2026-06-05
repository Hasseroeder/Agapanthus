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
        fastfetchKey.array.splice(toRemoveIdx, 1);
        fastfetchKey.update();
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
        const categories = [];
        var maxPadding = 0;
        fastfetchKey.array.forEach((key) => {
            !categories.includes(key.category) && categories.push(key.category);
            maxPadding = Math.max(key.textpadding, maxPadding);
        });
        categories.forEach((category) => {
            const keys = fastfetchKey.array.filter(
                (key) => key.category == category,
            );
            keys.forEach((key, i) => {
                key.structure = i == keys.length - 1 ? "└" : "├";
            });
        });
        fastfetchKey.array.forEach((key) => {
            key.textpadding = maxPadding;
            key.update();
        });
    }
}
