// script.js

// --- KONFIGURASI API ---
// URL untuk API e-commerce utama (memuat buku, checkout)
const API_URL = 'https://script.google.com/macros/s/AKfycbwwu0FkRJMzXCYBHyNS3YEBHZW1G6YewOl8xkld7-VLKxJ9IeFEIA1xIxdRFv0d4Ag/exec'; 

// URL untuk API newsletter terpisah
const NEWSLETTER_API_URL = 'https://script.google.com/macros/s/AKfycbyvFYWXxLm1J1uhm7HvHcp3TW_qpzIFFCll3YD5Nls2vFhySaK4ILXdHPStI7ON8Kf1/exec'; 

// --- ELEMEN DOM E-COMMERCE ---
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

const cartIcon = document.getElementById('cart-icon');
const cartCountSpan = document.querySelector('.cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const cartCloseBtn = document.getElementById('cart-close');
const cartItemsContainer = document.getElementById('cart-items'); // Di sidebar
const cartTotalPriceSpan = document.getElementById('cart-total-price');
const cartCheckoutBtn = document.getElementById('cart-checkout');
const overlay = document.getElementById('overlay');

const categoriesContainer = document.getElementById('categories-container');
const booksGrid = document.getElementById('books-grid');
const refreshBooksBtn = document.getElementById('refresh-books-btn');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const checkoutModal = document.getElementById('checkout-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const checkoutForm = document.getElementById('checkout-form');
const customerNameInput = document.getElementById('customer-name');
const customerEmailInput = document.getElementById('customer-email');
const customerWhatsappInput = document.getElementById('customer-whatsapp');
const submitOrderBtn = document.getElementById('submit-order-btn');
const orderSubmitText = document.getElementById('order-submit-text');
const orderSubmitSpinner = document.getElementById('order-submit-spinner');
const orderStatusDiv = document.getElementById('order-status');

// --- ELEMEN DOM NEWSLETTER ---
const newsletterForm = document.getElementById('newsletter-form');
const newsletterEmailInput = document.getElementById('newsletter-email');
const newsletterNameInput = document.getElementById('newsletter-name');
const newsletterSubmitBtn = document.getElementById('newsletter-submit-btn');
const newsletterStatusDiv = document.getElementById('newsletter-status');

// --- DATA GLOBAL ---
let cart = []; // Array untuk menyimpan item di keranjang belanja
let allBooks = []; // Array untuk menyimpan semua buku yang dimuat dari API
let allCategories = []; // Array untuk menyimpan semua kategori yang dimuat dari API

// --- FUNGSI UTILITY ---

// Fungsi untuk format angka menjadi Rupiah
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
};

// Fungsi untuk menampilkan/menyembunyikan overlay
const toggleOverlay = (show) => {
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
};

// Fungsi untuk menampilkan notifikasi toast
const showToast = (message, type = 'success') => {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.remove('bg-red-500', 'bg-green-500'); // Bersihkan warna sebelumnya

    const icon = toast.querySelector('i');
    icon.classList.remove('fa-check-circle', 'fa-times-circle'); // Bersihkan icon sebelumnya

    if (type === 'success') {
        toast.classList.add('bg-green-500');
        icon.classList.add('fa-check-circle');
    } else {
        toast.classList.add('bg-red-500');
        icon.classList.add('fa-times-circle');
    }

    // Tampilkan selama 3 detik
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
};

// Fungsi untuk mendapatkan ikon berdasarkan nama kategori
const getCategoryIcon = (categoryName) => {
    const lowerCaseName = categoryName.toLowerCase();
    switch (lowerCaseName) {
        case 'renungan':
            return 'fas fa-book-open';
        case 'studi alkitab':
            return 'fas fa-bible';
        case 'kehidupan kristen':
            return 'fas fa-church';
        case 'keluarga':
            return 'fas fa-people-roof';
        case 'kesaksian':
            return 'fas fa-microphone';
        case 'teologi':
            return 'fas fa-graduation-cap';
        case 'sejarah gereja':
            return 'fas fa-landmark';
        case 'misi':
            return 'fas fa-globe';
        case 'apologetika':
            return 'fas fa-shield-alt';
        default:
            return 'fas fa-book'; // Ikon default jika tidak ada yang cocok
    }
};

// --- LOGIKA NAVIGASI (MOBILE MENU) ---
hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden'); // Tutup menu setelah klik
    });
});

// --- LOGIKA KERANJANG (SIDEBAR) ---
cartIcon.addEventListener('click', () => {
    cartSidebar.classList.remove('translate-x-full');
    toggleOverlay(true);
});

cartCloseBtn.addEventListener('click', () => {
    cartSidebar.classList.add('translate-x-full');
    toggleOverlay(false);
});

overlay.addEventListener('click', () => {
    // Tutup sidebar dan modal jika overlay diklik
    cartSidebar.classList.add('translate-x-full');
    checkoutModal.classList.add('hidden');
    toggleOverlay(false);
});

// Fungsi untuk memperbarui tampilan keranjang di sidebar
function updateCartDisplay() {
    cartItemsContainer.innerHTML = ''; // Kosongkan dulu
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center">Keranjang Anda kosong.</p>';
        cartCountSpan.classList.add('hidden');
    } else {
        cartCountSpan.classList.remove('hidden');
        cartCountSpan.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('flex', 'justify-between', 'items-center', 'py-2', 'border-b', 'border-gray-200');
            itemElement.innerHTML = `
                <div>
                    <h4 class="font-semibold">${DOMPurify.sanitize(item.title)}</h4>
                    <p class="text-sm text-gray-600">${formatRupiah(item.price)} x ${item.quantity}</p>
                </div>
                <button class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded" data-id="${item.id}">Hapus</button>
            `;
            cartItemsContainer.appendChild(itemElement);
            total += item.price * item.quantity;
        });
    }
    cartTotalPriceSpan.textContent = formatRupiah(total);

    // Tambahkan event listener untuk tombol hapus
    cartItemsContainer.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            const idToRemove = e.target.dataset.id;
            removeFromCart(idToRemove);
        });
    });
}

// Fungsi untuk menambahkan e-book ke keranjang
function addToCart(event) {
    const button = event.target;
    const id = button.dataset.id;
    
    // Cari buku di array allBooks yang sudah dimuat dari API (data terpercaya)
    const bookToAdd = allBooks.find(book => book.ID_Ebook === id);

    if (!bookToAdd) {
        showToast('E-book tidak ditemukan atau data tidak valid.', 'error');
        return;
    }
    
    // Ambil judul dan harga dari objek bookToAdd yang terpercaya
    const title = bookToAdd.Judul_Ebook;
    const price = parseFloat(bookToAdd.Harga);

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id, title, price, quantity: 1 });
    }
    showToast(`${title} ditambahkan ke keranjang!`, 'success');
    updateCartDisplay();
    saveCartToLocalStorage();
}

// Fungsi untuk menghapus item dari keranjang
function removeFromCart(idToRemove) {
    cart = cart.filter(item => item.id !== idToRemove);
    showToast('Item dihapus dari keranjang.', 'success');
    updateCartDisplay();
    saveCartToLocalStorage();
}

// Fungsi untuk mengosongkan keranjang
function clearCart() {
    cart = [];
    updateCartDisplay();
    saveCartToLocalStorage();
}

// Fungsi untuk menyimpan keranjang ke localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

// --- LOGIKA PEMUATAN & TAMPILAN E-BOOK & KATEGORI ---
async function loadBooksAndCategories() {
    booksGrid.innerHTML = '<p class="text-center col-span-full text-gray-500">Memuat e-book...</p>';
    categoriesContainer.innerHTML = '<p class="text-center col-span-full text-gray-500">Memuat kategori...</p>';
    orderStatusDiv.textContent = ''; // Kosongkan pesan status order

    try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (result.status === 'sukses' && result.data) {
            allBooks = result.data.books || [];
            allCategories = result.data.categories || [];

            displayCategories(allCategories); // Tampilkan kategori dulu
            filterBooksByCategory('all'); // Tampilkan semua buku secara default
        } else {
            throw new Error(result.message || 'Data tidak ditemukan.');
        }
    } catch (error) {
        console.error('Error memuat data:', error);
        booksGrid.innerHTML = `<p class="text-center col-span-full text-red-600">Gagal memuat e-book: ${DOMPurify.sanitize(error.message)}</p>`;
        categoriesContainer.innerHTML = `<p class="text-center col-span-full text-red-600">Gagal memuat kategori.</p>`;
        showToast('Gagal memuat data. Coba refresh.', 'error');
    }
}

// Menampilkan E-book ke Grid
function displayBooks(booksToDisplay) {
    booksGrid.innerHTML = ''; // Kosongkan kontainer buku
    if (booksToDisplay.length === 0) {
        booksGrid.innerHTML = '<p class="text-center col-span-full text-gray-500">Tidak ada e-book di kategori ini.</p>';
        return;
    }

    booksToDisplay.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-lg', 'flex', 'flex-col', 'items-center', 'text-center');
        bookCard.innerHTML = `
            <img src="${DOMPurify.sanitize(book.Link_Preview || 'https://placehold.co/200x300?text=Ebook+Cover')}" alt="${DOMPurify.sanitize(book.Judul_Ebook)}" class="w-48 h-auto object-cover mb-4 rounded-md shadow">
            <h3 class="text-xl font-semibold mb-2">${DOMPurify.sanitize(book.Judul_Ebook)}</h3>
            <p class="text-gray-600 text-sm mb-2">Oleh: ${DOMPurify.sanitize(book.Penulis)}</p>
            <p class="text-lg font-bold text-blue-700 mb-4">${formatRupiah(book.Harga)}</p>
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 w-full"
                    data-id="${book.ID_Ebook}"
                    data-title="${book.Judul_Ebook}">
                    Tambahkan ke Keranjang
            </button>
        `;
        bookCard.querySelector('button').addEventListener('click', addToCart);
        booksGrid.appendChild(bookCard);
    });
}

// Menampilkan Tombol Kategori
function displayCategories(categories) {
    categoriesContainer.innerHTML = ''; // Kosongkan kontainer kategori

    // Tombol "Semua Kategori"
    const allButton = document.createElement('button');
    allButton.classList.add('col-span-1', 'bg-blue-100', 'text-blue-800', 'font-semibold', 'py-3', 'px-6', 'rounded-full', 'hover:bg-blue-200', 'transition-colors', 'duration-300', 'active-category', 'flex', 'items-center', 'justify-center'); // Tambah class active-category

    allButton.innerHTML = '<i class="fas fa-tags mr-2 text-4xl text-blue-600"></i> Semua Kategori';
    allButton.addEventListener('click', () => filterBooksByCategory('all', allButton));
    categoriesContainer.appendChild(allButton);

    // Tombol kategori dari data API
    categories.forEach(category => {
        const categoryButton = document.createElement('button');
        categoryButton.dataset.categoryId = category.id_kategori; // Simpan ID kategori di data-attribute
        const iconClass = getCategoryIcon(category.nama_kategori); // Dapatkan ikon berdasarkan nama kategori
        categoryButton.classList.add('col-span-1', 'bg-gray-200', 'text-gray-800', 'font-semibold', 'py-3', 'px-6', 'rounded-full', 'hover:bg-gray-300', 'transition-colors', 'duration-300', 'flex', 'items-center', 'justify-center');
        categoryButton.innerHTML = `<i class="${iconClass} mr-2 text-4xl text-blue-600"></i> ${DOMPurify.sanitize(category.nama_kategori)}`;
        categoryButton.addEventListener('click', () => filterBooksByCategory(category.id_kategori, categoryButton));
        categoriesContainer.appendChild(categoryButton);
    });
}

// Fungsi Filter Buku berdasarkan Kategori
function filterBooksByCategory(categoryId, clickedButton = null) {
    // Hapus kelas 'active-category' dari semua tombol kategori
    document.querySelectorAll('#categories-container button').forEach(button => {
        button.classList.remove('active-category');
        button.classList.add('bg-gray-200', 'text-gray-800'); // Reset warna default
        button.classList.remove('bg-blue-100', 'text-blue-800'); // Hapus warna aktif
    });

    // Tambahkan kelas 'active-category' ke tombol yang diklik (atau tombol 'Semua Kategori' jika default)
    if (clickedButton) {
        clickedButton.classList.add('active-category');
        clickedButton.classList.remove('bg-gray-200', 'text-gray-800'); // Hapus warna default
        clickedButton.classList.add('bg-blue-100', 'text-blue-800'); // Tambah warna aktif
    } else {
        // Jika tidak ada tombol yang diklik (misal saat inisialisasi), aktifkan 'Semua Kategori'
        const allBtn = document.querySelector('#categories-container button[data-category-id="all"]');
        if (allBtn) {
            allBtn.classList.add('active-category');
            allBtn.classList.remove('bg-gray-200', 'text-gray-800');
            allBtn.classList.add('bg-blue-100', 'text-blue-800');
        }
    }

    let filteredBooks;
    if (categoryId === 'all') {
        filteredBooks = allBooks;
    } else {
        // Filter buku berdasarkan 'id_kategori' yang ada di objek buku
        filteredBooks = allBooks.filter(book => book.id_kategori && String(book.id_kategori).toLowerCase() === String(categoryId).toLowerCase());
    }
    displayBooks(filteredBooks);
}

// Event listener untuk tombol refresh
refreshBooksBtn.addEventListener('click', loadBooksAndCategories);

// --- LOGIKA CHECKOUT MODAL ---
cartCheckoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showToast('Keranjang Anda kosong, tidak bisa checkout.', 'error');
        return;
    }
    cartSidebar.classList.add('translate-x-full'); // Tutup sidebar
    checkoutModal.classList.remove('hidden'); // Tampilkan modal
    toggleOverlay(true);
    orderStatusDiv.innerHTML = ''; // Kosongkan pesan status order
});

modalCloseBtn.addEventListener('click', () => {
    checkoutModal.classList.add('hidden');
    toggleOverlay(false);
    checkoutForm.reset(); // Reset form saat modal ditutup
    orderStatusDiv.innerHTML = ''; // Kosongkan status
});

// --- LOGIKA SUBMIT PEMESANAN (E-COMMERCE) ---
checkoutForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Mencegah form reload halaman

    // Validasi dasar form
    if (cart.length === 0) {
        showToast('Keranjang kosong. Tidak bisa memproses pesanan.', 'error');
        return;
    }

    const nama = customerNameInput.value.trim();
    const email = customerEmailInput.value.trim();
    const no_wa = customerWhatsappInput.value.trim(); 

    if (!nama || !email || !no_wa) {
        showToast('Mohon lengkapi semua data pemesanan.', 'error');
        return;
    }

    // Ubah status tombol dan tampilkan spinner
    submitOrderBtn.disabled = true;
    orderSubmitText.classList.add('hidden');
    orderSubmitSpinner.classList.remove('hidden');
    orderStatusDiv.innerHTML = '<p class="text-blue-600">Memproses pesanan Anda...</p>';

    const payload = {
        action: 'checkout', // Tambahkan aksi checkout
        nama: nama,
        email: email,
        no_wa: no_wa,
        cartItems: cart.map(item => ({
            id: item.id,
            quantity: item.quantity
        }))
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // Penting untuk Apps Script doPost
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.status === 'sukses') {
            const totalBayarFormatted = formatRupiah(result.totalAmount); // Format total harga ke Rupiah
            
            orderStatusDiv.innerHTML = `
                <h3 class="text-lg sm:text-xl font-bold text-green-700 mb-2">Pesanan Berhasil Diterima!</h3>
                <p class="text-sm text-gray-700 mb-2">Terima kasih, **${DOMPurify.sanitize(nama)}**! ID Transaksi Anda: <br><strong>${DOMPurify.sanitize(result.orderId)}</strong>.</p>
                <p class="text-sm text-gray-700 font-semibold mb-3">Total bayar: <span class="text-blue-600 text-xl sm:text-2xl">${DOMPurify.sanitize(totalBayarFormatted)}</span></p>
                
                <div class="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-3">
                    <p class="font-bold text-blue-800 mb-2 text-sm"><i class="fas fa-bank mr-2"></i>Instruksi Pembayaran:</p>
                    <ul class="text-sm text-blue-700 ml-4 space-y-1">
                        <li><strong>Bank:</strong> BCA</li>
                        <li><strong>No. Rek:</strong> <span class="font-bold">5120-562-667</span></li>
                        <li><strong>Atas Nama:</strong> YUSUP TANDI BONE</li>
                        <li><strong>Jumlah:</strong> <span class="font-bold text-base">${DOMPurify.sanitize(totalBayarFormatted)}</span></li>
                    </ul>
                    <p class="text-xs text-blue-700 mt-2">Pastikan jumlah transfer sesuai.</p>
                </div>

                <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p class="font-bold text-yellow-800 mb-2 text-sm"><i class="fas fa-whatsapp mr-2"></i>Konfirmasi Pembayaran:</p>
                    <p class="text-xs text-yellow-700">Setelah transfer, kirim bukti & ID Transaksi ke WA kami:</p>
                    <p class="text-yellow-700 mt-2">**<a href="https://wa.me/6285211306398" target="_blank" class="text-green-600 hover:underline">085211306398</a>**</p>
                    <p class="text-xs text-yellow-700 mt-2">E-book akan dikirim ke email <strong>${DOMPurify.sanitize(payload.email)}</strong> setelah konfirmasi.</p>
                </div>
            `;

            showToast('Pesanan berhasil dicatat!', 'success');
            clearCart(); // Kosongkan keranjang setelah pesanan berhasil
            checkoutForm.reset(); // Reset form
        } else {
            throw new Error(result.message || 'Gagal memproses pesanan.');
        }
    } catch (error) {
        console.error('Error saat checkout:', error);
        orderStatusDiv.innerHTML = `<p class="text-red-600 font-bold">Gagal memproses pesanan: ${DOMPurify.sanitize(error.message)}</p>`;
        showToast('Terjadi kesalahan saat checkout. Coba lagi.', 'error');
    } finally {
        // Kembalikan status tombol
        submitOrderBtn.disabled = false;
        orderSubmitText.classList.remove('hidden');
        orderSubmitSpinner.classList.add('hidden');
    }
});

// --- LOGIKA SUBMIT NEWSLETTER ---
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = newsletterEmailInput.value.trim();
        const nama = newsletterNameInput ? newsletterNameInput.value.trim() : '';

        if (!email) {
            newsletterStatusDiv.innerHTML = '<p class="text-red-600 font-bold">Email untuk newsletter wajib diisi.</p>';
            return;
        }

        newsletterSubmitBtn.disabled = true;
        newsletterStatusDiv.innerHTML = '<p class="text-blue-600">Mendaftarkan email Anda...</p>';

        try {
            const response = await fetch(NEWSLETTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({ email: email, name: nama })
            });
            const result = await response.json();

            if (result.status === 'sukses') {
                newsletterStatusDiv.innerHTML = `<p class="text-green-600 font-bold">${DOMPurify.sanitize(result.message)}</p>`;
                showToast(result.message, 'success');
                newsletterForm.reset(); // Reset form newsletter
            } else {
                throw new Error(result.message || 'Gagal mendaftar newsletter.');
            }
        } catch (error) {
            console.error('Error saat submit newsletter:', error);
            newsletterStatusDiv.innerHTML = `<p class="text-red-600 font-bold">Gagal mendaftar: ${DOMPurify.sanitize(error.message)}</p>`;
            showToast('Terjadi kesalahan saat mendaftar newsletter. Coba lagi.', 'error');
        } finally {
            newsletterSubmitBtn.disabled = false;
        }
    });
}


// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    loadBooksAndCategories(); // Muat data saat halaman pertama kali dimuat

    // Muat keranjang dari localStorage saat halaman dimuat
    const storedCart = localStorage.getItem('shoppingCart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCartDisplay(); // Inisialisasi tampilan keranjang
});