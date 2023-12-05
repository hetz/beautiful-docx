"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ImagesAdapter = void 0;
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const axios_rate_limit_1 = __importDefault(require("axios-rate-limit"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const path = __importStar(require("path"));
class ImagesAdapter {
    constructor(currentImages) {
        this.imagesMap = {};
        this.imagesUrls = [];
        this.axiosIns = axios_1.default.create();
        if (currentImages) {
            this.imagesMap = currentImages;
        }
    }
    downloadImages(root) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.parseImagesUrls(root);
            this.axiosIns = (0, axios_rate_limit_1.default)(this.axiosIns, {
                maxRequests: 3,
                perMilliseconds: 1000,
            });
            (0, axios_retry_1.default)(this.axiosIns, { retries: 2 });
            // TODO: configure downloading in pack with 5-10 images
            this.imagesUrls = Array.from(new Set(this.imagesUrls));
            const totalImagesLength = this.imagesUrls.length;
            try {
                for (var _b = __asyncValues(this.imagesUrls.entries()), _c; _c = yield _b.next(), !_c.done;) {
                    const [index, url] = _c.value;
                    console.log(`downloadImage ${index + 1}/${totalImagesLength}, ${Math.floor(((index + 1) / totalImagesLength) * 100)}% `);
                    yield this.addImageToMap(url);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            yield Promise.all(this.imagesUrls.map(i => this.addImageToMap(i)));
            return this.imagesMap;
        });
    }
    parseImagesUrls(root) {
        for (const child of root) {
            if (child.type !== 'element') {
                continue;
            }
            if (child.tagName === 'img') {
                const imageAttr = (0, utils_1.getAttributeMap)(child.attributes);
                this.imagesUrls.push(imageAttr['src']);
            }
            if (child.children.length) {
                this.parseImagesUrls(child.children);
            }
        }
    }
    addImageToMap(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.imagesMap[url]) {
                this.imagesMap[url] = yield this.downloadImage(url);
            }
        });
    }
    downloadImage(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (url) {
                    const tmpdir = os_1.default.tmpdir();
                    const hash = crypto_1.default.createHash('md5').update(url).digest('hex');
                    const filepath = path.join(tmpdir, hash);
                    if ((0, fs_1.existsSync)(filepath)) {
                        console.log(`Cache hit: ${url}`);
                        return (0, fs_1.readFileSync)(filepath);
                    }
                    else {
                        const res = yield this.axiosIns.get(url, { responseType: 'arraybuffer', timeout: 5000 });
                        (0, fs_1.writeFileSync)(filepath, res.data);
                        return Buffer.from(res.data, 'binary');
                    }
                }
                else {
                    return (0, utils_1.textToPngBuffer)(`Image not src`, 300, 40);
                }
            }
            catch (error) {
                console.error(`Download image error: ${url} ${error}`);
                return (0, utils_1.textToPngBuffer)(`DownErr ${url}`);
            }
        });
    }
}
exports.ImagesAdapter = ImagesAdapter;
