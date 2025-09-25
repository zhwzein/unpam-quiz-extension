// Buat interval yang terus memeriksa dan mengganti kedua gambar
const intervalId = setInterval(() => {
  // Ganti gambar PersonLearn dengan holo-tail gif
  const personLearnImage = document.querySelector(
    'img[src*="PersonLearn-DbY26Ht3.png"]'
  );

  if (personLearnImage) {
    personLearnImage.remove();
  }

  // Ganti pengaturan background image
  const bgImage = document.querySelector('img[src*="Background-Dt75uuh7.jpg"]');
  if (bgImage) {
    const isMobile = window.innerWidth <= 768
    const newSrc = isMobile
      ? chrome.runtime.getURL("assets/gojo.jpeg")
      : chrome.runtime.getURL("assets/gojo.jpeg");

    bgImage.src = newSrc
    bgImage.style.width = '100%'
    bgImage.style.height = '100%'
    bgImage.style.objectFit = 'cover'
    bgImage.style.objectPosition = 'center'
  }

  // Tambahkan style untuk MuiTypography-root MuiTypography-h5
  const h5Element = document.querySelector(
    ".MuiTypography-root.MuiTypography-h5"
  );
  if (h5Element) {
    h5Element.style.lineHeight = "0.334";
  }
}); // Periksa setiap 100ms

console.log("Interval aktif - kedua gambar akan terus diganti secara otomatis");

// Jika ingin menghentikan interval nanti:
// clearInterval(intervalId);
