"use client";

import React from 'react';
import styles from './MembershipHero.module.css';
import Image from 'next/image';
import CustomSelect from '../common/CustomSelect';

const MembershipHero = () => {
    const [leadForm, setLeadForm] = React.useState({
        motherTongue: '',
        phone: '',
        name: '',
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;
        if (name === 'phone') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 15);
            setLeadForm((prev) => ({ ...prev, phone: digitsOnly }));
            return;
        }
        setLeadForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitMessage(null);

        const motherTongue = leadForm.motherTongue.trim();
        const name = leadForm.name.trim();
        const phone = leadForm.phone.trim();
        const digitsOnlyPhone = phone.replace(/\D/g, '');

        if (!motherTongue || !name || !phone) {
            setSubmitMessage('Please fill Mother Tongue, Mobile Number, and Name.');
            return;
        }

        if (digitsOnlyPhone.length < 10 || digitsOnlyPhone.length > 15) {
            setSubmitMessage(`Please enter a valid mobile number (10 to 15 digits). You entered ${digitsOnlyPhone.length} digit(s).`);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/forms/membership-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    motherTongue,
                    phone: digitsOnlyPhone,
                    name,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Unable to submit right now. Please try again in a moment.');
            }

            setLeadForm({
                motherTongue: '',
                phone: '',
                name: '',
            });
            setSubmitMessage('Thanks! Your details were submitted successfully to our team.');
        } catch (error) {
            console.error('MembershipHero: lead submit failed', error);
            setSubmitMessage(error instanceof Error ? error.message : 'Unable to submit right now. Please try again in a moment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className={styles.heroSection}>
            <div className={styles.container}>
                <div className={styles.contentCol}>
                    <div className={styles.badgeContainer}>
                        <Image
                            src="/personaized-badge.png"
                            alt="Personalized & Confidential Service"
                            width={320}
                            height={40}
                            className={styles.badgeImage}
                        />
                    </div>

                    <h1 className={styles.heading}>
                        A more personal way to find the right partner
                    </h1>

                    <p className={styles.subHeading}>
                        For those who value compatibility, privacy, and a thoughtful approach to matchmaking.
                    </p>
                    <p className={styles.subHeading}>
                        Share your details. Our team will get in touch.
                    </p>

                    <form
                        className={styles.formContainer}
                        onSubmit={handleSubmit}
                        data-sheet-ignore="true"
                        data-form-type="membership-hero-lead"
                    >
                        <div className={`${styles.formGroup} ${styles.borderRight}`}>
                            <label className={styles.label}>Mother Tongue</label>
                            <CustomSelect
                                name="motherTongue"
                                value={leadForm.motherTongue}
                                onChange={handleChange}
                                required
                                variant="transparent"
                                placeholder="Select"
                                options={[
                                    { value: "hindi", label: "Hindi" },
                                    { value: "english", label: "English" },
                                    { value: "punjabi", label: "Punjabi" },
                                    { value: "marathi", label: "Marathi" },
                                    { value: "bengali", label: "Bengali" },
                                    { value: "gujarati", label: "Gujarati" },
                                    { value: "telugu", label: "Telugu" },
                                    { value: "kannada", label: "Kannada" },
                                    { value: "tamil", label: "Tamil" },
                                    { value: "malayalam", label: "Malayalam" },
                                    { value: "odia", label: "Odia" },
                                    { value: "assamese", label: "Assamese" },
                                    { value: "other", label: "Other" },
                                ]}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.borderRight}`}>
                            <label className={styles.label}>Mobile Number</label>
                            <input
                                type="tel"
                                placeholder="Enter mobile no."
                                className={styles.input}
                                name="phone"
                                value={leadForm.phone}
                                onChange={handleChange}
                                inputMode="numeric"
                                maxLength={15}
                                pattern="[0-9]{10,15}"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Name</label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                className={styles.input}
                                name="name"
                                value={leadForm.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </form>

                    {submitMessage && (
                        <p className={styles.submitMessage} aria-live="polite">{submitMessage}</p>
                    )}
                    <p className={styles.footerNote}>Private. Thoughtful. Focused.</p>
                </div>

                <div className={styles.imageCol}>
                    <div className={styles.imageWrapper}>
                        <Image
                            src="/hero-bg.png"
                            alt="Celebrity Matchmaking"
                            fill
                            className={styles.personImage}
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MembershipHero;
