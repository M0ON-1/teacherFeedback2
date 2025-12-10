import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
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
const db = getFirestore(app);

const toggle = document.getElementById('toggle');
const avgEl = document.getElementById('avg');
const tbody = document.querySelector('#table tbody');
const chartCtx = document.getElementById('chart').getContext('2d');

let chart;

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

// слухаємо колекцію feedbacks у реальному часі
const q = query(collection(db, 'feedbacks'), orderBy('timestamp', 'desc'));
onSnapshot(q, snapshot => {
  const rows = [];
  const counts = [0,0,0,0,0]; // індекси 0->1,1->2...
  let sum = 0, n = 0;

  tbody.innerHTML = '';
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

// escape HTML для безпеки простого відображення
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

loadStatus();
