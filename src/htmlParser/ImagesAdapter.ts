import axios, { AxiosInstance } from 'axios';
import { Node } from 'himalaya';
import { ImageMap } from '../options';
import { getAttributeMap, textToPngBuffer } from './utils';
import axiosRateLimit, { RateLimitedAxiosInstance, rateLimitOptions } from 'axios-rate-limit';
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';
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
    // eslint-disable-next-line no-console
    this.imagesUrls = Array.from(new Set(this.imagesUrls));
    const totalImagesLength = this.imagesUrls.length;
    for await (const [index, url] of this.imagesUrls.entries()) {
      // eslint-disable-next-line no-console
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
        const res = await this.axiosIns.get(url, { responseType: 'arraybuffer', timeout: 5000 });
        return Buffer.from(res.data, 'binary');
      } else {
        return textToPngBuffer(`Image not src`, 300, 40);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Download image error: ${url} ${error}`);
      return textToPngBuffer(`DownErr ${url}`);
    }
  }
}
