const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload to Cloudinary - accepts either:
// - base64 data URL (starting with 'data:')
// - local file path (string) or buffer
const uploadToCloudinary = async (input, folder = 'rubbersense') => {
  try {
    console.log('☁️ Cloudinary upload started');
    console.log('Input type:', typeof input);
    console.log('Input preview:', typeof input === 'string' ? input.substring(0, 100) : 'Buffer');
    
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto', // Let Cloudinary detect the resource type
      use_filename: false,
      unique_filename: true,
      overwrite: false
    };

    let toUpload;
    if (typeof input === 'string' && input.startsWith('data:')) {
      // base64 data URL
      toUpload = input;
      console.log('📤 Uploading as base64 data URL');
    } else if (typeof input === 'string') {
      // file path
      toUpload = input;
      console.log('📤 Uploading as file path:', input);
      
      // Check if file exists
      if (!fs.existsSync(input)) {
        throw new Error(`File not found: ${input}`);
      }
      
      const stats = fs.statSync(input);
      console.log('File size:', stats.size, 'bytes');
      
      if (stats.size === 0) {
        throw new Error('File is empty');
      }
    } else {
      // assume buffer
      toUpload = input;
      console.log('📤 Uploading as buffer');
    }

    const result = await cloudinary.uploader.upload(toUpload, uploadOptions);
    console.log('✅ Cloudinary upload successful');
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.secure_url);

    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error details:', {
      message: error.message,
      name: error.name,
      http_code: error.http_code,
      stack: error.stack
    });
    throw new Error('Image upload failed: ' + (error.message || error));
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error('Image deletion failed: ' + error.message);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};