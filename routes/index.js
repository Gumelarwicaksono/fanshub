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

  const productsSnapshot = await get(productsDbRef);
  const categoriesSnapshot = await get(categoriesDbRef);

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

    res.render('index', {
      products: products,
      categories: categories,
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
    let imageUrl = '';
    if (file) {
      const imageRef = dbsRef(storage, `images/${uuidv4()}-${file.originalname}`);
      await uploadBytes(imageRef, file.buffer);
      imageUrl = await getDownloadURL(imageRef);
    }

    // Simpan produk ke Realtime Database
    const newProductRef = push(ref(db, 'products'));
    await set(newProductRef, {
      name,
      price,
      subPrice,
      categoryName,
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

module.exports = router;
