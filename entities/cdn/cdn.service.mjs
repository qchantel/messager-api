import fs from "fs";
import axios from "axios";
import { NewsService } from "../news/news.service.mjs";

export const CdnService = {
  uploadFile: async (filePath, fileName) => {
    try {
      const today = NewsService.getCurrentDate();
      const subpath = `voices/${today}`;
      const stream = fs.createReadStream(filePath);

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

      console.log(
        "File uploaded successfully",
        `${process.env.FILES_ENDPOINT}/${subpath}/${fileName}`
      );

      return `${process.env.FILES_ENDPOINT}/${subpath}/${fileName}`;
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  },
};
