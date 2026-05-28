import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [input, setInput] = useState('')
  const [initialState] = useState(() => {
    try {
      const storedState = localStorage.getItem('todoAppState')
      return storedState ? JSON.parse(storedState) : null
    } catch (error) {
      console.error('localStorage parse error', error)
      return null
    }
  })

  const [todosByDate, setTodosByDate] = useState(() => {
    return initialState?.todosByDate ?? {}
  })
  const [weekTodosByWeek, setWeekTodosByWeek] = useState(() => {
    return initialState?.weekTodosByWeek ?? {}
  })
  const [activeTab, setActiveTab] = useState(() => initialState?.activeTab ?? 'TODAY')
  const [selectedDate, setSelectedDate] = useState(() => {
    return initialState?.selectedDate ?? toLocalISODate(new Date())
  })
  const [nextTodoId, setNextTodoId] = useState(() => {
    const dateTodos = initialState?.todosByDate
      ? Object.values(initialState.todosByDate).flat()
      : []
    const weekTodos = initialState?.weekTodosByWeek
      ? Object.values(initialState.weekTodosByWeek).flat()
      : []
    const maxId = [...dateTodos, ...weekTodos].reduce(
      (max, item) => Math.max(max, item?.id ?? -1), -1
    )
    return maxId + 1
  })
  const [calendarExpanded, setCalendarExpanded] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [activeIcon, setActiveIcon] = useState(null)
  const [timer, setTimer] = useState(() => initialState?.timer ?? 0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [stopwatch, setStopwatch] = useState(() => initialState?.stopwatch ?? 0)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
  const [timerEditUnit, setTimerEditUnit] = useState(null)
  const [timerEditValue, setTimerEditValue] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)

  function toLocalISODate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function getWeekKey(dateISO) {
    const d = new Date(dateISO + 'T00:00:00')
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setDate(d.getDate() + diff)
    return toLocalISODate(monday)
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleTimerUnitClick = (unit) => {
    if (isTimerRunning) return
    const currentVal = {
      h: Math.floor(timer / 3600),
      m: Math.floor((timer % 3600) / 60),
      s: timer % 60,
    }
    setTimerEditUnit(unit)
    setTimerEditValue(String(currentVal[unit]))
  }

  const applyTimerEdit = () => {
    const num = parseInt(timerEditValue, 10)
    if (!isNaN(num) && num >= 0) {
      const h = Math.floor(timer / 3600)
      const m = Math.floor((timer % 3600) / 60)
      const s = timer % 60
      if (timerEditUnit === 'h') setTimer(Math.min(99, num) * 3600 + m * 60 + s)
      else if (timerEditUnit === 'm') setTimer(h * 3600 + Math.min(59, num) * 60 + s)
      else if (timerEditUnit === 's') setTimer(h * 3600 + m * 60 + Math.min(59, num))
    }
    setTimerEditUnit(null)
    setTimerEditValue('')
  }

  const parseTodoInput = (text) => {
    const match = text.trim().match(/^(\d{1,2})월\s*(\d{1,2})일\s+(.+)$/)
    if (!match) return { text: text.trim(), dueDate: null }

    const month = parseInt(match[1])
    const day = parseInt(match[2])
    const taskText = match[3].trim()

    const todayISO = toLocalISODate(new Date())
    let year = new Date().getFullYear()
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    if (`${year}-${mm}-${dd}` < todayISO) year += 1

    return { text: taskText, dueDate: `${year}-${mm}-${dd}` }
  }

  const formatDueDate = (isoDate) => {
    const [, m, d] = isoDate.split('-')
    return `${parseInt(m)}월 ${parseInt(d)}일`
  }

  const getSortedTodos = (todos) => {
    const undone = todos.filter((t) => !t.done)
    const done = todos.filter((t) => t.done)
    const withDate = undone.filter((t) => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    const withoutDate = undone.filter((t) => !t.dueDate)
    return [...withDate, ...withoutDate, ...done]
  }

  const weekKey = getWeekKey(selectedDate)
  const currentTodos = activeTab === 'TODAY'
    ? (todosByDate[selectedDate] ?? [])
    : (weekTodosByWeek[weekKey] ?? [])

  useEffect(() => {
    localStorage.setItem(
      'todoAppState',
      JSON.stringify({ todosByDate, weekTodosByWeek, activeTab, selectedDate, timer, stopwatch })
    )
  }, [todosByDate, weekTodosByWeek, activeTab, selectedDate, timer, stopwatch])

  useEffect(() => {
    let interval = null
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    } else if (isTimerRunning && timer === 0) {
      setIsTimerRunning(false)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timer])

  useEffect(() => {
    let interval = null
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatch((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStopwatchRunning])

  const handleAddTodo = () => {
    if (input.trim()) {
      const { text, dueDate } = parseTodoInput(input)
      const newItem = { id: nextTodoId, text, dueDate, done: false }
      if (activeTab === 'TODAY') {
        setTodosByDate((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] ?? []), newItem],
        }))
      } else {
        setWeekTodosByWeek((prev) => ({
          ...prev,
          [weekKey]: [...(prev[weekKey] ?? []), newItem],
        }))
      }
      setNextTodoId((id) => id + 1)
      setInput('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTodo()
    }
  }

  const updateTodos = (newTodos) => {
    if (activeTab === 'TODAY') {
      setTodosByDate((prev) => ({ ...prev, [selectedDate]: newTodos }))
    } else {
      setWeekTodosByWeek((prev) => ({ ...prev, [weekKey]: newTodos }))
    }
  }

  const handleRemoveTodo = (id) => {
    updateTodos(currentTodos.filter((item) => item.id !== id))
  }

  const toggleTodoDone = (id) => {
    updateTodos(currentTodos.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    ))
  }

  const handleDragStart = (id) => {
    setDraggingId(id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragOver = (e, id) => {
    e.preventDefault()
    if (draggingId === null || draggingId === id) return
    setDragOverId(id)
  }

  const handleDrop = (e, id) => {
    e.preventDefault()
    if (draggingId === null || draggingId === id) return

    const dragIndex = currentTodos.findIndex((item) => item.id === draggingId)
    const dropIndex = currentTodos.findIndex((item) => item.id === id)
    if (dragIndex === -1 || dropIndex === -1) return

    const nextTodos = [...currentTodos]
    const [draggedItem] = nextTodos.splice(dragIndex, 1)
    nextTodos.splice(dropIndex, 0, draggedItem)
    updateTodos(nextTodos)
    handleDragEnd()
  }

  const handleMoveToWeek = (todo) => {
    const newItem = { ...todo, id: nextTodoId }
    setWeekTodosByWeek((prev) => ({
      ...prev,
      [weekKey]: [...(prev[weekKey] ?? []), newItem],
    }))
    setNextTodoId((id) => id + 1)
    setOpenMenuId(null)
  }

  const handleMoveToTomorrow = (todo) => {
    const tomorrow = new Date(selectedDate + 'T00:00:00')
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = toLocalISODate(tomorrow)
    setTodosByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] ?? []).filter((t) => t.id !== todo.id),
      [tomorrowISO]: [...(prev[tomorrowISO] ?? []), todo],
    }))
    setOpenMenuId(null)
  }

  const handleMoveToToday = (todo) => {
    const newItem = { ...todo, id: nextTodoId }
    setTodosByDate((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] ?? []), newItem],
    }))
    setNextTodoId((id) => id + 1)
    setOpenMenuId(null)
  }

  const handleMoveToNextWeek = (todo) => {
    const monday = new Date(weekKey + 'T00:00:00')
    monday.setDate(monday.getDate() + 7)
    const nextWeekKey = toLocalISODate(monday)
    setWeekTodosByWeek((prev) => ({
      ...prev,
      [weekKey]: (prev[weekKey] ?? []).filter((t) => t.id !== todo.id),
      [nextWeekKey]: [...(prev[nextWeekKey] ?? []), todo],
    }))
    setOpenMenuId(null)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(toLocalISODate(date))
    setActiveTab('TODAY')
  }

  const today = new Date()
  const currentDate = new Date(selectedDate + 'T00:00:00')
  const calendarYear = currentDate.getFullYear()
  const calendarMonth = currentDate.getMonth()

  const tabLabel = (() => {
    if (activeTab === 'TODAY') {
      return `${calendarYear}년 ${calendarMonth + 1}월 ${currentDate.getDate()}일`
    }
    const monday = new Date(weekKey + 'T00:00:00')
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return `${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${sunday.getMonth() + 1}월 ${sunday.getDate()}일`
  })()

  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return date
  })

  const monthStart = new Date(calendarYear, calendarMonth, 1)
  const monthEnd = new Date(calendarYear, calendarMonth + 1, 0)
  const monthDays = monthEnd.getDate()
  const monthStartDay = monthStart.getDay()
  const monthCells = []
  for (let i = 0; i < monthStartDay; i += 1) {
    monthCells.push(null)
  }
  for (let day = 1; day <= monthDays; day += 1) {
    monthCells.push(new Date(calendarYear, calendarMonth, day))
  }
  while (monthCells.length % 7 !== 0) {
    monthCells.push(null)
  }

  const renderCalendar = () => (
    <div className="calendar-card">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav-button"
          onClick={() => {
            const newDate = new Date(selectedDate + 'T00:00:00')
            newDate.setMonth(newDate.getMonth() - 1)
            setSelectedDate(toLocalISODate(newDate))
          }}
        >
          ‹
        </button>
        <div className="calendar-title">{`${calendarYear}년 ${calendarMonth + 1}월`}</div>
        <button
          type="button"
          className="calendar-nav-button"
          onClick={() => {
            const newDate = new Date(selectedDate + 'T00:00:00')
            newDate.setMonth(newDate.getMonth() + 1)
            setSelectedDate(toLocalISODate(newDate))
          }}
        >
          ›
        </button>
      </div>
      {!calendarExpanded ? (
        <div className="calendar-weekly">
          <div className="calendar-row calendar-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
          </div>
          <div className="calendar-row calendar-dates">
            {weekDates.map((date) => {
              const isoDate = toLocalISODate(date)
              return (
                <button
                  key={isoDate}
                  type="button"
                  className={`calendar-date ${date.toDateString() === today.toDateString() ? 'today' : ''} ${isoDate === selectedDate ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(date)}
                >
                  <div className="date-number">{date.getDate()}</div>
                </button>
              )
            })}
          </div>
          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-toggle-button"
              onClick={() => {
                setCalendarExpanded(true)
                setSelectedDate(toLocalISODate(new Date()))
              }}
            >
              +
            </button>
          </div>
        </div>
      ) : (
        <div className="calendar-full">
          <div className="calendar-row calendar-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {monthCells.map((date, index) => {
              const isoDate = date ? toLocalISODate(date) : null
              return (
                <button
                  key={`${index}-${isoDate ?? 'empty'}`}
                  type="button"
                  className={`calendar-cell ${date?.toDateString() === today.toDateString() ? 'today' : ''} ${isoDate === selectedDate ? 'selected' : ''}`}
                  onClick={() => date && handleDateSelect(date)}
                  disabled={!date}
                >
                  {date ? date.getDate() : ''}
                </button>
              )
            })}
          </div>
          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-toggle-button"
              onClick={() => {
                setCalendarExpanded(false)
                setSelectedDate(toLocalISODate(new Date()))
              }}
            >
              -
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderTimerStopwatch = () => {
    const timerH = Math.floor(timer / 3600)
    const timerM = Math.floor((timer % 3600) / 60)
    const timerS = timer % 60

    const renderUnit = (unit, value, max) => {
      if (timerEditUnit === unit) {
        return (
          <input
            key={unit}
            className="timer-unit-input"
            type="number"
            min="0"
            max={max}
            value={timerEditValue}
            onChange={(e) => setTimerEditValue(e.target.value)}
            onBlur={applyTimerEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyTimerEdit()
              if (e.key === 'Escape') { setTimerEditUnit(null); setTimerEditValue('') }
            }}
            autoFocus
          />
        )
      }
      return (
        <span key={unit} className="timer-unit" onClick={() => handleTimerUnitClick(unit)}>
          {String(value).padStart(2, '0')}
        </span>
      )
    }

    return (
    <div className="timer-stopwatch">
      <div className="timer-section">
        <h3>타이머</h3>
        <div className="timer-display">
          {renderUnit('h', timerH, 99)}
          <span className="timer-sep">:</span>
          {renderUnit('m', timerM, 59)}
          <span className="timer-sep">:</span>
          {renderUnit('s', timerS, 59)}
        </div>
        <div className="timer-controls">
          <button className="button" onClick={() => setIsTimerRunning(!isTimerRunning)}>
            {isTimerRunning ? '정지' : '시작'}
          </button>
          <button className="button" onClick={() => { setTimer(0); setIsTimerRunning(false) }}>
            리셋
          </button>
        </div>
      </div>
      <div className="stopwatch-section">
        <h3>스톱워치</h3>
        <div className="stopwatch-display">{formatTime(stopwatch)}</div>
        <div className="stopwatch-controls">
          <button className="button" onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}>
            {isStopwatchRunning ? '정지' : '시작'}
          </button>
          <button className="button" onClick={() => { setStopwatch(0); setIsStopwatchRunning(false) }}>
            리셋
          </button>
        </div>
      </div>
    </div>
  )
  }

  const renderContent = () => {
    const sortedTodos = getSortedTodos(currentTodos)
    return (
      <>
        <div className="input-container">
          <input
            type="text"
            className="input"
            placeholder="TO-DO"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="button" onClick={handleAddTodo}>
            입력
          </button>
        </div>
        <div className="todo-list">
          {sortedTodos.map((todo) => (
            <div
              key={todo.id}
              className={`todo-item ${dragOverId === todo.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, todo.id)}
              onDrop={(e) => handleDrop(e, todo.id)}
            >
              <button
                type="button"
                className={`checkbox-button ${todo.done ? 'checked' : ''}`}
                onClick={() => toggleTodoDone(todo.id)}
                aria-label={todo.done ? '완료 취소' : '완료 표시'}
              >
                {todo.done ? '☑' : '□'}
              </button>
              <span className={`todo-text ${todo.done ? 'completed' : ''}`}>
                {todo.text}
                {todo.dueDate && (
                  <span className="todo-due-date"> / {formatDueDate(todo.dueDate)}</span>
                )}
              </span>
              <div className="todo-actions">
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => handleRemoveTodo(todo.id)}
                  aria-label="삭제"
                >
                  🗑
                </button>
                <button
                  type="button"
                  className="drag-handle"
                  draggable
                  onDragStart={() => handleDragStart(todo.id)}
                  onDragEnd={handleDragEnd}
                  aria-label="순서 이동"
                >
                  🟰
                </button>
                <div className="move-menu-container">
                  <button
                    type="button"
                    className="move-menu-trigger"
                    onClick={() => setOpenMenuId(openMenuId === todo.id ? null : todo.id)}
                    aria-label="이동"
                  >
                    ➕
                  </button>
                  {openMenuId === todo.id && (
                    <div className="move-menu-dropdown">
                      {activeTab === 'TODAY' ? (
                        <>
                          <button type="button" onClick={() => handleMoveToWeek(todo)}>
                            → WEEK
                          </button>
                          <button type="button" onClick={() => handleMoveToTomorrow(todo)}>
                            → TOMORROW
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => handleMoveToToday(todo)}>
                            → TODAY
                          </button>
                          <button type="button" onClick={() => handleMoveToNextWeek(todo)}>
                            → NEXT WEEK
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="app">
      <div className="card">
        {renderCalendar()}
        <div className="icon-buttons">
          <button
            type="button"
            className={`icon-button ${activeIcon === 'document' ? 'active' : ''}`}
            onClick={() => setActiveIcon(activeIcon === 'document' ? null : 'document')}
          >
            📄
          </button>
          <button
            type="button"
            className={`icon-button ${activeIcon === 'clock' ? 'active' : ''}`}
            onClick={() => setActiveIcon(activeIcon === 'clock' ? null : 'clock')}
          >
            🕛
          </button>
        </div>
        {activeIcon !== 'clock' && (
          <div className="tabs">
            {['TODAY', 'WEEK'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
        {activeIcon !== 'clock' && (
          <>
            <h1 className="title">TO-DO</h1>
            <p className="tab-label">{tabLabel}</p>
          </>
        )}
        {activeIcon === 'clock' ? renderTimerStopwatch() : renderContent()}
      </div>
    </div>
  )
}

export default App
