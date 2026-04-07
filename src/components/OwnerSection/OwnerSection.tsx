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
              src="/groom-phone.png"
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
            Meet the heart behind{" "}
            <span className={styles.highlight}>Sindoor Saubhagya</span>
          </h2>
          <p className={styles.copy}>
            Anika built Sindoor Saubhagya after personally guiding families
            through thousands of proposals. She blends traditional matchmaking
            warmth with modern verification so every introduction feels trusted
            and intentional.
          </p>
          <div className={styles.points}>
            <div className={styles.point}>
              <span className={styles.dot} />
              <p>Hand-curated shortlists for premium members each week.</p>
            </div>
            <div className={styles.point}>
              <span className={styles.dot} />
              <p>Privacy-first approach with gentle, human follow-ups.</p>
            </div>
            <div className={styles.point}>
              <span className={styles.dot} />
              <p>Guidance rooted in culture, delivered with modern clarity.</p>
            </div>
          </div>
          <div className={styles.signature}>
            <span className={styles.name}>Anika Sharma</span>
            <span className={styles.role}>Founder & Head Matchmaker</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerSection;
