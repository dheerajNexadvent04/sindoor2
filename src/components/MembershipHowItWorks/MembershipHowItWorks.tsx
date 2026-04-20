import React from 'react';
import Image from 'next/image';
import styles from './MembershipHowItWorks.module.css';

const steps = [
    {
        title: "Understanding Your Preferences",
        description: "A dedicated Relationship Manager from your region will thoroughly understand your preferences, lifestyle and cultural nuances that will help in finding the best possible matches for you.",
        image: "/mockup.png"
    },
    {
        title: "Recommending Matches",
        description: "Your Relationship Manager will recommend matches by consistently searching and shortlisting profiles based on your preferences.",
        image: "/mockup.png"
    },
    {
        title: "Connecting with Prospects",
        description: "After exploring mutual interests, your Relationship Manager will schedule meetings with your matches and families, saving your time and helping you find the right partner.",
        image: "/mockup.png"
    }
];

const MembershipHowItWorks = () => {
    return (
        <section className={styles.section}>
            {/* Background design elements */}
            <div className={styles.bgTopLeft}>
                <Image src="/left-top-corner.png" alt="" fill className={styles.bgImage} />
            </div>
            <div className={styles.bgBottomRight}>
                <Image src="/right-bottom-corner.png" alt="" fill className={styles.bgImage} />
            </div>

            <div className={styles.container}>
                <h2 className={styles.heading}>How it works?</h2>

                <div className={styles.cardsGrid}>
                    {steps.map((step, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.cardImageWrapper}>
                                <Image src={step.image} alt={step.title} fill className={styles.cardImage} />
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>{step.title}</h3>
                                <p className={styles.cardText}>{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.buttonContainer}>
                    <button className={styles.mainButton}>Interested in Elite Service?</button>
                </div>
            </div>
        </section>
    );
};

export default MembershipHowItWorks;
