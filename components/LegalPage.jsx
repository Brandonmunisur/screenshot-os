import Link from 'next/link';
import Logo from './Logo';
import styles from './LegalPage.module.css';

export default function LegalPage({ eyebrow, title, updated, children }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}><Logo /></Link>
          <Link href="/" className={styles.back}>Back to ScreenshotOS</Link>
        </header>

        <section className={styles.hero}>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>Last updated: {updated}</p>
        </section>

        <article className={styles.content}>{children}</article>
      </div>
    </main>
  );
}
