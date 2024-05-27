import fs from "fs";

export const FileService = {
  deleteFile: async function (filePath) {
    return fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      }
    });
  },
};
