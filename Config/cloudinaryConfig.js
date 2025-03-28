const cloudinary = require('cloudinary').v2;
const {
    CloudinaryStorage,
} = require('multer-storage-cloudinary');
const multer = require('multer');


cloudinary.config({
    cloud_name: 'drgmpx9uh',
    api_key: '711726174778494',
    api_secret: 'oNexJmzx7Ue4DR8Sf7-EDF2oXCw',
});


const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'user_photos',
        allowed_formats: ['jpeg', 'png', 'jpg'],

    },
});

const upload = multer({ storage });


module.exports = { cloudinary, upload }; 