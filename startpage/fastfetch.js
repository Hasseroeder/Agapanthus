import { make } from "../js/util/injectionUtil.js";

export class fastfetchLine {
    constructor(config) {
        const { keyConfig, valueConfig } = config;

        this.key = new fastfetchKey(keyConfig);
        this.value = new fastfetchValue(valueConfig);
        this.wrapper = make("span", { className: "command-line" }, [
            this.key.el,
            this.value.el,
        ]);
    }
    remove() {
        this.wrapper.remove();
        const toRemoveIdx = fastfetchKey.array.findIndex(
            (key) => key === this.key,
        );
        if (toRemoveIdx !== -1) {
            fastfetchKey.array.splice(toRemoveIdx, 1);
            fastfetchKey.update();
        }
    }
}

class fastfetchValue {
    constructor({ textContent, href }) {
        if (href) {
            this.el = make("a", { textContent, href });
            return this;
        }
        this.el = make("span", { textContent });
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
