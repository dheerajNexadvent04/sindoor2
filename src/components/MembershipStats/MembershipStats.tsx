import React from 'react';
import styles from './MembershipStats.module.css';
import Image from 'next/image';

const StatsCard = ({ icon, value, text }: { icon: string, value: string, text: string }) => (
    <div className={styles.statsCard}>
        <div className={styles.iconWrapper}>
            <Image src={icon} alt={text} width={60} height={60} />
        </div>
        <h3 className={styles.statsValue}>{value}</h3>
        <p className={styles.statsText}>{text}</p>
    </div>
);

const MembershipStats = () => {
    return (
        <section className={styles.statsSection}>
            {/* Background design elements */}
            <div className={styles.bgLeft}>
                <Image src="/left-design-1.png" alt="" fill className={styles.bgImage} />
            </div>
            <div className={styles.bgRight}>
                <Image src="/right-design-2.png" alt="" fill className={styles.bgImage} />
            </div>

            <div className={styles.container}>
                <div className={styles.headingContainer}>
                    <h2 className={styles.heading}>Why Elite Matrimony?</h2>
                    <p className={styles.subHeading}>
                        Sindoor Saubhagya is a pioneer and leader in online matrimony services for Indians
                        worldwide. We bring over 17 years of expertise in pioneering the Elite matchmaking service,
                        and offer the most exclusive database of truly Elite matches for you!
                    </p>
                </div>

                <div className={styles.cardsGrid}>
                    <StatsCard
                        icon="/icon1.png"
                        value="17+"
                        text="Years of Expertise"
                    />
                    <StatsCard
                        icon="/icon2.png"
                        value="1,00,000+"
                        text="Elite customers"
                    />
                    <StatsCard
                        icon="/icon3.png"
                        value="100+"
                        text="Relationship Managers"
                    />
                    <StatsCard
                        icon="/icon4.png"
                        value="100%"
                        text="Confidential"
                    />
                </div>
            </div>
        </section>
    );
};

export default MembershipStats;
