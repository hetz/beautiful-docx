import { existsSync, readFileSync, writeFileSync } from 'fs';
import os from 'os';
import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { Node } from 'himalaya';
import { ImageMap } from '../options';
import { getAttributeMap, textToPngBuffer } from './utils';
import axiosRateLimit, { RateLimitedAxiosInstance, rateLimitOptions } from 'axios-rate-limit';
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';
import * as path from 'path';
import imageSize from 'image-size';
export class ImagesAdapter {
  private readonly imagesMap: ImageMap = {};
  private imagesUrls: string[] = [];
  private axiosIns: AxiosInstance = axios.create();

  constructor(currentImages?: ImageMap) {
    if (currentImages) {
      this.imagesMap = currentImages;
    }
  }

  async downloadImages(root: Node[]) {
    this.parseImagesUrls(root);
    this.axiosIns = axiosRateLimit(this.axiosIns, {
      maxRequests: 3,
      perMilliseconds: 1000,
    });
    axiosRetry(this.axiosIns, { retries: 2 });

    // TODO: configure downloading in pack with 5-10 images
    this.imagesUrls = Array.from(new Set(this.imagesUrls));
    const totalImagesLength = this.imagesUrls.length;
    for await (const [index, url] of this.imagesUrls.entries()) {
      console.log(
        `downloadImage ${index + 1}/${totalImagesLength}, ${Math.floor(((index + 1) / totalImagesLength) * 100)}% `
      );
      await this.addImageToMap(url);
    }
    await Promise.all(this.imagesUrls.map(i => this.addImageToMap(i)));

    return this.imagesMap;
  }

  private parseImagesUrls(root: Node[]) {
    for (const child of root) {
      if (child.type !== 'element') {
        continue;
      }

      if (child.tagName === 'img') {
        const imageAttr = getAttributeMap(child.attributes);

        this.imagesUrls.push(imageAttr['src']);
      }

      if (child.children.length) {
        this.parseImagesUrls(child.children);
      }
    }
  }

  private async addImageToMap(url: string) {
    if (!this.imagesMap[url]) {
      this.imagesMap[url] = await this.downloadImage(url);
    }
  }

  async downloadImage(url: string | null): Promise<Buffer> {
    try {
      if (url) {
        const tmpdir = os.tmpdir();
        const hash = crypto.createHash('md5').update(url).digest('hex');
        const filepath = path.join(tmpdir, hash);
        if (existsSync(filepath)) {
          console.log(`Cache hit: ${url}`);
          return readFileSync(filepath);
        } else {
          const res = await this.axiosIns.get(url, { responseType: 'arraybuffer', timeout: 5000 });
          await imageSize(res.data);
          writeFileSync(filepath, res.data);
          return Buffer.from(res.data, 'binary');
        }
      } else {
        return textToPngBuffer(`Image not src`, 300, 40);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('unsupported file type: undefined (file: undefined)')) {
        console.error(`Image filetype error: ${url} ${error}`);
        return textToPngBuffer(`DownErr ${url}`);
      } else {
        console.error(`Download image error: ${url} ${error}`);
        return textToPngBuffer(`DownErr ${url}`);
      }
    }
  }
}
