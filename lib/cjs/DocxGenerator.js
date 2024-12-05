"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocxGenerator = void 0;
const docx_1 = require("docx");
const DocumentBuilder_1 = require("./DocumentBuilder");
const htmlParser_1 = require("./htmlParser");
const ts_deepmerge_1 = __importDefault(require("ts-deepmerge"));
const options_1 = require("./options");
class DocxGenerator {
    constructor(docxExportOptions) {
        if (docxExportOptions === undefined) {
            this.options = options_1.defaultExportOptions;
        }
        else {
            options_1.userOptionsSchema.parse(docxExportOptions);
            this.options = (0, ts_deepmerge_1.default)(options_1.defaultExportOptions, docxExportOptions);
        }
        this.parser = new htmlParser_1.HtmlParser(this.options);
        this.builder = new DocumentBuilder_1.DocumentBuilder(this.options);
    }
    generateDocx(html) {
        var _a, html_1, html_1_1;
        var _b, e_1, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let documentContent = [];
            if (Array.isArray(html)) {
                try {
                    for (_a = true, html_1 = __asyncValues(html); html_1_1 = yield html_1.next(), _b = html_1_1.done, !_b;) {
                        _d = html_1_1.value;
                        _a = false;
                        try {
                            const htmlPart = _d;
                            documentContent.push(yield this.parser.parse(this.parseHtml(htmlPart)));
                        }
                        finally {
                            _a = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_a && !_b && (_c = html_1.return)) yield _c.call(html_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                documentContent = yield this.parser.parse(this.parseHtml(html));
            }
            const doc = this.builder.build(documentContent);
            return yield docx_1.Packer.toBuffer(doc);
        });
    }
    parseHtml(html) {
        // eslint-disable-next-line no-control-regex, no-irregular-whitespace
        const reSpecialCharacters = /(||||﻿|||)/g;
        // eslint-disable-next-line no-control-regex
        const spaceCharacters = /(\x08|\x02)/g;
        // eslint-disable-next-line no-irregular-whitespace
        return html.replace(reSpecialCharacters, '').replace(spaceCharacters, ' ').replace(/ /g, ' ');
    }
}
exports.DocxGenerator = DocxGenerator;
