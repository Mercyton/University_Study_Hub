import Link from 'next/link';
import { ArrowRight, BookOpen, CreditCard, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';

const features = [
  {
    icon: BookOpen,
    title: 'Program library',
    description: 'Browse courses and exam resources by program and subject.',
  },
  {
    icon: ShieldCheck,
    title: 'Demo library',
    description: 'A LearnLoop preview is coming soon.',
  },
  {
    icon: CreditCard,
    title: 'Future-ready payments',
    description: 'The subscription flow is built to be connected to Fluterwave later.',
  },
];

export default function Home() {
  return (
    <main className={styles.homePage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brandGroup}>
            <div className={styles.logo}>L</div>
            <div>
              <h1 className={styles.brandName}>LearnLoop</h1>
              <p className={`${styles.eyebrow} ${styles.brandEyebrow}`}>University study hub</p>
              
            </div>
          </div>

          <div className={styles.headerLinks}>
            <Link href="/demo" className={styles.headerLink}>Demo library</Link>
            <Link href="/login" className={styles.loginAction}>Login</Link>
            <Link href="/register" className={styles.primaryAction}>Create account</Link>
          </div>
        </header>

        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Student access portal</p>
            <h2 className={styles.heroTitle}>Learn smarter with a program-first study platform.</h2>
            <p className={styles.heroDescription}>
              Access university study material and unlock full past papers after subscription.
            </p>

            <div className={styles.actions}>
              <Link href="/register" className={styles.primaryAction}>
                Get started <ArrowRight className={styles.actionIcon} />
              </Link>
              <Link href="/demo" className={styles.secondaryAction}>View demo</Link>
            </div>
          </div>

          <div className={styles.accessCard}>
            <div className={styles.accessInner}>
              <p className={styles.accessEyebrow}>Access model</p>
              <div className={styles.accessSteps}>
                <div className={styles.step}>
                  <p className={styles.stepTitle}>1. Browse programs and subjects</p>
                  <p className={styles.stepDescription}>Find study materials for your program.</p>
                </div>
                <div className={styles.step}>
                  <p className={styles.stepTitle}>2. Register and subscribe</p>
                  <p className={styles.stepDescription}>Account creation leads to the finance and unlock flow.</p>
                </div>
                <div className={styles.step}>
                  <p className={styles.stepTitle}>3. Unlock full past papers</p>
                  <p className={styles.stepDescription}>Premium access is granted after successful payment verification.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className={styles.featureCard}>
              <div className={styles.featureIcon}><Icon className={styles.featureIconSvg} /></div>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDescription}>{description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
