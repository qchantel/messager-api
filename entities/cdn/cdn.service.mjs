import fs from "fs";
import axios from "axios";

export const CdnService = {
  uploadFile: async (filePath, fileName) => {
    try {
      const subpath = "voices";
      const stream = fs.createReadStream(filePath);
      // const uploadUrl = `https://storage.bunnycdn.com/${storageZoneName}/${fileName}`;

      // const response = await axios.put(uploadUrl, fileStream, {
      //   headers: {
      //     AccessKey: apiKey,
      //     "Content-Type": "audio/mpeg",
      //   },
      // });

      const response = await axios.put(
        `${process.env.BUNNY_FILES_STORAGE_URL}/${subpath}/${fileName}`,
        stream,
        {
          headers: {
            "Content-Type": "application/octet-stream",
            AccessKey: process.env.BUNNY_FILES_STORAGE_KEY,
          },
        }
      );

      console.log("File uploaded successfully");
      console.log("Upload response:", response.data);

      return `${process.env.FILES_ENDPOINT}/${subpath}/${fileName}`;
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  },
};
