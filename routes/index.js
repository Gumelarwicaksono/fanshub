// const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const axios = require('axios');
var express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
var router = express.Router();
const { auth, authorize, createUserWithEmailAndPassword, db, dbsRef, deleteObject, get, getDownloadURL, push, ref, remove, set, signInWithEmailAndPassword, storage, update, uploadBytes } = require('./../firebase');
const { status } = require('express/lib/response');
// const client = new Client({
//   puppeteer: {
//     args: ['--no-sandbox', '--disable-setuid-sandbox'],
//   },
//   authStrategy: new LocalAuth(),
// });
// client.on('qr', (qr) => {
//   qrcode.generate(qr, { small: true });
// });

// client.on('ready', () => {
//   console.log('Client is ready!');
// });
const upload = multer({ storage: multer.memoryStorage() });

// function sanitizeFilename(filename) {
//   // Hapus karakter yang tidak valid (ganti dengan '_')
//   return filename.replace(/[^a-z0-9\.\-_ ]/gi, '_');
// }
/* GET home page. */
// router.get('/', function (req, res, next) {
//   res.render('index', { title: 'Express' });
// });

//API GET PRODUCT HALAMAN HOME
router.get('/', async (req, res) => {
  const productsDbRef = ref(db, 'products');
  const categoriesDbRef = ref(db, 'categories');
  const banersDbRef = ref(db, 'baners');

  const productsSnapshot = await get(productsDbRef);
  const categoriesSnapshot = await get(categoriesDbRef);
  const banersSnapshot = await get(banersDbRef);

  if (productsSnapshot.exists() && categoriesSnapshot.exists()) {
    const products = [];
    productsSnapshot.forEach((childSnapshot) => {
      const product = childSnapshot.val();
      product.id = childSnapshot.key;
      products.push(product);
    });

    const categories = [];
    categoriesSnapshot.forEach((childSnapshot) => {
      const category = childSnapshot.val();
      category.id = childSnapshot.key;
      categories.push(category);
    });

    const baners = [];
    banersSnapshot.forEach((childSnapshot) => {
      const baner = childSnapshot.val();
      baner.id = childSnapshot.key;
      baners.push(baner);
    });
    // console.log(products);
    res.render('index', {
      products: products,
      categories: categories,
      baners: baners,
    });
  } else {
    res.status(404).json({ message: 'No products or categories found' });
  }
});

router.post('/signin', (req, res) => {
  const { email, password } = req.body;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const uid = user.uid;
      user.getIdToken().then((token) => {
        return res.json({ token: token });
      });
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
      return res.status(401).send('Autentikasi gagal');
    });
});
router.post('/signup', (req, res) => {
  const { email, password, displayName } = req.body;

  register0(email, password, displayName);
  res.status(200).json({
    message: 'success',
    data: {
      email,
      password,
      displayName,
    },
  });
});
router.get('/signinpage', (req, res) => {
  res.render('signinpage');
});

function getValidColors(colors) {
  // Menggunakan filter untuk menyaring warna yang valid
  return colors.filter((color) => color !== undefined && color !== null && color !== '');
}

router.post(
  '/products',
  authorize,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]),
  async function (req, res) {
    try {
      const { name, price, subPrice, category, color1, color2, color3, rating, terjual, gudang } = req.body;
      const file = req.files.image ? req.files.image[0] : null;
      const file2 = req.files.image2 ? req.files.image2[0] : null;
      const file3 = req.files.image3 ? req.files.image3[0] : null;

      if (!file) {
        return res.status(400).send('Tidak ada file yang diunggah.');
      }
      // Hitung diskon
      // const discount = Math.round(((price - subPrice) / price) * 100);

      const categoryRef = ref(db, 'categories');
      const categorySnapshot = await get(categoryRef);

      const categoryName = category.toLowerCase(); // Ganti dengan nama kategori yang sebenarnya

      // Periksa apakah snapshot kategori ada dan tidak kosong
      if (!categorySnapshot.exists() || categorySnapshot.val() === null) {
        // Jika tidak ada kategori, tambahkan kategori baru
        await push(categoryRef, { name: categoryName });
      } else {
        const categories = Object.values(categorySnapshot.val()); // Ubah objek menjadi array
        const existingCategory = categories.find((category) => category.name.toLowerCase() === categoryName);

        if (!existingCategory) {
          await push(categoryRef, { name: categoryName });
        }
      }

      let imageUrl = '';

      if (file) {
        const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
        const metadata = {
          contentType: file.mimetype,
          customMetadata: {
            description: 'This is a products image',
          },
          contentDisposition: 'inline; filename="' + file.originalname + '"',
          cacheControl: 'public, max-age=31536000',
        };
        await uploadBytes(imageRef, file.buffer, metadata);
        imageUrl = await getDownloadURL(imageRef);
      }
      let imageUrl2 = '';
      if (file2) {
        const imageRef = dbsRef(storage, `images/${uuidv4()}-${file2.originalname}`);
        const metadata = {
          contentType: file2.mimetype,
          customMetadata: {
            description: 'This is a products image',
          },
          contentDisposition: 'inline; filename="' + file2.originalname + '"',
          cacheControl: 'public, max-age=31536000',
        };
        await uploadBytes(imageRef, file2.buffer, metadata);
        imageUrl2 = await getDownloadURL(imageRef);
      }
      let imageUrl3 = '';
      if (file3) {
        const imageRef = dbsRef(storage, `images/${uuidv4()}-${file3.originalname}`);
        const metadata = {
          contentType: file3.mimetype,
          customMetadata: {
            description: 'This is a products image',
          },
          contentDisposition: 'inline; filename="' + file3.originalname + '"',
          cacheControl: 'public, max-age=31536000',
        };
        await uploadBytes(imageRef, file3.buffer, metadata);
        imageUrl3 = await getDownloadURL(imageRef);
      }

      // Simpan produk ke Realtime Database
      const newProductRef = push(ref(db, 'products'));
      await set(newProductRef, {
        name,
        price,
        subPrice,
        category,
        color: getValidColors([color1, color2, color3]),
        imageUrl: getValidColors([imageUrl, imageUrl2, imageUrl3]),
        discount: Math.round(((price - subPrice) / price) * 100),
        rating,
        terjual,
        gudang,
      });
      res.status(201).json('success add product sablonika ');
    } catch (error) {
      console.error(error);
      res.status(500).send('Terjadi kesalahan.');
    }
  }
);

// router.post(
//   '/products',
//   upload.fields([
//     { name: 'image', maxCount: 1 },
//     { name: 'image2', maxCount: 1 },
//     { name: 'image3', maxCount: 1 },
//   ]),
//   async function (req, res) {
//     try {
//       const { name, price, subPrice, category, color1, color2, color3, rating, terjual, gudang } = req.body;

//       // Mengambil file gambar
//       const file = req.files.image ? req.files.image[0] : null;
//       const file2 = req.files.image2 ? req.files.image2[0] : null;
//       const file3 = req.files.image3 ? req.files.image3[0] : null;

//       // Validasi file gambar (misalnya, pastikan file tidak null)
//       if (!file) {
//         return res.status(400).json({ message: 'All images are required.' });
//       }

//       let imageUrl = '';

//       if (file) {
//         const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
//         const metadata = {
//           contentType: file.mimetype,
//           customMetadata: {
//             description: 'This is a products image',
//           },
//           contentDisposition: 'inline; filename="' + file.originalname + '"',
//           cacheControl: 'public, max-age=31536000',
//         };
//         await uploadBytes(imageRef, file.buffer, metadata);
//         imageUrl = await getDownloadURL(imageRef);
//       }
//       let imageUrl2 = '';
//       if (file2) {
//         const imageRef = dbsRef(storage, `images/${uuidv4()}-${file2.originalname}`);
//         const metadata = {
//           contentType: file2.mimetype,
//           customMetadata: {
//             description: 'This is a products image',
//           },
//           contentDisposition: 'inline; filename="' + file2.originalname + '"',
//           cacheControl: 'public, max-age=31536000',
//         };
//         await uploadBytes(imageRef, file2.buffer, metadata);
//         imageUrl2 = await getDownloadURL(imageRef);
//       }
//       let imageUrl3 = '';
//       if (file3) {
//         const imageRef = dbsRef(storage, `images/${uuidv4()}-${file3.originalname}`);
//         const metadata = {
//           contentType: file3.mimetype,
//           customMetadata: {
//             description: 'This is a products image',
//           },
//           contentDisposition: 'inline; filename="' + file3.originalname + '"',
//           cacheControl: 'public, max-age=31536000',
//         };
//         await uploadBytes(imageRef, file3.buffer, metadata);
//         imageUrl3 = await getDownloadURL(imageRef);
//       }

//       // Simpan produk ke Realtime Database
//       const newProductRef = push(ref(db, 'products'));
//       await set(newProductRef, {
//         name,
//         price,
//         subPrice,
//         category: category.toLowerCase(),
//         color: getValidColors([color1, color2, color3]),
//         imageUrl: getValidColors([imageUrl, imageUrl2, imageUrl3]),
//         discount: Math.round(((price - subPrice) / price) * 100),
//         rating,
//         terjual,
//         gudang,
//       });
//       res.status(201).json('success add product sablonika ');
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Terjadi kesalahan.');
//     }
//   }
// );

// router.get('/dashboard', authorize, async (req, res) => {
//   const productsDbRef = ref(db, 'products');
//   const categoriesDbRef = ref(db, 'categories');
//   const banersDbRef = ref(db, 'baners');

//   const productsSnapshot = await get(productsDbRef);
//   const categoriesSnapshot = await get(categoriesDbRef);
//   const banersSnapshot = await get(banersDbRef);

//   if (productsSnapshot.exists() && categoriesSnapshot.exists()) {
//     const products = Object.keys(productsSnapshot.val()).map((key) => {
//       return { id: key, ...productsSnapshot.val()[key] };
//     });

//     const categories = Object.keys(categoriesSnapshot.val()).map((key) => {
//       return { id: key, ...categoriesSnapshot.val()[key] };
//     });
//     const baners = Object.keys(banersSnapshot.val()).map((key) => {
//       return { id: key, ...banersSnapshot.val()[key] };
//     });
//     res.render('dashboard', {
//       products: products,
//       categories: categories,
//       baners: baners,
//     });
//   } else {
//     res.status(404).json({ message: 'No products or categories found' });
//   }
// });

router.get('/dashboard', authorize, async (req, res) => {
  const productsDbRef = ref(db, 'products');
  const categoriesDbRef = ref(db, 'categories');
  const banersDbRef = ref(db, 'baners');

  const productsSnapshot = await get(productsDbRef);
  const categoriesSnapshot = await get(categoriesDbRef);
  const banersSnapshot = await get(banersDbRef);

  if (productsSnapshot.exists() && categoriesSnapshot.exists()) {
    const products = Object.keys(productsSnapshot.val()).map((key) => {
      return { id: key, ...productsSnapshot.val()[key] };
    });

    const categories = Object.keys(categoriesSnapshot.val()).map((key) => {
      return { id: key, ...categoriesSnapshot.val()[key] };
    });

    // Cek apakah banersSnapshot ada dan memiliki nilai
    const baners =
      banersSnapshot.exists() && banersSnapshot.val()
        ? Object.keys(banersSnapshot.val()).map((key) => {
            return { id: key, ...banersSnapshot.val()[key] };
          })
        : []; // Jika tidak ada, inisialisasi baners sebagai array kosong

    res.render('dashboard', {
      products: products,
      categories: categories,
      baners: baners,
    });
  } else {
    res.status(404).json({ message: 'No products or categories found' });
  }
});
//HALAMAN ADD PRODUCT
router.get('/addproducts', authorize, (req, res) => {
  res.render('addProduct');
});

//API EDIT PRODUCT
// router.post(
//   '/products/e/:id',
//   upload.fields([
//     { name: 'image', maxCount: 1 },
//     { name: 'image2', maxCount: 1 },
//     { name: 'image3', maxCount: 1 },
//   ]),
//   async function (req, res) {
//     try {
//       const { id } = req.params;
//       const { name, price, subPrice, category, color1, color2, color3, rating, terjual, gudang } = req.body;

//       const file = req.files.image ? req.files.image[0] : null;
//       const file2 = req.files.image2 ? req.files.image2[0] : null;
//       const file3 = req.files.image3 ? req.files.image3[0] : null;

//       // Cek produk jika belum ada (menggunakan Realtime Database)
//       const productRef = ref(db, `products/${id}`);
//       const productSnapshot = await get(productRef);
//       if (!productSnapshot.exists()) {
//         return res.status(404).send('Produk tidak ditemukan.');
//       }

//       // Cek dan update kategori jika belum ada (menggunakan Realtime Database)
//       const categoryRef = ref(db, 'categories');
//       const categorySnapshot = await get(categoryRef);

//       const categoryName = category.toLowerCase(); // replace with the actual category name

//       const categories = Object.values(categorySnapshot.val()); // convert object to array
//       const existingCategory = categories.find((category) => category.name.toLowerCase() === categoryName);

//       if (!existingCategory) {
//         await push(categoryRef, { name: categoryName });
//       }

//       // Upload gambar ke Firebase Storage (jika ada)

//       let imageUrl = '';

//       if (file) {
//         const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
//         const metadata = {
//           contentType: file.mimetype,
//           customMetadata: {
//             description: 'This is a products image',
//           },
//           contentDisposition: 'inline; filename="' + file.originalname + '"',
//           cacheControl: 'public, max-age=31536000',
//         };
//         await uploadBytes(imageRef, file.buffer, metadata);
//         imageUrl = await getDownloadURL(imageRef);
//       }
//       let imageUrl2 = '';
//       if (file2) {
//         const imageRef = dbsRef(storage, `images/${uuidv4()}-${file2.originalname}`);
//         const metadata = {
//           contentType: file2.mimetype,
//           customMetadata: {
//             description: 'This is a products image',
//           },
//           contentDisposition: 'inline; filename="' + file2.originalname + '"',
//           cacheControl: 'public, max-age=31536000',
//         };
//         await uploadBytes(imageRef, file2.buffer, metadata);
//         imageUrl2 = await getDownloadURL(imageRef);
//       }
//       let imageUrl3 = '';
//       if (file3) {
//         const imageRef = dbsRef(storage, `images/${uuidv4()}-${file3.originalname}`);
//         const metadata = {
//           contentType: file3.mimetype,
//           customMetadata: {
//             description: 'This is a products image',
//           },
//           contentDisposition: 'inline; filename="' + file3.originalname + '"',
//           cacheControl: 'public, max-age=31536000',
//         };
//         await uploadBytes(imageRef, file3.buffer, metadata);
//         imageUrl3 = await getDownloadURL(imageRef);
//       }
//       // Update produk ke Realtime Database
//       await update(ref(db, `products/${id}`), {
//         name,
//         price,
//         subPrice,
//         category,
//         color: getValidColors([color1, color2, color3]),
//         imageUrl: getValidColors([imageUrl, imageUrl2, imageUrl3]),
//         discount: Math.round(((price - subPrice) / price) * 100),
//         rating,
//         terjual,
//         gudang,
//       });

//       res.status(200).json('success update product sablonika ');
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Terjadi kesalahan.');
//     }
//   }
// );

router.post(
  '/products/e/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]),
  async function (req, res) {
    try {
      const { id } = req.params;
      const { name, price, subPrice, category, color1, color2, color3, rating, terjual, gudang } = req.body;

      const file = req.files.image ? req.files.image[0] : null;
      const file2 = req.files.image2 ? req.files.image2[0] : null;
      const file3 = req.files.image3 ? req.files.image3[0] : null;

      const productRef = ref(db, `products/${id}`);
      const productSnapshot = await get(productRef);
      if (!productSnapshot.exists()) {
        return res.status(404).send('Produk tidak ditemukan.');
      }

      const productData = productSnapshot.val();
      const currentImages = productData.imageUrl; // Ambil URL gambar saat ini

      // Cek dan update kategori jika belum ada
      const categoryRef = ref(db, 'categories');
      const categorySnapshot = await get(categoryRef);
      const categoryName = category.toLowerCase();
      const categories = Object.values(categorySnapshot.val());
      const existingCategory = categories.find((category) => category.name.toLowerCase() === categoryName);

      if (!existingCategory) {
        await push(categoryRef, { name: categoryName });
      }

      // Fungsi untuk mengupload gambar
      const uploadImage = async (file) => {
        if (!file) return null;

        const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
        const metadata = {
          contentType: file.mimetype,
          customMetadata: {
            description: 'This is a products image',
          },
          contentDisposition: 'inline; filename="' + file.originalname + '"',
          cacheControl: 'public, max-age=31536000',
        };
        await uploadBytes(imageRef, file.buffer, metadata);
        return await getDownloadURL(imageRef);
      };

      // Update gambar
      const newImageUrl = (await uploadImage(file)) || currentImages[0];
      const newImageUrl2 = (await uploadImage(file2)) || currentImages[1];
      const newImageUrl3 = (await uploadImage(file3)) || currentImages[2];

      // Hapus file lama jika ada
      const deleteOldImage = async (imageUrl) => {
        if (imageUrl) {
          const oldImageRef = dbsRef(storage, imageUrl); // Pastikan ini adalah referensi yang benar
          await deleteObject(oldImageRef);
        }
      };

      // Hapus gambar yang diganti
      if (file) await deleteOldImage(currentImages[0]);
      if (file2) await deleteOldImage(currentImages[1]);
      if (file3) await deleteOldImage(currentImages[2]);

      // Update produk ke Realtime Database
      await update(productRef, {
        name,
        price,
        subPrice,
        category,
        color: getValidColors([color1, color2, color3]),
        imageUrl: [newImageUrl, newImageUrl2, newImageUrl3],
        discount: Math.round(((price - subPrice) / price) * 100),
        rating,
        terjual,
        gudang,
      });

      res.status(200).json('success update product sablonika ');
    } catch (error) {
      console.error(error);
      res.status(500).send('Terjadi kesalahan.');
    }
  }
);
//HALAMAN EDIT PRODUCT
router.get('/products/edit/:id', authorize, async function (req, res) {
  try {
    const id = req.params.id;

    const productRef = ref(db, `products/${id}`);
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      res.status(404).send('Produk tidak ditemukan.');
    } else {
      const product = productSnapshot.val();
      product.id = productSnapshot.key;
      res.render('editProduct', {
        product: product,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});

//HALAMAN DETAIL PRODUCT
router.get('/products/detail/:id', async function (req, res) {
  try {
    const id = req.params.id;
    const productRef = ref(db, `products/${id}`);
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      res.status(404).send('Produk tidak ditemukan.');
    } else {
      const product = productSnapshot.val();

      product.id = productSnapshot.key;
      res.render('productDetaile', {
        product: product,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});

// DELETE

// router.delete('/products/:id/delete', authorize, async function (req, res) {
//   try {
//     const id = req.params.id;
//     const productRef = ref(db, `products/${id}`);
//     const categoryRef = ref(db, 'category');

//     // Retrieve the product data from the Realtime Database
//     const productSnapshot = await get(productRef);
//     if (!productSnapshot.exists()) {
//       return res.status(404).send('Product not found');
//     }
//     const productData = productSnapshot.val();
//     // Delete image from Storage
//     if (productData.imageUrl) {
//       const oldImageRef = dbsRef(storage, productData.imageUrl);
//       await deleteObject(oldImageRef);
//     }

//     // Delete product data from Realtime Database
//     await remove(productRef);

//     res.status(200).json({
//       message: 'Produk berhasil dihapus',
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Terjadi kesalahan.');
//   }
// });
// router.delete('/products/:id/delete', authorize, async (req, res) => {
//   try {
//     const id = req.params.id;
//     const productRef = ref(db, `products/${id}`);
//     const categoryRef = ref(db, 'categories');

//     // Retrieve the product data from the Realtime Database
//     const productSnapshot = await get(productRef);
//     if (!productSnapshot.exists()) {
//       return res.status(404).send('Product not found');
//     }
//     const productData = productSnapshot.val();
//     // Delete image from Storage
//     if (productData.imageUrl) {
//       const oldImageRef = dbsRef(storage, productData.imageUrl);
//       await deleteObject(oldImageRef);
//     }

//     // Delete product data from Realtime Database
//     await remove(productRef);

//     // Check if any category is not used by any product
//     const categoriesSnapshot = await get(categoryRef);
//     const categoriesData = categoriesSnapshot.val();
//     const productsSnapshot = await get(ref(db, 'products'));
//     const productsData = productsSnapshot.val();

//     Object.keys(categoriesData).forEach((categoryId) => {
//       let categoryName = categoriesData[categoryId].name;
//       let categoryUsed = false;
//       Object.keys(productsData).forEach((productId) => {
//         if (productsData[productId].category === categoryName) {
//           categoryUsed = true;
//         }
//       });
//       if (!categoryUsed) {
//         // Delete the unused category
//         remove(ref(db, `category/${categoryId}`));
//       }
//     });

//     res.status(200).json({
//       message: 'Produk berhasil dihapus',
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Terjadi kesalahan.');
//   }
// });

router.delete('/products/:id/delete', authorize, async (req, res) => {
  try {
    const id = req.params.id;
    const productRef = ref(db, `products/${id}`);
    const categoryRef = ref(db, 'categories');

    // Retrieve the product data from the Realtime Database
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      return res.status(404).send('Product not found');
    }

    const productData = productSnapshot.val();
    const imageUrls = productData.imageUrl || []; // Ambil array imageUrl

    // Delete images from Storage
    await Promise.all(
      imageUrls.map(async (imageUrl) => {
        const oldImageRef = dbsRef(storage, imageUrl);
        await deleteObject(oldImageRef);
      })
    );

    // Delete product data from Realtime Database
    await remove(productRef);

    // Check if any category is not used by any product
    const categoriesSnapshot = await get(categoryRef);
    const categoriesData = categoriesSnapshot.val();
    const productsSnapshot = await get(ref(db, 'products'));
    const productsData = productsSnapshot.val();

    // Loop through categories and delete unused ones
    for (const categoryId in categoriesData) {
      const categoryName = categoriesData[categoryId].name;
      const isCategoryUsed = Object.values(productsData).some((product) => product.category === categoryName);

      if (!isCategoryUsed) {
        // Delete the unused category
        await remove(ref(db, `categories/${categoryId}`));
      }
    }

    res.status(200).json({
      message: 'Produk berhasil dihapus',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});
function formatAngka(angka) {
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// router.post('/share-whatsapp', async (req, res) => {
//   const { imageUrl, name, price, subPrice, discount, detailUrl } = req.body;
//   const recipientPhoneNumber = '+6283166383802';
//   const hemat = price - subPrice;

//   try {
//     // Mengunduh gambar dari Firebase Storage
//     let media;

//     // Jika imageUrl adalah gambar:
//     if (imageUrl.match(/\.(jpeg|jpg|png|gif)$/i)) {
//       // Validasi ekstensi gambar
//       const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//       const imageBuffer = Buffer.from(response.data, 'binary');
//       media = new MessageMedia('image/jpeg', imageBuffer, 'image.jpg'); // Ganti mimetype jika perlu
//     } else {
//       // Jika imageUrl adalah video/GIF, coba kirim sebagai URL (pastikan formatnya didukung):
//       media = await MessageMedia.fromUrl(imageUrl);
//     }
//     // Mengirim gambar ke WhatsApp dengan caption
//     const caption = `
// 🔥 PROMO TERBATAS! ${name} 🔥

// ✨ ${name} ✨

// Harga Normal: Rp${formatAngka(price)}
// Diskon: ${discount}%
// Harga Spesial kaos ${name} setelah diskon: *Rp${formatAngka(subPrice)}*
// Anda Hemat: *Rp${formatAngka(hemat)}*

// Tampil stylish dan percaya diri dengan produk terbaru kami! Bahan katun premium yang nyaman dan desain grafiti yang edgy bikin kamu jadi pusat perhatian.
// Stok Terbatas! Pesan Sekarang Sebelum Kehabisan!

// ➡️ Klik di sini untuk cek ongkir dan pesan dari website: ${detailUrl}`;

//     await client.sendMessage(recipientPhoneNumber, media, { caption: caption });

//     // Redirect ke WhatsApp
//     res.redirect(`https://wa.me/${recipientPhoneNumber}?text=➡️ Silahkan Tanya Harga Dengan ONGKIR khusus jakarta barat free ongkir`);
//   } catch (error) {
//     console.error('Error downloading or sending image:', error);
//     res.status(500).send('Error processing request');
//   }
// });

router.post('/share-whatsapp', async (req, res) => {
  try {
    const imageUrl = req.body.imageUrl; // Ambil imageUrl dari body request

    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'imageUrl is required',
      });
    }
    // Send WhatsApp message with caption
    const recipientPhoneNumber = '+6283166383802';

    const colors = [req.body.color1, req.body.color2, req.body.color3];
    const colorsValue = getValidColors(colors);

    const caption = `
🔥 KHUSUS BUAT KAMU!🔥

✨ *${req.body.name}* ✨

Harga :*Rp*.*${formatAngka(req.body.price)}*
Diskon : *${req.body.discount}%*
setelah diskon: *Rp${formatAngka(req.body.subPrice)}*

*Ukuran* : [ S, M, L, XL  ]

*Pilihan warna Kaos:*
 ${colorsValue.map((color) => `- ${color}`).join('\n')}

*SILAHKAN ISI FORM DIBAWAH INI UNTUK MELAKUKAN PEMESANAN ! :*
 id : ${req.body.id}
 Nama pemesan :
 Ukuran baju:
 Warna baju:
 Alamat lengkap :
 No HP / wa  :
 
 ➡️product : https://fanshub.gumelar.site/products/detail/${req.body.id}
 ➡️halaman web katalog : https://fanshub.gumelar.site 
 ➡️imageUrl : ${imageUrl}

    `;

    // Hapus gambar di direktori wafoto
    // fs.unlinkSync(filePath);
    // console.log('Gambar berhasil dihapus dari direktori wafoto');

    // Redirect ke WhatsApp
    res.redirect(`https://wa.me/${recipientPhoneNumber}?text=${encodeURIComponent(`${caption}`)}`);
  } catch (error) {
    console.error('Error menyimpan gambar atau mengirim ke WhatsApp:', error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat menyimpan gambar atau mengirim ke WhatsApp',
      error: error.message, // Optional: kirimkan pesan error untuk debugging
    });
  }
});

// router.post('/simpanfoto', async (req, res) => {
//   try {
//     const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/bioproduct-fa5a4.appspot.com/o/images%2Fa421abc5-526f-48ec-90b4-b788275f662e-prod1.png?alt=media&token=84eaaec8-0748-4a21-a534-f132b7b0b645'; // Ambil imageUrl dari body request

//     if (!fs.existsSync('./wafoto')) {
//       fs.mkdirSync('./wafoto');
//     }
//     if (!imageUrl) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'imageUrl is required',
//       });
//     }

//     const parsedUrl = new URL(imageUrl); // Parsing URL
//     const fileName = parsedUrl.pathname.split('/').pop(); // Ambil nama file dari path
//     const fileExtension = path.extname(fileName);
//     const uniqueFileName = `${uuidv4()}-${sanitizeFilename(fileName)}`;
//     const filePath = `./wafoto/${uniqueFileName}${fileExtension}`;

//     const response = await axios({
//       url: imageUrl,
//       method: 'GET',
//       responseType: 'arraybuffer',
//     });

//     fs.writeFileSync(filePath, response.data);

//     console.log('Gambar berhasil disimpan ke:', filePath);

//     res.status(200).json({
//       status: 'success',
//       message: 'Gambar berhasil disimpan ke wafoto',
//       filePath: filePath,
//     });
//   } catch (error) {
//     console.error('Error menyimpan gambar:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Terjadi kesalahan saat menyimpan gambar',
//       error: error.message, // Optional: kirimkan pesan error untuk debugging
//     });
//   }
// });

// client.initialize();

module.exports = router;
