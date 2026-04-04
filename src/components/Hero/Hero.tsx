"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';
import { Heart, ChevronRight, ChevronLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomSelect from '../common/CustomSelect';

const Hero = () => {
    // Multi-step form state
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        // ... existing fields ...
        // Step 1: Account
        email: '',
        password: '',

        // Step 2: Profile For
        profileFor: '',
        managedBy: '',

        // Step 3: Basic
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        lookingFor: '',
        height: '',
        weight: '',
        bodyType: '',
        bloodGroup: '',
        complexion: '',
        maritalStatus: '',
        motherTongue: '',
        religion: '',
        caste: '',
        subCaste: '',
        manglik: 'no',

        // Step 4: Career
        degree: '',
        employedIn: '',
        occupation: '',
        income: '',
        country: 'India',
        state: '',
        city: '',

        // Step 5: Family
        familyType: '',
        fatherOcc: '',
        motherOcc: '',
        brothersTotal: '0',
        brothersMarried: '0',
        sistersTotal: '0',
        sistersMarried: '0',
        nativeCity: '',
        familyLocation: '',
        aboutFamily: '',

        // Step 6: Bio & Photo
        aboutMe: '',
        phone: '',
        otp: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
        const { name, value } = e.target;

        // Logic for Step 2: Auto-fill Gender and Looking For
        if (name === 'profileFor') {
            let autoGender = '';
            let autoLookingFor = '';

            if (value === 'son' || value === 'brother') {
                autoGender = 'male';
                autoLookingFor = 'bride';
            } else if (value === 'daughter' || value === 'sister') {
                autoGender = 'female';
                autoLookingFor = 'groom';
            }

            setFormData(prev => ({
                ...prev,
                [name]: value,
                gender: autoGender,
                lookingFor: autoLookingFor
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };




    const nextStep = async () => {
        const textOnlyRegex = /^[a-zA-Z\s.-]+$/;
        const phoneRegex = /^[0-9]{10,15}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (step === 1) {
            // Validate Step 1
            if (!formData.profileFor || !formData.email || !formData.password || !formData.phone) {
                setError('Please fill in all fields');
                return;
            }
            if (!emailRegex.test(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }
            if (!phoneRegex.test(formData.phone)) {
                setError('Please enter a valid 10-15 digit phone number');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }

            // Check for duplicate email
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('email', formData.email)
                    .maybeSingle();

                if (data) {
                    setError('Email already registered. Please login.');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                // Ignore
            } finally {
                setLoading(false);
            }
        }

        if (step === 2) {
            if (!formData.firstName || !formData.lastName) {
                setError("First and Last name are required");
                return;
            }
            if (!textOnlyRegex.test(formData.firstName) || !textOnlyRegex.test(formData.lastName)) {
                setError("Names should not contain numbers or special characters");
                return;
            }
            if (!formData.dob) {
                setError("Please select Date of Birth");
                return;
            }
            const dobDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }

            if (age < 18) {
                setError("Age must be at least 18 years for registration.");
                return;
            }
            if (dobDate > today) {
                setError("Date of birth cannot be in the future.");
                return;
            }
        }

        if (step === 3) {
            if (!formData.motherTongue || !formData.religion || !formData.caste) {
                setError("Please fill in all mandatory fields (Mother Tongue, Religion, Caste)");
                return;
            }
            if (!textOnlyRegex.test(formData.motherTongue) || !textOnlyRegex.test(formData.religion) || !textOnlyRegex.test(formData.caste)) {
                setError("Mother Tongue, Religion, and Caste should only contain letters");
                return;
            }
        }

        if (step === 4) {
            if (!formData.degree || !formData.occupation || !formData.city || !formData.state) {
                setError("Please fill in Degree, Occupation, City, and State");
                return;
            }
            if (!textOnlyRegex.test(formData.city) || !textOnlyRegex.test(formData.state)) {
                setError("City and State should only contain letters");
                return;
            }
        }

        if (step === 5) {
            if (formData.nativeCity && !textOnlyRegex.test(formData.nativeCity)) {
                setError("Native City should only contain letters");
                return;
            }
        }

        setError('');
        setStep(prev => prev + 1);
    };
    const prevStep = () => setStep(prev => prev - 1);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 6) {
            nextStep();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        gender: formData.gender,
                        date_of_birth: formData.dob,
                        height: formData.height,
                        weight: formData.weight,
                        body_type: formData.bodyType,
                        blood_group: formData.bloodGroup,
                        complexion: formData.complexion,
                        marital_status: formData.maritalStatus,
                        mother_tongue: formData.motherTongue,
                        religion_name: formData.religion,
                        caste_name: formData.caste,
                        sub_caste_name: formData.subCaste,
                        manglik: formData.manglik,
                        profile_for: formData.profileFor,
                        managed_by: formData.managedBy,
                        looking_for: formData.lookingFor,
                        degree: formData.degree,
                        employed_in: formData.employedIn,
                        occupation: formData.occupation,
                        annual_income: formData.income,
                        country: formData.country,
                        state: formData.state,
                        city: formData.city,
                        family_type: formData.familyType,
                        father_occupation: formData.fatherOcc,
                        mother_occupation: formData.motherOcc,
                        brothers_total: formData.brothersTotal,
                        brothers_married: formData.brothersMarried,
                        sisters_total: formData.sistersTotal,
                        sisters_married: formData.sistersMarried,
                        native_city: formData.nativeCity,
                        family_location: formData.familyLocation,
                        about_me: formData.aboutMe,
                        phone: formData.phone,
                        about_family: formData.aboutFamily,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Show success message and redirect
            alert("Registration successful! PLEASE CHECK YOUR EMAIL to confirm your account before logging in.");
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className={styles.heroSection}>
            <div className={styles.heroBackground}>
                <Image
                    src="/hero-bg.png"
                    alt="Indian Wedding Couple"
                    fill
                    priority
                    className={styles.bgImage}
                />
            </div>

            <div className={styles.heroContent}>
                {/* Left Text Content */}
                <div className={styles.textContent}>
                    <h1 className={styles.headline}>
                        Find Your Life <span className={styles.highlightHeart}>❤</span> Partner,<br />
                        Not Just a Match
                    </h1>
                    <p className={styles.subHeadline}>
                        A trusted matrimonial platform helping families and individuals connect with verified, faith-aligned, and serious profiles.
                    </p>
                    <div className={styles.actionButtons}>
                        <Link href="/membership" className={styles.btnPrimary}>Our Plans</Link>
                        <Link href="/contact" className={styles.btnSecondary}>Contact Us</Link>
                    </div>
                </div>

                <div className={styles.formCard}>
                    <h3 className={styles.formTitle}>
                        {step === 1 && "Register"}
                        {step === 2 && "Step 2 – Profile For + Basic Info"}
                        {step === 3 && "Step 3 – Personal Details"}
                        {step === 4 && "Step 4 – Career & Education"}
                        {step === 5 && "Step 5 – Family & Lifestyle"}
                        {step === 6 && "Step 6 – About Me"}
                    </h3>

                    <form onSubmit={handleRegister}>
                        {step === 1 && (
                            <div className={styles.slide}>
                                <div className={styles.formGroup}>
                                    <span className={styles.inputLabel}>Create Profile for</span>
                                    <CustomSelect
                                        name="profileFor"
                                        value={formData.profileFor}
                                        onChange={handleChange}
                                        required
                                        placeholder="Select Profile For"
                                        options={[
                                            { value: 'self', label: 'Self' },
                                            { value: 'son', label: 'Son' },
                                            { value: 'daughter', label: 'Daughter' },
                                            { value: 'sister', label: 'Sister' },
                                            { value: 'brother', label: 'Brother' },
                                            { value: 'friend', label: 'Relative/Friend' },
                                            { value: 'other', label: 'Other' },
                                        ]}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <input type="email" name="email" placeholder="Email address" className={styles.formInput} value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <input type="tel" name="phone" placeholder="Phone number" className={styles.formInput} value={formData.phone} onChange={handleChange} required />
                                </div>
                                <div className={styles.formGroup} style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Create Password"
                                        className={styles.formInput}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#666'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className={styles.slide}>
                                <div className={styles.formGroup}>
                                    <label className={styles.fieldLabel} style={{ display: 'block', marginBottom: '8px' }}>Profile Managed By:</label>
                                    <div className={styles.chipGroup}>
                                        {['self', 'parent', 'sibling', 'relative'].map(opt => (
                                            <div key={opt} className={styles.chip}>
                                                <input
                                                    type="radio"
                                                    name="managedBy"
                                                    id={`managedBy-${opt}`}
                                                    value={opt}
                                                    checked={formData.managedBy === opt}
                                                    onChange={handleChange}
                                                    className={styles.chipInput}
                                                    required
                                                />
                                                <label htmlFor={`managedBy-${opt}`} className={styles.chipLabel}>
                                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.twoFields}>
                                    <input type="text" name="firstName" placeholder="First Name" className={styles.formInput} value={formData.firstName} onChange={handleChange} required />
                                    <input type="text" name="lastName" placeholder="Last Name" className={styles.formInput} value={formData.lastName} onChange={handleChange} required />
                                </div>
                                <div className={styles.twoFields}>
                                    <div className={styles.formGroup}>
                                        <span className={styles.inputLabelSmall}>Date of Birth</span>
                                        <input type="date" name="dob" className={styles.formInput} value={formData.dob} onChange={handleChange} max={new Date().toISOString().split('T')[0]} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <span className={styles.inputLabelSmall}>Gender</span>
                                        <CustomSelect
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                            placeholder="Select"
                                            options={[
                                                { value: 'male', label: 'Male' },
                                                { value: 'female', label: 'Female' },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className={`${styles.slide} ${styles.step3Content}`}>
                                <div className={styles.twoFields}>
                                    <input type="number" name="height" placeholder="Height (cm)" className={styles.formInput} value={formData.height} onChange={handleChange} required />
                                    <input type="number" name="weight" placeholder="Weight (kg)" className={styles.formInput} value={formData.weight} onChange={handleChange} required />
                                </div>
                                <div className={styles.twoFields}>
                                    <CustomSelect
                                        name="bodyType"
                                        value={formData.bodyType}
                                        onChange={handleChange}
                                        required
                                        placeholder="Body Type"
                                        options={[
                                            { value: 'Slim', label: 'Slim' },
                                            { value: 'Athletic', label: 'Athletic' },
                                            { value: 'Average', label: 'Average' },
                                            { value: 'Heavy', label: 'Heavy' },
                                        ]}
                                    />
                                    <CustomSelect
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        required
                                        placeholder="Blood Group"
                                        options={[
                                            { value: 'A+', label: 'A+' },
                                            { value: 'A-', label: 'A-' },
                                            { value: 'B+', label: 'B+' },
                                            { value: 'B-', label: 'B-' },
                                            { value: 'AB+', label: 'AB+' },
                                            { value: 'AB-', label: 'AB-' },
                                            { value: 'O+', label: 'O+' },
                                            { value: 'O-', label: 'O-' },
                                        ]}
                                    />
                                </div>
                                <div className={styles.twoFields}>
                                    <CustomSelect
                                        name="complexion"
                                        value={formData.complexion}
                                        onChange={handleChange}
                                        required
                                        placeholder="Complexion"
                                        options={[
                                            { value: 'Very Fair', label: 'Very Fair' },
                                            { value: 'Fair', label: 'Fair' },
                                            { value: 'Wheatish', label: 'Wheatish' },
                                            { value: 'Dark', label: 'Dark' },
                                        ]}
                                    />
                                    <CustomSelect
                                        name="maritalStatus"
                                        value={formData.maritalStatus}
                                        onChange={handleChange}
                                        required
                                        placeholder="Marital Status"
                                        options={[
                                            { value: 'Never Married', label: 'Never Married' },
                                            { value: 'Divorced', label: 'Divorced' },
                                            { value: 'Widowed', label: 'Widowed' },
                                            { value: 'Awaiting Divorce', label: 'Awaiting Divorce' },
                                        ]}
                                    />
                                </div>
                                <div className={styles.twoFields}>
                                    <input type="text" name="motherTongue" placeholder="Mother Tongue" className={styles.formInput} value={formData.motherTongue} onChange={handleChange} required />
                                    <CustomSelect
                                        name="religion"
                                        value={formData.religion}
                                        onChange={handleChange}
                                        required
                                        placeholder="Select Religion"
                                        options={[
                                            { value: 'Hindu', label: 'Hindu' },
                                            { value: 'Muslim', label: 'Muslim' },
                                            { value: 'Sikh', label: 'Sikh' },
                                            { value: 'Christian', label: 'Christian' },
                                            { value: 'Jain', label: 'Jain' },
                                        ]}
                                    />
                                </div>
                                <div className={styles.twoFields}>
                                    <input type="text" name="caste" placeholder="Caste" className={styles.formInput} value={formData.caste} onChange={handleChange} required />
                                    <input type="text" name="subCaste" placeholder="Sub Caste" className={styles.formInput} value={formData.subCaste} onChange={handleChange} />
                                </div>
                                <div className={styles.twoFields}>
                                    <CustomSelect
                                        name="manglik"
                                        value={formData.manglik}
                                        onChange={handleChange}
                                        required
                                        placeholder="Manglik Status"
                                        options={[
                                            { value: 'no', label: 'Not Manglik' },
                                            { value: 'yes', label: 'Manglik' },
                                            { value: 'partial', label: 'Anshik Manglik' },
                                            { value: 'dont_know', label: "Don't Know" },
                                        ]}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className={styles.slide}>
                                <div className={styles.twoFields}>
                                    <input type="text" name="degree" placeholder="Highest Degree" className={styles.formInput} value={formData.degree} onChange={handleChange} required />
                                    <CustomSelect
                                        name="employedIn"
                                        value={formData.employedIn}
                                        onChange={handleChange}
                                        required
                                        placeholder="Employed In"
                                        options={[
                                            { value: 'Private', label: 'Private' },
                                            { value: 'Government', label: 'Government' },
                                            { value: 'Business', label: 'Business' },
                                            { value: 'Self-Employed', label: 'Self Employed' },
                                        ]}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <input type="text" name="occupation" placeholder="Occupation / Job Title" className={styles.formInput} value={formData.occupation} onChange={handleChange} required />
                                </div>
                                <div className={styles.twoFields}>
                                    <input type="number" name="income" placeholder="Annual Income (₹)" className={styles.formInput} value={formData.income} onChange={handleChange} required />
                                    <input type="text" name="country" placeholder="Country" className={styles.formInput} value={formData.country} onChange={handleChange} required />
                                </div>
                                <div className={styles.twoFields}>
                                    <input type="text" name="state" placeholder="State" className={styles.formInput} value={formData.state} onChange={handleChange} required />
                                    <input type="text" name="city" placeholder="City" className={styles.formInput} value={formData.city} onChange={handleChange} required />
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className={styles.slide}>
                                <div className={styles.twoFields}>
                                    <CustomSelect
                                        name="familyType"
                                        value={formData.familyType}
                                        onChange={handleChange}
                                        required
                                        placeholder="Family Type"
                                        options={[
                                            { value: 'Nuclear', label: 'Nuclear' },
                                            { value: 'Joint', label: 'Joint' },
                                        ]}
                                    />
                                    <input type="text" name="nativeCity" placeholder="Native City" className={styles.formInput} value={formData.nativeCity} onChange={handleChange} />
                                </div>
                                <div className={styles.twoFields}>
                                    <input type="text" name="fatherOcc" placeholder="Father's Occ." className={styles.formInput} value={formData.fatherOcc} onChange={handleChange} />
                                    <input type="text" name="motherOcc" placeholder="Mother's Occ." className={styles.formInput} value={formData.motherOcc} onChange={handleChange} />
                                </div>
                                <div className={styles.twoFields}>
                                    <div className={styles.countInput}>
                                        <span className={styles.labelTiny}>Brothers (T/M)</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <input type="number" name="brothersTotal" placeholder="T" className={styles.formInput} value={formData.brothersTotal} onChange={handleChange} />
                                            <input type="number" name="brothersMarried" placeholder="M" className={styles.formInput} value={formData.brothersMarried} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className={styles.countInput}>
                                        <span className={styles.labelTiny}>Sisters (T/M)</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <input type="number" name="sistersTotal" placeholder="T" className={styles.formInput} value={formData.sistersTotal} onChange={handleChange} />
                                            <input type="number" name="sistersMarried" placeholder="M" className={styles.formInput} value={formData.sistersMarried} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <input type="text" name="familyLocation" placeholder="Family Living In" className={styles.formInput} value={formData.familyLocation} onChange={handleChange} />
                                </div>
                                <div className={styles.formGroup}>
                                    <textarea name="aboutFamily" placeholder="About my family (Optional)" className={styles.formTextarea} value={formData.aboutFamily} onChange={handleChange} style={{ height: '80px' }} />
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className={styles.slide}>
                                <textarea
                                    name="aboutMe"
                                    placeholder="About Me (Tell us about your background, values, and what you seek in a partner. Min 50 words recommended)"
                                    className={styles.formTextarea}
                                    style={{ height: '80px' }}
                                    value={formData.aboutMe}
                                    onChange={handleChange}
                                    required
                                />
                                <span className={styles.wordCount}>
                                    {formData.aboutMe.trim().split(/\s+/).filter(Boolean).length} words
                                </span>
                                <div className={styles.checkboxGroup}>
                                    <input type="checkbox" id="confirm" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} />
                                    <label htmlFor="confirm" style={{ fontSize: '0.8rem' }}>I confirm that the info provided is accurate.</label>
                                </div>
                            </div>
                        )}



                        {error && <p className={styles.errorMsg}>{error}</p>}

                        <div className={styles.navButtons}>
                            {step > 1 && (
                                <button type="button" className={styles.btnPrev} onClick={prevStep}>
                                    <ChevronLeft size={20} /> Prev
                                </button>
                            )}
                            <button
                                type="submit"
                                className={styles.btnNext}
                                disabled={loading || (step === 6 && !isConfirmed)}
                            >
                                {loading ? 'Processing...' :
                                    step === 1 ? 'Start Registration' : // Changed from 'Register for free' to match design preference if needed, or keep 'Register for free'
                                        step === 6 ? 'Register & Verify Email' : 'Next'}
                                {step < 6 && <ChevronRight size={20} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={styles.bottomBar}>
                <div className={styles.bottomBarContent}>
                    <span>Fastest Growing Matchmaking Service</span>
                    <span className={styles.separator}>|</span>
                    <span>
                        <span className={styles.stars}>★★★★★</span>
                        Ratings on Playstore by 2.4 lakh users
                    </span>
                    <span className={styles.separator}>|</span>
                    <span>5 Lakh Success Stories</span>
                </div>
            </div>
        </section>
    );
};

export default Hero;
