import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, setDoc
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
const auth = getAuth(app);
const db = getFirestore(app);

const loginContainer = document.getElementById('loginContainer');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const toggle = document.getElementById('toggle');
const avgEl = document.getElementById('avg');
const tbody = document.querySelector('#table tbody');
const chartCtx = document.getElementById('chart').getContext('2d');

let chart;
let currentComments = [];

// Авторизація
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Користувач увійшов
    loginContainer.style.display = 'none';
    adminContent.style.display = 'block';
    loadStatus();
    // Запуск слухача відгуків
    startListening();
  } else {
    // Користувач не увійшов
    loginContainer.style.display = 'block';
    adminContent.style.display = 'none';
    // Зупинити слухача відгуків
    stopListening();
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = '';
  } catch (error) {
    loginError.textContent = 'Помилка входу: ' + error.message;
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Помилка виходу:', error);
  }
});

// функція оновлення статусу тумблера із БД
async function loadStatus() {
  const ref = doc(db, 'settings', 'meta');
  const snap = await getDoc(ref);
  const enabled = snap.exists() ? snap.data().feedbackEnabled : true;
  toggle.checked = !!enabled;
}

// перемикання (встановлює у Firestore)
toggle.addEventListener('change', async () => {
  const ref = doc(db, 'settings', 'meta');
  try {
    await setDoc(ref, { feedbackEnabled: toggle.checked }, { merge: true });
  } catch (e) { console.error(e); alert('Не вдалося змінити статус'); }
});

let unsubscribe; // для відписки від слухача

function startListening() {
  const q = query(collection(db, 'feedbacks'), orderBy('timestamp', 'desc'));
  unsubscribe = onSnapshot(q, snapshot => {
    const rows = [];
    const counts = [0,0,0,0,0]; // індекси 0->1,1->2...
    let sum = 0, n = 0;

    tbody.innerHTML = '';
    currentComments = []; // Очистити коментарі для AI
    snapshot.forEach(doc => {
      const d = doc.data();
      const rating = d.rating || 0;
      const comment = d.comment || '';
      const ts = d.timestamp ? d.timestamp.toDate().toISOString().replace('T',' ').slice(0,19) : '';
      rows.push({rating,comment,ts});

      if (rating >=1 && rating <=5) {
        counts[rating-1] += 1;
        sum += rating;
        n++;
      }

      // Зібрати коментарі для AI
      if (d.comment && d.comment.trim() !== '') {
        currentComments.push(`Оцінка: ${d.rating}, Коментар: "${d.comment}"`);
      }
    });

    // таблиця
    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="${r.rating < 3 ? 'text-red' : r.rating > 3 ? 'text-green' : 'text-yellow'}">${r.rating}</td><td>${escapeHtml(r.comment)}</td><td>${r.ts}</td>`;
      tbody.appendChild(tr);
    }

    const avg = n ? (sum / n).toFixed(2) : '—';
    avgEl.textContent = `Середня: ${avg}`;

    // оновити діаграму
    const labels = ['1','2','3','4','5'];
    const data = counts;
    if (!chart) {
      chart = new Chart(chartCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Кількість оцінок', data }]
        },
        options: { responsive:true, maintainAspectRatio:false }
      });
    } else {
      chart.data.datasets[0].data = data;
      chart.update();
    }
  });
}

function stopListening() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

// escape HTML для безпеки простого відображення
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ==========================================
// ІНТЕГРАЦІЯ AI АГЕНТА (Google Gemini API - БЕЗКОШТОВНО)
// ==========================================
const aiBtn = document.getElementById('aiBtn');
const aiSummary = document.getElementById('aiSummary');

aiBtn.addEventListener('click', async () => {
  const maxComments = 50;
  const commentsToAnalyze = currentComments.slice(0, maxComments);

  if (commentsToAnalyze.length === 0) {
    aiSummary.textContent = "Немає текстових коментарів для аналізу.";
    return;
  }

  aiBtn.disabled = true;
  aiSummary.innerHTML = "<em>Аналізую відгуки... Це може зайняти 10-15 секунд...</em>";

  // ТВІЙ КЛЮЧ
  const apiKey = "AIzaSyA1kW_0Pz_gxY4oR7YiWzVGn_EPTpSByk8"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Ти помічник викладача. Проаналізуй наступні відгуки студентів про пару. 
  Зроби дуже коротке резюме (3-4 речення). Виділи головні плюси та мінуси, якщо вони є.
  Відгуки:\n` + commentsToAnalyze.join('\n');

  let retries = 3;
  let success = false;

  while (retries > 0 && !success) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // ДОДАНО: Перевірка на Too Many Requests на рівні HTTP-статусу
      if (response.status === 429) {
        throw new Error("TOO_MANY_REQUESTS");
      }

      const data = await response.json();
      
      // ДОДАНО: Перевірка на Too Many Requests на рівні тіла помилки API
      if (data.error) {
        if (data.error.code === 429 || data.error.status === "RESOURCE_EXHAUSTED") {
           throw new Error("TOO_MANY_REQUESTS");
        }
        throw new Error(data.error.message);
      }

      const aiText = data.candidates[0].content.parts[0].text;
      aiSummary.innerHTML = aiText.replace(/\n/g, '<br>'); 
      success = true; 

    } catch (err) {
      // Якщо це помилка ліміту запитів — зупиняємо цикл і виводимо повідомлення
      if (err.message === "TOO_MANY_REQUESTS") {
        aiSummary.innerHTML = "<strong style='color: #dc3545;'>Увага:</strong> На даний момент кількість запитів до штучного інтелекту перевищена (Too Many Requests). Будь ласка, зачекайте 1-2 хвилини і спробуйте ще раз.";
        break; // Перериваємо цикл while (повторних спроб не буде)
      }

      retries--;
      console.warn(`Спроба невдала. Залишилось спроб: ${retries}`, err);

      if (retries === 0) {
        if (err.name === 'AbortError') {
          aiSummary.textContent = "Помилка: Сервер AI довго не відповідав (Тайм-аут). Спробуйте пізніше.";
        } else {
          aiSummary.textContent = "Сталася помилка при зверненні до AI: " + err.message;
        }
      } else {
        // Якщо це будь-яка ІНША помилка (наприклад, збій мережі), робимо повторну спробу
        aiSummary.innerHTML = `<em>Сервер перевантажений. Автоматична повторна спроба... (Залишилось: ${retries})</em>`;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  aiBtn.disabled = false;
});