"use client";

import Image from 'next/image';
import { Heart, UserCheck, Search, ArrowRight } from 'lucide-react';
import styles from './HowItWorks.module.css';

const steps = [
    {
        id: 1,
        title: "Put Together Your Profile",
        highlight: "Profile",
        description: "Your profile is how people get to know you before they ever speak to you. Take a few minutes to fill it in thoughtfully and it will do a lot of the work for you.",
        icon: <Heart size={24} fill="currentColor" />,
        image: "/card-1,4.png"
    },
    {
        id: 2,
        title: "Choose a Membership",
        highlight: "Membership",
        description: "We have plans for different needs and different budgets. Pick one that feels right for where you are in your search right now.",
        icon: <UserCheck size={24} />,
        image: "/card-size test.png"
    },
    {
        id: 3,
        title: "Browse and Reach Out",
        highlight: "Reach Out",
        description: "Look through profiles at your own pace. When someone catches your attention, express interest or start a conversation. There is no rush here.",
        icon: <Search size={24} />,
        image: "/card-size test.png"
    },
    {
        id: 4,
        title: "Take It at Your Own Pace",
        highlight: "Own Pace",
        description: "Everything that happens next is up to you. Your privacy settings, your conversations, your decisions. We are just here to make the introductions.",
        icon: <ArrowRight size={24} />,
        image: "/card-1,4.png"
    }
];

const HowItWorks = () => {
    return (
        <section className={styles.section}>
            <div className={styles.heading}>
                <h2 className={styles.title}>How the <span className={styles.highlight}>Journey Usually Goes</span></h2>
                <p className={styles.subtitle}>We have kept the process simple and honest so you can focus on what actually matters, finding the right person.</p>
            </div>

            <div className={styles.stepsContainer}>
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`${styles.stepRow} ${index % 2 !== 0 ? styles.reverse : ''}`}
                    >
                        <div className={styles.textContent}>
                            <div className={styles.iconContainer}>
                                {step.icon}
                            </div>
                            <h3 className={styles.stepTitle}>
                                {step.title.split(step.highlight)[0]}
                                <span className={styles.highlight}>{step.highlight}</span>
                            </h3>
                            <p className={styles.stepDescription}>{step.description}</p>
                        </div>

                        <div className={styles.imageContainer}>
                            <Image
                                src={step.image}
                                alt={step.title}
                                width={300}
                                height={600}
                                className={styles.mockupImage}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HowItWorks;
