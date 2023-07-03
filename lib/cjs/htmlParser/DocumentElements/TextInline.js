"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextInline = exports.supportedTextTypes = void 0;
const docx_1 = require("docx");
const utils_1 = require("../utils");
const colortranslator_1 = require("colortranslator");
const LINK_TEXT_COLOR = '2200CC';
exports.supportedTextTypes = [
    'br',
    'hr',
    'text',
    'strong',
    'i',
    'u',
    's',
    'del',
    'a',
    'b',
    'em',
    'span',
    'code',
    'sub',
    'sup',
];
const inlineTextOptionsDictionary = {
    br: { break: 1 },
    hr: {
        break: 1,
        text: '',
        underline: { type: docx_1.UnderlineType.SINGLE },
    },
    text: {},
    strong: { bold: true },
    b: { bold: true },
    em: { italics: true },
    i: { italics: true },
    u: { underline: { type: docx_1.UnderlineType.SINGLE } },
    s: { strike: true },
    del: { strike: true },
    a: {
        color: LINK_TEXT_COLOR,
        underline: { type: docx_1.UnderlineType.SINGLE },
    },
    code: { border: { style: docx_1.BorderStyle.SINGLE } },
    span: {},
    sup: { superScript: true },
    sub: { subScript: true },
};
class TextInline {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.isEmpty = false;
        if (this.element.type === 'text') {
            this.content = [this.element.content];
            this.type = 'text';
            this.isEmpty = this.element.content.trim() === '';
            return;
        }
        if (this.element.type !== 'element') {
            this.content = [];
            this.type = 'text';
            return;
        }
        if (!exports.supportedTextTypes.includes(this.element.tagName)) {
            throw new Error(`Unsupported ${this.element.tagName} tag`);
        }
        this.options = Object.assign(Object.assign({ color: this.textColor, shading: this.textShading }, this.options), inlineTextOptionsDictionary[this.element.tagName]);
        this.content = this.element.children.flatMap(i => {
            return new TextInline(i, this.options).getContent();
        });
        this.type = this.element.tagName;
    }
    getContent() {
        return [this];
    }
    transformToDocx() {
        if (this.type === 'br' || this.type === 'hr') {
            return [new docx_1.TextRun(this.options)];
        }
        return this.content.flatMap(content => {
            var _a;
            if (typeof content === 'string') {
                return [new docx_1.TextRun(Object.assign({ text: (0, utils_1.cleanTextContent)(content) }, this.options))];
            }
            else {
                /**
                 *  TODO: support
                 * <p><span class="slate-element-mention" data-uid="6bc4092e15064bb7a2700a03b685df2c" data-value="%7B%22name%22%3A%22%E7%BD%97%E6%B0%B8%E7%A4%BE%22%7D"></span> </p><p><span class="slate-element-relation-work-item" data-id="63c7ba8eb1f95b109c35533e" data-value="%7B%22sign%22%3A%22story%22%2C%22_id%22%3A%2263c7ba8eb1f95b109c35533e%22%2C%22name%22%3A%22%E9%80%89%E6%8B%A9%E5%95%86%E5%93%81%E7%B1%BB%E5%88%AB%E6%9F%A5%E7%9C%8B%22%2C%22application%22%3A70%2C%22color%22%3A%22%2330d1fc%22%2C%22icon%22%3A%22user-story-square-fill%22%2C%22type%22%3A%22story%22%2C%22group%22%3A1%2C%22identifier%22%3A%22DEMO-26%22%2C%22state_id%22%3A%2263c7ba8cb1f95b109c355236%22%2C%22pilot_id%22%3A%2263c7ba8db1f95b109c355304%22%7D"></span>
                 **/
                // if (this.type === 'span') {
                // }
                if (this.type === 'a') {
                    const element = this.element;
                    return [
                        new docx_1.ExternalHyperlink({
                            link: ((_a = element.attributes.find(item => item.key === 'href')) === null || _a === void 0 ? void 0 : _a.value) || '',
                            children: element.children.flatMap(child => new TextInline(child, Object.assign({}, this.options)).transformToDocx()),
                        }),
                    ];
                }
                return content.transformToDocx();
            }
        });
    }
    get textColor() {
        if (!this.element.attributes)
            return undefined;
        const textAttr = (0, utils_1.getAttributeMap)(this.element.attributes);
        const styles = (0, utils_1.parseStyles)(textAttr['style']);
        const color = styles['color'];
        if (color) {
            const textColorTranslator = new colortranslator_1.ColorTranslator(color);
            return textColorTranslator.HEX;
        }
        return undefined;
    }
    get textShading() {
        if (!this.element.attributes)
            return undefined;
        const textAttr = (0, utils_1.getAttributeMap)(this.element.attributes);
        const styles = (0, utils_1.parseStyles)(textAttr['style']);
        const backgroundColor = styles['background-color'];
        const color = styles['color'];
        if (backgroundColor || color) {
            const shading = {
                fill: 'auto',
                color: 'auto',
                type: docx_1.ShadingType.CLEAR,
            };
            if (backgroundColor) {
                const backgroundColorTranslator = new colortranslator_1.ColorTranslator(backgroundColor);
                shading.fill = backgroundColorTranslator.HEX;
            }
            if (color) {
                const textColorTranslator = new colortranslator_1.ColorTranslator(color);
                shading.color = textColorTranslator.HEX;
            }
            return shading;
        }
        return undefined;
    }
}
exports.TextInline = TextInline;
