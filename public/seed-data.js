/**
 * Скрипт для додавання тестових даних до Firestore
 * 
 * ВИКОРИСТАННЯ:
 * 1. Відкрийте index.html або admin.html у браузері
 * 2. Відкрийте консоль (F12 → Console)
 * 3. Копіюйте весь код цього файлу
 * 4. Вставте в консоль та натисніть Enter
 * 5. Зачекайте повідомлення "Готово!"
 * 
 * Буде додано:
 * - 3 викладачи
 * - 9 предметів (3 на кожного)
 * - 15 приклад відгуків для тестування
 */

// === ЧАСТИНА 1: ВИКЛАДАЧІ ===
const teachers = [
  {
    id: 'teacher_001',
    name: 'Олег Коваленко',
    email: 'oleg.kovalenko@university.edu'
  },
  {
    id: 'teacher_002',
    name: 'Ніна Петренко',
    email: 'nina.petrenko@university.edu'
  },
  {
    id: 'teacher_003',
    name: 'Максим Иванов',
    email: 'maksym.ivanov@university.edu'
  }
];

// === ЧАСТИНА 2: ПРЕДМЕТИ ===
const subjects = [
  // Предмети Олега Коваленко
  { name: 'JavaScript Основи', teacherId: 'teacher_001' },
  { name: 'React.js для веб-розробки', teacherId: 'teacher_001' },
  { name: 'Node.js та REST API', teacherId: 'teacher_001' },
  
  // Предмети Ніни Петренко
  { name: 'Python для Data Science', teacherId: 'teacher_002' },
  { name: 'Django Framework', teacherId: 'teacher_002' },
  { name: 'Machine Learning Вступ', teacherId: 'teacher_002' },
  
  // Предмети Максима Іванова
  { name: 'Java та ООП', teacherId: 'teacher_003' },
  { name: 'Spring Boot мікросервіси', teacherId: 'teacher_003' },
  { name: 'SQL та Бази Даних', teacherId: 'teacher_003' }
];

// === ФУНКЦІЯ ДЛЯ ДОДАВАННЯ ДАНИХ ===
async function seedDatabase() {
  try {
    console.log('🔄 Починаю додавання тестових даних...\n');
    
    // Додати викладачів
    console.log('👨‍🏫 Додаю викладачів...');
    for (const teacher of teachers) {
      await db.collection('teachers').doc(teacher.id).set({
        name: teacher.name,
        email: teacher.email
      });
      console.log(`  ✓ ${teacher.name}`);
    }
    
    // Додати предмети
    console.log('\n📚 Додаю предмети...');
    const subjectIds = {}; // Для збереження ID предметів
    
    for (const subject of subjects) {
      const docRef = await db.collection('subjects').add({
        name: subject.name,
        teacherId: subject.teacherId
      });
      subjectIds[subject.name] = docRef.id;
      console.log(`  ✓ ${subject.name}`);
    }
    
    // Додати приклади відгуків
    console.log('\n⭐ Додаю приклади відгуків для тестування...');
    
    const sampleFeedbacks = [
      // Для JavaScript Основи (teacher_001)
      { rating: 5, comment: 'Чудовий курс! Все дуже зрозуміло пояснено', 
        teacherId: 'teacher_001', subject: 'JavaScript Основи' },
      { rating: 4, comment: 'Добре, але можна більше практичних завдань', 
        teacherId: 'teacher_001', subject: 'JavaScript Основи' },
      { rating: 5, comment: 'Найкращий викладач JavaScript!', 
        teacherId: 'teacher_001', subject: 'JavaScript Основи' },
      
      // Для React.js
      { rating: 4, comment: 'Цікавий матеріал, трохи швидко', 
        teacherId: 'teacher_001', subject: 'React.js для веб-розробки' },
      { rating: 5, comment: 'React пояснено дуже детально', 
        teacherId: 'teacher_001', subject: 'React.js для веб-розробки' },
      
      // Для Python Data Science (teacher_002)
      { rating: 5, comment: 'Фантастичні пояснення, хороші практичні приклади', 
        teacherId: 'teacher_002', subject: 'Python для Data Science' },
      { rating: 3, comment: 'Нормально, але деякі теми складні', 
        teacherId: 'teacher_002', subject: 'Python для Data Science' },
      { rating: 4, comment: 'Хороший курс з хорошими приклад', 
        teacherId: 'teacher_002', subject: 'Python для Data Science' },
      
      // Для Django
      { rating: 5, comment: 'Найкраще вивчення Django в університеті!', 
        teacherId: 'teacher_002', subject: 'Django Framework' },
      { rating: 4, comment: 'Добре пояснено, але було б більше реальних проектів', 
        teacherId: 'teacher_002', subject: 'Django Framework' },
      
      // Для Java (teacher_003)
      { rating: 5, comment: 'ООП-концепції прояснені на прикладах', 
        teacherId: 'teacher_003', subject: 'Java та ООП' },
      { rating: 4, comment: 'Добре, але деякі теми було важко зрозуміти', 
        teacherId: 'teacher_003', subject: 'Java та ООП' },
      { rating: 5, comment: 'Потужний курс, здобув багато знань', 
        teacherId: 'teacher_003', subject: 'Java та ООП' },
      
      // Для Spring Boot
      { rating: 4, comment: 'Корисно для розробки мікросервісів', 
        teacherId: 'teacher_003', subject: 'Spring Boot мікросервіси' },
      { rating: 5, comment: 'Spring Boot став зрозумілим!', 
        teacherId: 'teacher_003', subject: 'Spring Boot мікросервіси' }
    ];
    
    for (const feedback of sampleFeedbacks) {
      const subjectId = subjectIds[feedback.subject];
      await db.collection('feedbacks').add({
        rating: feedback.rating,
        comment: feedback.comment,
        teacherId: feedback.teacherId,
        subjectId: subjectId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✓ Відгук: ${feedback.subject} (оцінка ${feedback.rating})`);
    }
    
    console.log('\n✅ Готово! Тестові дані успішно додані до Firestore');
    console.log('\n📋 Резюме:');
    console.log('  - Викладачів: 3');
    console.log('  - Предметів: 9');
    console.log('  - Відгуків: 15');
    console.log('\n🎉 Тепер ви можете:');
    console.log('  1. Відкрити index.html та вибрати викладача/предмет');
    console.log('  2. Відкрити admin.html та увійти як teacher_001, teacher_002 або teacher_003');
    console.log('\n💡 Нотатка: Для входу потребує реєстрації в Firebase Auth!');
    
  } catch (error) {
    console.error('❌ Помилка при додаванні даних:', error);
  }
}

// === ЗАПУСК ===
console.log('📝 Скрипт готовий. Запускаю seedDatabase()...\n');
seedDatabase();
