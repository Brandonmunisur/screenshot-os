import './globals.css';

export const metadata = {
  title: 'ScreenshotOS — Turn screenshots into actions',
  description:
    'ScreenshotOS turns screenshots into organised, searchable actions for products, places, events, travel and ideas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
