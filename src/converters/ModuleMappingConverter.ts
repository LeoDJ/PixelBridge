import { Frame } from "../common/frame.interface";
import { FrameArr } from "../common/frameArr.interface";
import { MappingGenerator, MappingParams } from "../common/MappingGenerator";

export class ModuleMappingConverter {

    constructor(protected moduleMappingParams: MappingParams) { }

    // TODO: do parameter getting and precalculation only once during init
    // TODO: implement rotation of frames
    async convert(frameArr: FrameArr): Promise<FrameArr> {
        if (this.moduleMappingParams.mapType == 'line' 
            && this.moduleMappingParams.mapOrientation == 'horz' 
            && this.moduleMappingParams.mapStart == 'tl'
            && this.moduleMappingParams.mapFlip == 'none') {
            return; // nothing to do, frames are already in correct order
        }

        const mapping = await new MappingGenerator(this.moduleMappingParams).generateMapping(frameArr.width, frameArr.height);

        // reorder the frames
        let tempFrames = [...frameArr.frames];  // clone array, but leave object references intact
        mapping.forEach((mapPos, i) => {
            frameArr.frames[i] = tempFrames[mapPos];
        });

        // debug mapping
        // for (let y = 0; y < frameArr.height; y++) {
        //     for (let x = 0; x < frameArr.width; x++) {
        //         let i = y * frameArr.width + x;
        //         let m = mapping[i];
        //         process.stdout.write(`${m < 10 ? ' ' : ''}${m} `);
        //     }
        //     process.stdout.write('\n');
        // }

        return frameArr;
    }

}