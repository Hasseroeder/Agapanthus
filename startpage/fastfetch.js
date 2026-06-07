import { make } from "../js/util/injectionUtil.js";

export class FastfetchModule {
    constructor(config) {
        this.slug = config.slug;
        this.data = { ...(config.data ?? {}) };
        this.renderContent = config.renderContent;
        this.el = null;
        this.progressLine = null;
    }

    init(context) {
        this.el = make("div", { className: "fastfetch-module" });
        this.progressLine = new FastfetchLine({
            keyConfig: {
                ...this.data.keyConfig,
                textContent: "Module",
            },
            valueConfig: { textContent: "in progress" },
        });
        context.fetchTextWrapper.append(this.el);
    }

    async tryRenderContent(context) {
        try {
            await this.renderContent(context);
            this.progressLine.remove();
        } catch (err) {
            this.progressLine.value.el.textContent = "failed";
            console.error(`Error loading module '${this.slug}':`, err);
        }
    }
}

export class FastfetchLine {
    constructor(config) {
        const { keyConfig, valueConfig } = config;

        this.key = new FastfetchKey(keyConfig);
        this.value = new FastfetchValue(valueConfig);
        this.wrapper = make("span", { className: "command-line" }, [
            this.key.el,
            this.value.el,
        ]);
    }
    remove() {
        this.wrapper.remove();
        const toRemoveIdx = FastfetchKey.array.findIndex(
            (key) => key === this.key,
        );
        if (toRemoveIdx !== -1) {
            FastfetchKey.array.splice(toRemoveIdx, 1);
            FastfetchKey.update();
        }
    }
}

class FastfetchValue {
    constructor({ textContent, href }) {
        if (href) {
            this.el = make("a", { textContent, href });
            return this;
        }
        this.el = make("span", { textContent });
    }
}

class FastfetchKey {
    constructor({ category, emoji, textContent }) {
        this.category = category;
        this._emoji = emoji;
        this._textContent = textContent;
        this.textpadding = textContent.length;
        this.structure = "├";

        this.el = make("span");
        FastfetchKey.array.push(this);
        FastfetchKey.update();
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
            FastfetchKey.separator;
    }
    static array = [];
    static separator = "  ⇀ ";
    static update() {
        const groups = new Map();
        let maxPadding = 0;
        for (const key of FastfetchKey.array) {
            maxPadding = Math.max(maxPadding, key.textpadding);
            !groups.has(key.category) && groups.set(key.category, []);
            groups.get(key.category).push(key);
        }
        for (const [, keys] of groups) {
            keys.forEach((key, i) => {
                if (i === keys.length - 1 || key.category === undefined)
                    key.structure = "└";
                else key.structure = "├";
            });
        }
        for (const key of FastfetchKey.array) {
            key.textpadding = maxPadding;
            key.update();
        }
    }
}
