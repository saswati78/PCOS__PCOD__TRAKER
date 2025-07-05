document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  let selectedDates = [];

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    events: '/api/calendar-events',
    eventDidMount: function (info) {
      if (info.event.extendedProps.type === 'active') {
        info.el.classList.add('period-day');
      } else if (info.event.extendedProps.type === 'predicted') {
        info.el.classList.add('predicted-period');
      }
    },
    // dateClick: function (info) {
    //   const dateStr = info.dateStr;

    //   const existing = selectedDates.indexOf(dateStr);
    //   if (existing !== -1) {
    //     selectedDates.splice(existing, 1);
    //     removeHighlight(dateStr);
    //   } else {
    //     selectedDates.push(dateStr);
    //     addHighlight(dateStr);
    //   }

    //   document.getElementById('selectedDates').value = JSON.stringify(selectedDates);
    // }

dateClick: function(info) {
  const clickedDate = new Date(info.dateStr);
  periodDates.length = 0; // Clear previous selections

  for (let i = 0; i < 5; i++) {
    const nextDate = new Date(clickedDate);
    nextDate.setDate(clickedDate.getDate() + i);
    const dateStr = nextDate.toISOString().split('T')[0];
    periodDates.push(dateStr);
  }

  // updatePeriodHighlighting();
}



  });

  calendar.render();

  function addHighlight(dateStr) {
    const cell = calendarEl.querySelector(`[data-date="${dateStr}"]`);
    if (cell) {
      const numberEl = cell.querySelector('.fc-daygrid-day-number');
      if (numberEl) numberEl.classList.add('selected-day');
    }
  }

  function removeHighlight(dateStr) {
    const cell = calendarEl.querySelector(`[data-date="${dateStr}"]`);
    if (cell) {
      const numberEl = cell.querySelector('.fc-daygrid-day-number');
      if (numberEl) numberEl.classList.remove('selected-day');
    }
  }

  // Optional: Hook up Save button
  const saveBtn = document.getElementById('saveDates');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
      try {
        const response = await fetch('/save-selected-dates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dates: selectedDates }),
        });
        const result = await response.json();
        alert(result.message || 'Saved!');
      } catch (err) {
        alert('Error saving dates.');
      }
    });
  }

  // Optional: Cancel button
  const cancelBtn = document.getElementById('cancelSelection');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      selectedDates.forEach(removeHighlight);
      selectedDates = [];
      document.getElementById('selectedDates').value = '[]';
    });
  }
});
