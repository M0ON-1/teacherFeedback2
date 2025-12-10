import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, doc, getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBj1xLyjUL-1r5JYLKMegwO9UWdKnmK9G8",
  authDomain: "teacherfeedback-fb629.firebaseapp.com",
  projectId: "teacherfeedback-fb629",
  storageBucket: "teacherfeedback-fb629.firebasestorage.app",
  messagingSenderId: "122928960162",
  appId: "1:122928960162:web:fae05648716078a4b5fdfb",
  measurementId: "G-NP8FX9095T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const statusEl = document.getElementById('status');
const form = document.getElementById('feedbackForm');
const msg = document.getElementById('msg');
const sendBtn = document.getElementById('sendBtn');

async function checkEnabled() {
  try {
    const settingsRef = doc(db, 'settings', 'meta');
    const snap = await getDoc(settingsRef);
    const enabled = snap.exists() ? snap.data().feedbackEnabled : true;
    checkFeedbackGiven(); // Закоментувати, якщо потрібно дозволити повторні відгуки
    if (!enabled) {
      statusEl.textContent = 'Збір відгуків тимчасово вимкнено.';
      form.querySelectorAll('input,textarea,button').forEach(el => el.disabled = true);
      sendBtn.disabled = true;
    } else {
      statusEl.textContent = 'Збір відгуків активний.';
    }
  } catch (e) {
    console.error(e);
    statusEl.textContent = 'Не вдалося перевірити статус (перевірте конфіг).';
  }
}

function checkFeedbackGiven() {
  const given = localStorage.getItem('feedbackGiven');
  if (given) {
    form.querySelectorAll('input,textarea,button').forEach(el => el.disabled = true);
    sendBtn.disabled = true;
    msg.textContent = 'Ви вже надали відгук. Дякуємо!';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  sendBtn.disabled = true;
  const rating = Number(form.rating.value || 5);
  const comment = document.getElementById('comment').value.trim();

  if (!rating || rating < 1 || rating > 5) {
    msg.textContent = 'Вкажіть оцінку від 1 до 5';
    sendBtn.disabled = false;
    return;
  }

  try {
    await addDoc(collection(db, 'feedbacks'), {
      rating,
      comment,
      timestamp: serverTimestamp()
    });
    msg.textContent = 'Дякуємо! Ваш відгук відправлено.';
    form.reset();
    localStorage.setItem('feedbackGiven', 'true');
    checkFeedbackGiven();
  } catch (err) {
    console.error(err);
    msg.textContent = 'Помилка надсилання. Спробуйте пізніше.';
  } 
});

checkEnabled();
