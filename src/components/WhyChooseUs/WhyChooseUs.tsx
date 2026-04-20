"use client";

import Image from 'next/image';
import styles from './WhyChooseUs.module.css';

const WhyChooseUs = () => {
    return (
        <section className={styles.section}>
            <div className={styles.gridContainer}>
                {/* Card 1: Header + Image 1 */}
                <div className={`${styles.card} ${styles.headerCard}`} id="wcuo-1">
                    <h2 className={styles.title}>A Few Things We Do Differently</h2>
                    <div id="wcu-img-1" className={styles.cardImageContainer}>
                        <Image
                            src="/image 1.png"
                            alt="Why Choose Us"
                            fill
                            className={styles.cardImage}
                        />
                    </div>
                </div>

                {/* Card 2: Verified & Trusted Profiles (Image 2) */}
                <div className={`${styles.card} ${styles.featureCardSmall}`} id="wcuo-2">
                    <div className={styles.cardContent}>
                        <h3 className={styles.featureTitle}>Profiles That Are Actually Reviewed</h3>
                        <p className={styles.featureDesc}>Before any profile goes live on this platform, someone on our team looks at it. It is a small step that makes a big difference to the quality of who you meet here.</p>
                    </div>
                    <div id="wcu-img-2" className={styles.cardImageContainer}>
                        <Image
                            src="/image 2.png"
                            alt="Verified Profiles"
                            fill
                            className={styles.cardImage}
                        />
                    </div>
                </div>

                {/* Card 3: Quality Matches (Image 3) */}
                <div className={`${styles.card} ${styles.featureCardSmall}`} id="wcuo-3">
                    <div className={styles.cardContent}>
                        <h3 className={styles.featureTitle}>Fewer Profiles. Better Fit.</h3>
                        <p className={styles.featureDesc}>We are not trying to overwhelm you with options. We focus on showing you profiles that are reasonably aligned with what you are looking for so your time is spent well.</p>
                    </div>
                    <div id="wcu-img-3" className={styles.cardImageContainer}>
                        <Image
                            src="/image 3.png"
                            alt="Quality Matches"
                            fill
                            className={styles.cardImage}
                        />
                    </div>
                </div>

                {/* Card 4: Clear & Transparent Process (Image 4) - Wide Horizontal */}
                <div className={`${styles.card} ${styles.cardHorizontal}`} id="wcuo-4">
                    <div className={styles.cardContent}>
                        <h3 className={styles.featureTitle}>Honest About How We Work</h3>
                        <p className={styles.featureDesc}>We do not make promises we cannot keep. Our platform, our plans, and our process are all laid out clearly so you know exactly what to expect from day one.</p>
                    </div>
                    <div id="wcu-img-4" className={styles.cardImageContainer}>
                        <Image
                            src="/image 4.png"
                            alt="Clear Process"
                            fill
                            className={styles.cardImage}
                        />
                    </div>
                </div>

                {/* Card 5: Simple, Secure Experience (Image 5) - Wide */}
                <div className={`${styles.card} ${styles.featureCardWide}`} id="wcuo-5">
                    <div className={styles.cardContent}>
                        <h3 className={styles.featureTitle}>Your Privacy Is Not Negotiable</h3>
                        <p className={styles.featureDesc}>You decide who can see your photos and who can contact you. These controls exist because we believe your comfort matters more than anything else on this platform.</p>
                    </div>
                    <div id="wcu-img-5" className={styles.cardImageContainer}>
                        <Image
                            src="/image 5.png"
                            alt="Secure Experience"
                            fill
                            className={styles.cardImage}
                        />
                    </div>
                </div>

            </div>
        </section>
    );
};

export default WhyChooseUs;
