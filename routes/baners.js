var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { authorize, db, dbsRef, deleteObject, get, getDownloadURL, push, ref, remove, set, storage, update, uploadBytes } = require('./../firebase');

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/baners',
  authorize,
  upload.fields([
    { name: 'banerImg1', maxCount: 1 },
    { name: 'banerImg2', maxCount: 1 },
  ]),
  async function (req, res) {
    try {
      const { banerDetaileUrl, banerMetsos, banerPrice, banerSubPrice } = req.body;
      const file1 = req.files.banerImg1[0];
      const file2 = req.files.banerImg2[0];
      if (!file1 || !file2) {
        return res.status(400).send('Tidak ada file yang diunggah.');
      }

      // Hitung diskon
      const discount = Math.round(((banerPrice - banerSubPrice) / banerPrice) * 100);

      // Upload gambar ke Firebase Storage (jika ada)
      let imageUrl1 = '';
      let imageUrl2 = '';
      if (file1) {
        const imageRef1 = dbsRef(storage, `images/${uuidv4()}-${file1.originalname}`);
        await uploadBytes(imageRef1, file1.buffer);
        imageUrl1 = await getDownloadURL(imageRef1);
      }
      if (file2) {
        const imageRef2 = dbsRef(storage, `images/${uuidv4()}-${file2.originalname}`);
        await uploadBytes(imageRef2, file2.buffer);
        imageUrl2 = await getDownloadURL(imageRef2);
      }

      // Simpan produk ke Realtime Database
      const newProductRef = push(ref(db, 'baners'));
      await set(newProductRef, {
        banerDetaileUrl,
        banerDiscount: discount,
        banerImg: imageUrl1,
        banerImgUrl: imageUrl2,
        banerMetsos,
        banerPrice,
        banerSubPrice,
      });

      res.status(201).json('success add baners fanshub ');
    } catch (error) {
      console.error(error);
      res.status(500).send({
        status: 'Terjadi kesalahan.',
        message: error,
      });
    }
  }
);

//HALAMAN ADD PRODUCT
router.get('/banersadd', authorize, (req, res) => {
  res.render('banerAdd');
});

//API EDIT PRODUCT
router.post(
  '/baners/e/:id',
  authorize,
  upload.fields([
    { name: 'banerImg1', maxCount: 1 },
    { name: 'banerImg2', maxCount: 1 },
  ]),
  async function (req, res) {
    try {
      const { id } = req.params;
      const { banerDetaileUrl, banerMetsos, banerPrice, banerSubPrice } = req.body;
      const file1 = req.files.banerImg1;
      const file2 = req.files.banerImg2;

      // Cek baners jika belum ada (menggunakan Realtime Database)
      const productRef = ref(db, `baners/${id}`);
      const productSnapshot = await get(productRef);
      if (!productSnapshot.exists()) {
        return res.status(404).send('Produk tidak ditemukan.');
      }
      // Hitung diskon
      const discount = Math.round(((banerPrice - banerSubPrice) / banerPrice) * 100);

      // Upload gambar ke Firebase Storage (jika ada)
      let imageUrl1 = '';
      let imageUrl2 = '';
      if (file1) {
        const imageRef1 = dbsRef(storage, `images/${uuidv4()}-${file1.originalname}`);
        await uploadBytes(imageRef1, file1.buffer);
        imageUrl1 = await getDownloadURL(imageRef1);
      } else {
        imageUrl1 = productSnapshot.val().banerImg;
      }

      if (file2) {
        const imageRef2 = dbsRef(storage, `images/${uuidv4()}-${file2.originalname}`);
        await uploadBytes(imageRef2, file2.buffer);
        imageUrl2 = await getDownloadURL(imageRef2);
      } else {
        imageUrl2 = productSnapshot.val().banerImgUrl;
      }
      // Update produk ke Realtime Database
      await update(ref(db, `baners/${id}`), {
        banerDetaileUrl,
        banerDiscount: discount,
        banerImg: imageUrl1,
        banerImgUrl: imageUrl2,
        banerMetsos,
        banerPrice,
        banerSubPrice,
      });

      res.status(200).json('success update baners fanshub ');
    } catch (error) {
      console.error(error);
      res.status(500).send('Terjadi kesalahan.');
    }
  }
);
//HALAMAN EDIT PRODUCT
router.get('/baners/edit/:id', authorize, async function (req, res) {
  try {
    const id = req.params.id;

    const productRef = ref(db, `baners/${id}`);
    const banersSnapshot = await get(productRef);
    if (!banersSnapshot.exists()) {
      res.status(404).send('Produk tidak ditemukan.');
    } else {
      const baners = banersSnapshot.val();
      baners.id = banersSnapshot.key;
      res.render('editBaners', {
        baners: baners,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});

// DELETE

router.delete('/baners/:id/delete', authorize, async function (req, res) {
  try {
    const id = req.params.id;
    const productRef = ref(db, `baners/${id}`);

    // Retrieve the product data from the Realtime Database
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      return res.status(404).send('Product not found');
    }
    const productData = productSnapshot.val();
    console.log(productData.banerImg);
    // Delete image from Storage
    if (productData.banerImg) {
      const oldImageRef = dbsRef(storage, productData.banerImg);
      await deleteObject(oldImageRef);
    }
    if (productData.banerImgUrl) {
      const oldImageRef = dbsRef(storage, productData.banerImgUrl);
      await deleteObject(oldImageRef);
    }

    // Delete product data from Realtime Database
    await remove(productRef);

    res.status(200).json({
      message: 'Produk berhasil dihapus',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan.');
  }
});

module.exports = router;
