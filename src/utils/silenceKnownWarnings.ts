// Menekan warning/error deprecation yang berasal dari dalam library (bukan kode aplikasi).
//
// 1) "props.pointerEvents is deprecated. Use style.pointerEvents"
//    @react-navigation (bottom-tabs / elements) masih mengirim `pointerEvents` sebagai
//    prop ke <View>, sedangkan react-native-web 0.21 menandainya deprecated. Karena
//    fix-nya harus mengubah kode library (via patch-package), kita tekan pesan spesifik
//    ini saja sampai library tersebut dirilis dengan API baru.
//
// 2) "Invalid DOM property `transform-origin`. Did you mean `transformOrigin`?"
//    Adapter web react-native-svg menulis atribut SVG 'transform-origin' dengan nama
//    properti DOM yang tidak valid, sehingga React mencetak error setiap donut chart
//    dirender (halaman Analytics). Chart tetap berfungsi normal; error ini murni dari
//    library. Kita tekan hanya pesan spesifik ini — "Invalid DOM property" lain tetap
//    tampil supaya masalah nyata tidak tertutup.
//
// Catatan: modul ini harus di-import lebih dulu di app/_layout.tsx agar aktif sebelum
// komponen React dirender.
const __origWarn = console.warn;
const __origError = console.error;
const POINTER_EVENTS_DEPRECATION = 'props.pointerEvents is deprecated. Use style.pointerEvents';

console.warn = (...args: unknown[]) => {
    if (args[0] === POINTER_EVENTS_DEPRECATION) {
        return;
    }
    __origWarn.apply(console, args as Parameters<typeof console.warn>);
};

console.error = (...args: unknown[]) => {
    if (
        typeof args[0] === 'string' &&
        args[0].includes('Invalid DOM property') &&
        args[1] === 'transform-origin'
    ) {
        return;
    }
    __origError.apply(console, args as Parameters<typeof console.error>);
};
