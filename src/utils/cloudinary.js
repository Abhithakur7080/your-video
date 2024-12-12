import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploading = async (localFilePath, folderName) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `youtube/${folderName}`
    });
    //file has been uploaded successfully
    // console.log("File is uploaded on cloudinary", response.url);
    // fs.unlinkSync(localFilePath); //remove after uploading from local
    return response;
  } catch (error) {
    // fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the operation got failed
    return null;
  }
};

const deleteFromCloudinary = async(public_id, resource_type="image") => {
  try {
    if(!public_id){
      return null
    }
    await cloudinary.uploader.destroy(public_id, {
      resource_type: `${resource_type}`
    })
  } catch (error) {
    console.log("failed to delete on cloudinary field", error);
    return error
  }
}

export { cloudinaryUploading, deleteFromCloudinary };
