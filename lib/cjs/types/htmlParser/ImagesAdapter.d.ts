import { Node } from 'himalaya';
import { ImageMap } from '../options';
export declare class ImagesAdapter {
    private readonly imagesMap;
    private imagesUrls;
    private axiosIns;
    constructor(currentImages?: ImageMap);
    downloadImages(root: Node[]): Promise<ImageMap>;
    private parseImagesUrls;
    private addImageToMap;
    downloadImage(url: string | null): Promise<Buffer>;
}
//# sourceMappingURL=ImagesAdapter.d.ts.map