// <!-- Данные из Google Таблиц на вашем сайте https://habr.com/ru/companies/englishdom/articles/343082/ -->
const calendar = document.getElementById('calendar');
  const monthInput = document.getElementById('month');
  const csvFileInput = document.getElementById('csvFile');
  const schedule = document.getElementById('schedule');
  const bookingForm = document.getElementById('bookingForm');
  const clientNameInput = document.getElementById('clientName');
  const clientPhoneInput = document.getElementById('clientPhone');
  const saveBookingButton = document.getElementById('saveBooking');
  const cancelBookingButton = document.getElementById('cancelBooking');

  let bookedData = {};
  let employees = new Set();
  let selectedDate = null;
  let selectedTime = null;

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  csvFileInput.addEventListener('change', handleCSVUpload);

  // Функція для обробки завантаження CSV файлу
  function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        parseCSV(csvData);
        const [year, month] = monthInput.value.split('-').map(Number);
        generateCalendar(year, month - 1);
      };
      reader.readAsText(file, "utf-8");
    }
  }

  // Функція для перевірки коректності дати
  function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  }

  // Функція для парсингу CSV даних
  function parseCSV(data) {
    const lines = data.trim().split('\n');
    bookedData = {};
    employees.clear();

    lines.forEach(line => {
      const [date, person, time] = line.split(',').map(item => item.trim());
      if (isValidDate(date) && person && time) {
        employees.add(person);
        if (!bookedData[date]) {
          bookedData[date] = {};
        }
        if (!bookedData[date][person]) {
          bookedData[date][person] = [];
        }
        bookedData[date][person].push(time);
      }
    });
  }

  // Функція для парсингу даних з Google Диску
  function parseGoogleDriveData(data) {
    bookedData = {};
    employees.clear();

    data.forEach(item => {
      const [date, person, time] = item.map(str => str.trim());
      if (isValidDate(date) && person && time) {
        employees.add(person);
        if (!bookedData[date]) {
          bookedData[date] = {};
        }
        if (!bookedData[date][person]) {
          bookedData[date][person] = [];
        }
        bookedData[date][person].push(time);
      }
    });
  }

  // Функція для завантаження даних з Google Диску
  function loadGoogleDriveData() {
    const app = "https://script.google.com/macros/s/AKfycbyM7-YoerClRSGKfCVQ3bhcL_3HctdJsxZnCbOIKGyltGm4ErvHYxZvoKQEnAjM6SsL/exec";
    fetch(app)
      .then(response => response.json())
      .then(data => {
        parseGoogleDriveData(data.result);
        const [year, month] = monthInput.value.split('-').map(Number);
        generateCalendar(year, month - 1);
      })
      .catch(error => console.error("Error loading Google Drive data:", error));
  }

  // Функція для генерації календаря
  function generateCalendar(year, month) {
    calendar.innerHTML = '';
    schedule.innerHTML = '';

    weekdays.forEach(day => {
      const header = document.createElement('div');
      header.textContent = day;
      header.classList.add('header');
      calendar.appendChild(header);
    });

    const firstDay = new Date(Date.UTC(year, month, 1)).getDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getDate();
    const offset = (firstDay === 0 ? 6 : firstDay - 1);

    const totalCells = Math.ceil((daysInMonth + offset) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      const day = i - offset + 1;

      if (day > 0 && day <= daysInMonth) {
        const date = new Date(Date.UTC(year, month, day));
        const dateString = date.toISOString().split('T')[0];

        cell.textContent = day;
        cell.classList.add('day');

        if (dateString === new Date().toISOString().split('T')[0]) {
          cell.classList.add('today');
        }

        if (dateString === selectedDate) {
          cell.classList.add('selected');
        }

        if (bookedData[dateString]) {
          cell.classList.add('booked');
          cell.title = 'Click to view schedule';
          cell.addEventListener('click', () => displaySchedule(dateString));
        } else {
          cell.classList.add('available');
          cell.title = 'Click to book';
          cell.addEventListener('click', () => openBookingForm(dateString));
        }
      }

      calendar.appendChild(cell);
    }
  }

  // Функція для відображення розкладу
  function displaySchedule(date) {
    schedule.innerHTML = `<h3>Schedule for ${date}</h3>`;
    const data = bookedData[date];

    const table = document.createElement('table');
    let headerRow = `<tr><th>Time</th>`;
    employees.forEach(person => {
      headerRow += `<th>${person}</th>`;
    });
    headerRow += `</tr>`;
    table.innerHTML = headerRow;

    const times = generateTimes();

    times.forEach(time => {
      let row = `<tr><td>${time}</td>`;
      employees.forEach(person => {
        const status = data && data[person] && data[person].includes(time) ? 'Зайнято' : 'Вільно';
        row += `<td><button class="status-button ${status === 'Зайнято' ? 'busy' : status === 'Бронь' ? 'reserved' : 'free'} ${status !== 'Вільно' ? 'disabled' : ''}" data-person="${person}" data-time="${time}" data-status="${status}">${status}</button></td>`;
      });
      row += `</tr>`;
      table.innerHTML += row;
    });

    schedule.appendChild(table);

    // Додавання події для зміни статусу
    const statusButtons = table.querySelectorAll('.status-button');
    statusButtons.forEach(button => {
      button.addEventListener('click', () => {
        const currentStatus = button.getAttribute('data-status');

        // Дозволити змінювати тільки статус "Вільно" на "Бронь" і навпаки
        if (currentStatus === 'Вільно' || currentStatus === 'Бронь') {
          const newStatus = currentStatus === 'Вільно' ? 'Бронь' : 'Вільно';

          button.textContent = newStatus;
          button.setAttribute('data-status', newStatus);
          button.classList.remove('free', 'busy', 'reserved');
          button.classList.add(newStatus === 'Вільно' ? 'free' : 'reserved');
        }
      });
    });
  }

  // Функція для генерації часу
  function generateTimes() {
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return times;
  }

  // Відкриття форми бронювання
  function openBookingForm(date) {
    selectedDate = date;
    displaySchedule(date); // відображаємо розклад для вибраної дати
    bookingForm.style.display = 'block';
  }

  // Закриття форми бронювання
  cancelBookingButton.addEventListener('click', () => {
    bookingForm.style.display = 'none';
    clientNameInput.value = '';
    clientPhoneInput.value = '';
  });

  // Збереження бронювання
  saveBookingButton.addEventListener('click', () => {
    const clientName = clientNameInput.value.trim();
    const clientPhone = clientPhoneInput.value.trim();

    if (clientName && clientPhone) {
      // Додання бронювання до локальних даних
      if (!bookedData[selectedDate]) {
        bookedData[selectedDate] = {};
      }
      if (!bookedData[selectedDate][clientName]) {
        bookedData[selectedDate][clientName] = [];
      }
      bookedData[selectedDate][clientName].push({ time: selectedTime, phone: clientPhone, status: 'Бронь' });

      // Закриття форми бронювання
      bookingForm.style.display = 'none';
      clientNameInput.value = '';
      clientPhoneInput.value = '';

      // Оновлення календаря
      const [year, month] = monthInput.value.split('-').map(Number);
      generateCalendar(year, month - 1);

      // Збереження даних у Google Диск або CSV (при використанні Google Apps Script)
      saveBookingToGoogleDrive(selectedDate, clientName, selectedTime, clientPhone);
    } else {
      alert('Будь ласка, введіть ім\'я та телефон.');
    }
  });

  // Функція для збереження бронювання до Google Диску
  function saveBookingToGoogleDrive(date, name, time, phone) {
    const app = "https://script.google.com/macros/s/YOUR_GOOGLE_APPS_SCRIPT_ID/exec";
    const bookingData = {
      date: date,
      name: name,
      time: time,
      phone: phone
    };

    fetch(app, {
      method: 'POST',
      body: JSON.stringify(bookingData),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Booking saved:', data);
    })
    .catch(error => {
      console.error('Error saving booking:', error);
    });
  }

  // Ініціалізація календаря при завантаженні сторінки
  window.addEventListener('DOMContentLoaded', () => {
    loadGoogleDriveData(); // Завантажуємо дані з Google Диску за замовчуванням
    const today = new Date();
    generateCalendar(today.getFullYear(), today.getMonth());
    monthInput.addEventListener('change', () => {
      const [year, month] = monthInput.value.split('-').map(Number);
      generateCalendar(year, month - 1);
    });
  });