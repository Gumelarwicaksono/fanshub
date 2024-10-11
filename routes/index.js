var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { auth, authorize, createUserWithEmailAndPassword, db, dbsRef, deleteObject, get, getDownloadURL, push, ref, remove, set, signInWithEmailAndPassword, storage, update, uploadBytes } = require('./../firebase');

const upload = multer({ storage: multer.memoryStorage() });

function register0(email, password, displayName) {}
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

router.post('/products', authorize, upload.single('image'), async function (req, res) {
  try {
    const { name, price, subPrice, category, detailUrl, rating, terjual, gudang } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).send('Tidak ada file yang diunggah.');
    }
    // Hitung diskon
    const discount = Math.round(((price - subPrice) / price) * 100);

    const categoryRef = ref(db, 'categories');
    const categorySnapshot = await get(categoryRef);

    const categoryName = category.toLowerCase(); // replace with the actual category name

    const categories = Object.values(categorySnapshot.val()); // convert object to array
    const existingCategory = categories.find((category) => category.name.toLowerCase() === categoryName);

    if (!existingCategory) {
      await push(categoryRef, { name: categoryName });
    }
    // Upload gambar ke Firebase Storage (jika ada)
    // let imageUrl = '';
    // if (file) {
    //   const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
    //   await uploadBytes(imageRef, file.buffer);
    //   imageUrl = await getDownloadURL(imageRef);
    // }

    let imageUrl = '';
    if (file) {
      const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
      const metadata = {
        contentType: file.mimetype, // e.g. image/jpeg, image/png, etc.
        customMetadata: {
          description: 'This is a products image',
        },
        contentDisposition: 'inline; filename="' + file.originalname + '"',
        cacheControl: 'public, max-age=31536000', // cache for 1 year
      };
      await uploadBytes(imageRef, file.buffer, metadata);
      imageUrl = await getDownloadURL(imageRef);
    }
    // Simpan produk ke Realtime Database
    const newProductRef = push(ref(db, 'products'));
    await set(newProductRef, {
      name,
      price,
      subPrice,
      category: categoryName,
      detailUrl,
      imageUrl,
      discount,
      rating,
      terjual,
      gudang,
    });

    res.status(201).json('success add product sablonika ');
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});

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
    const baners = Object.keys(banersSnapshot.val()).map((key) => {
      return { id: key, ...banersSnapshot.val()[key] };
    });
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
router.post('/products/e/:id', authorize, upload.single('image'), async function (req, res) {
  try {
    const { id } = req.params;
    const { name, price, subPrice, category, detailUrl, rating, terjual, gudang } = req.body;
    const file = req.file;

    // Cek produk jika belum ada (menggunakan Realtime Database)
    const productRef = ref(db, `products/${id}`);
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      return res.status(404).send('Produk tidak ditemukan.');
    }
    // Hitung diskon
    const discount = Math.round(((price - subPrice) / price) * 100);

    // Cek dan update kategori jika belum ada (menggunakan Realtime Database)
    const categoryRef = ref(db, 'categories');
    const categorySnapshot = await get(categoryRef);

    const categoryName = category.toLowerCase(); // replace with the actual category name

    const categories = Object.values(categorySnapshot.val()); // convert object to array
    const existingCategory = categories.find((category) => category.name.toLowerCase() === categoryName);

    if (!existingCategory) {
      await push(categoryRef, { name: categoryName });
    }

    // Upload gambar ke Firebase Storage (jika ada)
    let imageUrl = '';
    if (file) {
      const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
      await uploadBytes(imageRef, file.buffer);
      imageUrl = await getDownloadURL(imageRef);
    } else {
      imageUrl = productSnapshot.val().imageUrl;
    }

    // Update produk ke Realtime Database
    await update(ref(db, `products/${id}`), {
      name,
      price,
      subPrice,
      category: categoryName,
      detailUrl,
      imageUrl,
      discount,
      rating,
      terjual,
      gudang,
    });

    res.status(200).json('success update product sablonika ');
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});
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
    // Delete image from Storage
    if (productData.imageUrl) {
      const oldImageRef = dbsRef(storage, productData.imageUrl);
      await deleteObject(oldImageRef);
    }

    // Delete product data from Realtime Database
    await remove(productRef);

    // Check if any category is not used by any product
    const categoriesSnapshot = await get(categoryRef);
    const categoriesData = categoriesSnapshot.val();
    const productsSnapshot = await get(ref(db, 'products'));
    const productsData = productsSnapshot.val();

    Object.keys(categoriesData).forEach((categoryId) => {
      let categoryName = categoriesData[categoryId].name;
      let categoryUsed = false;
      Object.keys(productsData).forEach((productId) => {
        if (productsData[productId].category === categoryName) {
          categoryUsed = true;
        }
      });
      if (!categoryUsed) {
        // Delete the unused category
        remove(ref(db, `category/${categoryId}`));
      }
    });

    res.status(200).json({
      message: 'Produk berhasil dihapus',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});
module.exports = router;
