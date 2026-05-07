import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where
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
const teacherSelect = document.getElementById('teacher-select');
const subjectSelect = document.getElementById('subject-select');

let selectedTeacherId = null;
let selectedSubjectId = null;

// Завантажити список викладачів
async function loadTeachers() {
  try {
    const teachersCollection = collection(db, 'teachers');
    const snapshot = await getDocs(teachersCollection);
    
    teacherSelect.innerHTML = '<option value="">-- Оберіть викладача --</option>';
    
    snapshot.forEach(doc => {
      const teacher = doc.data();
      const option = document.createElement('option');
      option.value = doc.id; // uid викладача
      option.textContent = teacher.name || 'Без імені';
      teacherSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Помилка завантаження викладачів:', err);
    statusEl.textContent = 'Помилка: не вдалося завантажити список викладачів';
  }
}

// Завантажити предмети для вибраного викладача
async function loadSubjectsForTeacher(teacherId) {
  try {
    if (!teacherId) {
      subjectSelect.innerHTML = '<option value="">-- Спочатку виберіть викладача --</option>';
      selectedSubjectId = null;
      return;
    }

    const subjectsRef = collection(db, 'subjects');
    const q = query(subjectsRef, where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);

    subjectSelect.innerHTML = '<option value="">-- Оберіть предмет --</option>';
    
    snapshot.forEach(doc => {
      const subject = doc.data();
      const option = document.createElement('option');
      option.value = doc.id; // id предмета
      option.textContent = subject.name || 'Без назви';
      subjectSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Помилка завантаження предметів:', err);
    subjectSelect.innerHTML = '<option value="">Помилка завантаження</option>';
  }
}

// Слухачі на зміну dropdown'ів
teacherSelect.addEventListener('change', (e) => {
  selectedTeacherId = e.target.value;
  loadSubjectsForTeacher(selectedTeacherId);
  selectedSubjectId = null;
  subjectSelect.value = '';
  checkFeedbackGiven(); // Перевірити блокування для нової комбінації
});

subjectSelect.addEventListener('change', (e) => {
  selectedSubjectId = e.target.value;
  checkFeedbackGiven(); // Перевірити блокування для нової комбінації
});

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
  if (!selectedTeacherId || !selectedSubjectId) {
    return; // Нічого не обиралось, не блокуємо
  }
  
  const feedbackKey = `feedbackGiven_${selectedTeacherId}_${selectedSubjectId}`;
  const given = localStorage.getItem(feedbackKey);
  if (given) {
    form.querySelectorAll('input,textarea,button').forEach(el => el.disabled = true);
    sendBtn.disabled = true;
    msg.textContent = 'Ви вже надали відгук цьому викладачу по цьому предмету. Дякуємо!';
  } else {
    form.querySelectorAll('input,textarea,button').forEach(el => el.disabled = false);
    sendBtn.disabled = false;
    msg.textContent = '';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Перевірка обрання викладача та предмета
  if (!selectedTeacherId || !selectedSubjectId) {
    msg.textContent = 'Виберіть викладача та предмет';
    return;
  }
  
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
      teacherId: selectedTeacherId,    // ✓ NEW
      subjectId: selectedSubjectId,    // ✓ NEW
      timestamp: serverTimestamp()
    });
    msg.textContent = 'Дякуємо! Ваш відгук відправлено.';
    form.reset();
    
    // Оновити localStorage з комбінацією викладач+предмет
    const feedbackKey = `feedbackGiven_${selectedTeacherId}_${selectedSubjectId}`;
    localStorage.setItem(feedbackKey, 'true');
    
    checkFeedbackGiven();
  } catch (err) {
    console.error(err);
    msg.textContent = 'Помилка надсилання. Спробуйте пізніше.';
  } 
});

checkEnabled();
loadTeachers(); // Завантажити викладачів при завантаженні сторінки
