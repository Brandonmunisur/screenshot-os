const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function dateParts(value, includeTime = false) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const options = {
    timeZone: 'Africa/Johannesburg',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hourCycle = 'h23';
  }

  const parts = new Intl.DateTimeFormat('en-ZA', options).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || '';

  const day = Number(get('day'));
  const month = Number(get('month'));
  const year = get('year');

  if (!day || !month || !year) return null;

  return {
    day,
    month,
    year,
    hour: includeTime ? get('hour') : '',
    minute: includeTime ? get('minute') : '',
  };
}

export function formatScreenshotDate(value) {
  const parts = dateParts(value);
  if (!parts) return '';
  return `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;
}

export function formatScreenshotDateTime(value) {
  const parts = dateParts(value, true);
  if (!parts) return '';
  const time = parts.hour && parts.minute ? `, ${parts.hour}:${parts.minute}` : '';
  return `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}${time}`;
}
