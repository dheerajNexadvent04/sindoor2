"use client";

import Image from "next/image";
import styles from "./OwnerSection.module.css";

const OwnerSection = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.glowOne} aria-hidden />
        <span className={styles.glowTwo} aria-hidden />

        <div className={styles.imageColumn}>
          <div className={styles.imageCard}>
            <Image
              src="/owner.png"
              alt="Founder portrait"
              fill
              sizes="(max-width: 900px) 90vw, 40vw"
              className={styles.image}
              priority
            />
            <span className={styles.badge}>Founder</span>
          </div>
        </div>

        <div className={styles.content}>
          <p className={styles.kicker}>Founder Note</p>
          <h2 className={styles.title}>
            From the Person Who{" "}
            <span className={styles.highlight}>Built This</span>
          </h2>
          <p className={styles.copy}>
            Mr. Sunil had spent years sitting across families navigating one of the most
            personal decisions of their lives. He noticed the same thing every time.
            People did not want a platform. They wanted someone who took this seriously.
          </p>
          <p className={styles.copy}>
            That observation is what Sindoor Saubhagya is built on.
          </p>
          <div className={styles.points}>
            <div className={styles.point}>
              <span className={styles.dot} />
              <p>Premium members receive hand reviewed shortlists from our team every week.</p>
            </div>
            <div className={styles.point}>
              <span className={styles.dot} />
              <p>Every time you reach out, a real person responds.</p>
            </div>
            <div className={styles.point}>
              <span className={styles.dot} />
              <p>Culture and tradition are not filters here. They are central to how we work.</p>
            </div>
          </div>
          <div className={styles.signature}>
            <span className={styles.name}>Mr. Sunil Bansal</span>
            <span className={styles.role}>Founder, Sindoor Saubhagya</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerSection;
