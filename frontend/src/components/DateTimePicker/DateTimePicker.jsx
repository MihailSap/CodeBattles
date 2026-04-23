import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DateTimePicker.css';

registerLocale('ru', ru);

const DatePickerPopperContainer = ({ children }) => {
  if (typeof document === 'undefined') {
    return children;
  }

  return createPortal(children, document.body);
};

const isSameDay = (left, right) => {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

const toDayMinutes = (date) => date.getHours() * 60 + date.getMinutes();

const roundUpToInterval = (date, intervalMinutes) => {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const remainder = minutes % intervalMinutes;

  if (remainder !== 0) {
    rounded.setMinutes(minutes + (intervalMinutes - remainder));
  }

  return rounded;
};

const DateTimePicker = ({ value, onChange, minDateTime, placeholder, hasError = false, onBlur }) => {
  const intervalMinutes = 5;
  const selectedDate = useMemo(() => {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }, [value]);

  const effectiveMinDateTime = useMemo(() => {
    const now = new Date();
    const min = minDateTime && minDateTime.getTime() > now.getTime() ? minDateTime : now;

    return roundUpToInterval(min, intervalMinutes);
  }, [minDateTime]);

  const handleChange = (date) => {
    if (!date) {
      onChange('');
      return;
    }

    if (date.getTime() < effectiveMinDateTime.getTime()) {
      onChange(effectiveMinDateTime.toISOString());
      return;
    }

    onChange(roundUpToInterval(date, intervalMinutes).toISOString());
  };

  const filterTime = (timeValue) => {
    if (!minDateTime) {
      return true;
    }

    const dateForFilter = selectedDate || effectiveMinDateTime;

    if (!isSameDay(dateForFilter, effectiveMinDateTime)) {
      return true;
    }

    return toDayMinutes(timeValue) >= toDayMinutes(effectiveMinDateTime);
  };

  return (
    <DatePicker
      selected={selectedDate}
      onChange={handleChange}
      locale="ru"
      showTimeSelect
      timeIntervals={intervalMinutes}
      timeCaption="Время"
      dateFormat="dd.MM.yyyy HH:mm"
      placeholderText={placeholder}
      minDate={effectiveMinDateTime}
      filterTime={filterTime}
      className={`date-time-picker__input ${hasError ? 'date-time-picker__input--error' : ''}`}
      calendarClassName="date-time-picker__calendar"
      popperClassName="date-time-picker__popper"
      popperPlacement="bottom-start"
      popperProps={{ strategy: 'fixed' }}
      popperContainer={DatePickerPopperContainer}
      showPopperArrow={false}
      autoComplete="off"
      onBlur={onBlur}
    />
  );
};

export default DateTimePicker;
