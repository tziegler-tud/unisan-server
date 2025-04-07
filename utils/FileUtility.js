import fs from 'fs/promises'

export default class FileUtility {
    constructor() {

    }
    /**
     * savely checks if a file exists
     * returns a promise that resolves to true if the file exists, or false if it does not exist
     * @returns Promise<void>
     * @throws Error if the file cannot be accessed.
     */

    async checkFileExists(path) {
        await fs.access(path, fs.constants.F_OK)
    }

    async ensureDirExists(path){
        try {
            await fs.mkdir(path, { recursive: true });
        }
        catch(e){
            console.error("Failed to create directory: " + '/src/data/uploads/user_images/' + user._id.toString());
            throw e;
        }
    }

    async copyFile(src, dest){
        await fs.copyFile(src, dest);
    }

    async delete(filePath){
        await fs.unlink(filePath);
    }
}