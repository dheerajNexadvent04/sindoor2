"use client";

import React, { useState } from 'react';
import styles from './register.module.css';
import { Eye, EyeOff } from 'lucide-react';
import CustomSelect from '@/components/common/CustomSelect';

const RegisterPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const [formData, setFormData] = useState({
        // Account
        email: '',
        password: '',
        phone: '',

        // Profile For
        profileFor: '',
        managedBy: '',

        // Basic
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        height: '',
        weight: '',
        bodyType: '',
        bloodGroup: '',
        complexion: '',
        maritalStatus: '',
        lookingFor: '', // Auto-set

        // Religion
        motherTongue: '',
        religion: '',
        caste: '',
        subCaste: '',
        manglik: 'no',
        horoscopeFile: null as File | null,

        // Career
        degree: '',
        employedIn: '',
        occupation: '',
        income: '',
        country: 'India',
        state: '',
        city: '',

        // Family
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

        // Bio
        aboutMe: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
        const { name, value } = e.target;

        // Auto-fill Gender and Looking For based on Profile For
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


    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const textOnlyRegex = /^[a-zA-Z\s.-]+$/;
        const phoneRegex = /^[0-9]{10,15}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // 1. Mandatory Fields & Format Validation
        if (!formData.email || !formData.password || !formData.firstName || !formData.phone) {
            setError('Please fill in all required fields (Email, Password, Name, Phone).');
            window.scrollTo(0, 0);
            return;
        }

        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            window.scrollTo(0, 0);
            return;
        }

        if (!phoneRegex.test(formData.phone)) {
            setError('Please enter a valid 10-15 digit phone number (numbers only)');
            window.scrollTo(0, 0);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            window.scrollTo(0, 0);
            return;
        }

        // 2. Age Validation (18+)
        if (!formData.dob) {
            setError("Please select Date of Birth");
            window.scrollTo(0, 0);
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
            setError("Minimum age for registration is 18 years.");
            window.scrollTo(0, 0);
            return;
        }

        // 3. Text Purity Validation
        const textFieldsToVerify = {
            'First Name': formData.firstName,
            'Last Name': formData.lastName,
            'Mother Tongue': formData.motherTongue,
            'Religion': formData.religion,
            'Caste': formData.caste,
            'City': formData.city,
            'State': formData.state,
            'Native City': formData.nativeCity
        };

        for (const [label, value] of Object.entries(textFieldsToVerify)) {
            if (value && !textOnlyRegex.test(value)) {
                setError(`${label} should only contain letters, spaces, or dots.`);
                window.scrollTo(0, 0);
                return;
            }
        }

        if (!isConfirmed) {
            setError('Please confirm that the information provided is accurate.');
            window.scrollTo(0, 0);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    phone: formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Registration failed.');
            }
             
            alert("Registration successful! PLEASE CHECK YOUR EMAIL to confirm your account before logging in.");
            window.location.href = '/';

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An error occurred during registration.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.registerContainer}>
            <div className={styles.formCard}>
                <h1 className={styles.pageTitle}>Create your Profile</h1>
                <p className={styles.pageSubtitle}>Join thousands of happy couples</p>

                {error && <div className={styles.errorMsg}>{error}</div>}

                <form onSubmit={handleRegister}>
                    {/* Section 1: Account & Basic Info */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Account Details</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Profile For</label>
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
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Managed By</label>
                                <CustomSelect
                                    name="managedBy"
                                    value={formData.managedBy}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select"
                                    options={[
                                        { value: 'self', label: 'Self' },
                                        { value: 'parent', label: 'Parent' },
                                        { value: 'sibling', label: 'Sibling' },
                                        { value: 'relative', label: 'Relative' },
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input type="email" name="email" className={styles.input} value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Phone</label>
                                <input type="tel" name="phone" className={styles.input} value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className={styles.input}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Personal Details */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Personal Details</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>First Name</label>
                                <input type="text" name="firstName" className={styles.input} value={formData.firstName} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Last Name</label>
                                <input type="text" name="lastName" className={styles.input} value={formData.lastName} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Date of Birth</label>
                                <input type="date" name="dob" className={styles.input} value={formData.dob} onChange={handleChange} required max={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Gender</label>
                                <CustomSelect
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select Gender"
                                    options={[
                                        { value: 'male', label: 'Male' },
                                        { value: 'female', label: 'Female' },
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Height (cm)</label>
                                <input type="number" name="height" className={styles.input} value={formData.height} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Weight (kg)</label>
                                <input type="number" name="weight" className={styles.input} value={formData.weight} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Marital Status</label>
                                <CustomSelect
                                    name="maritalStatus"
                                    value={formData.maritalStatus}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select"
                                    options={[
                                        { value: 'Never Married', label: 'Never Married' },
                                        { value: 'Divorced', label: 'Divorced' },
                                        { value: 'Widowed', label: 'Widowed' },
                                        { value: 'Awaiting Divorce', label: 'Awaiting Divorce' },
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Body Type</label>
                                <CustomSelect
                                    name="bodyType"
                                    value={formData.bodyType}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select"
                                    options={[
                                        { value: 'Slim', label: 'Slim' },
                                        { value: 'Athletic', label: 'Athletic' },
                                        { value: 'Average', label: 'Average' },
                                        { value: 'Heavy', label: 'Heavy' },
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Complexion</label>
                                <CustomSelect
                                    name="complexion"
                                    value={formData.complexion}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select"
                                    options={[
                                        { value: 'Very Fair', label: 'Very Fair' },
                                        { value: 'Fair', label: 'Fair' },
                                        { value: 'Wheatish', label: 'Wheatish' },
                                        { value: 'Dark', label: 'Dark' },
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Blood Group</label>
                                <CustomSelect
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select"
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
                        </div>
                    </div>

                    {/* Section 3: Religion & Community */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Religion & Community</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Religion</label>
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
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Mother Tongue</label>
                                <input type="text" name="motherTongue" className={styles.input} value={formData.motherTongue} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Caste</label>
                                <input type="text" name="caste" className={styles.input} value={formData.caste} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Sub Caste</label>
                                <input type="text" name="subCaste" className={styles.input} value={formData.subCaste} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Manglik</label>
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
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Education & Career */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Education & Career</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Highest Degree</label>
                                <input type="text" name="degree" className={styles.input} value={formData.degree} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Employed In</label>
                                <CustomSelect
                                    name="employedIn"
                                    value={formData.employedIn}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select"
                                    options={[
                                        { value: 'Private', label: 'Private' },
                                        { value: 'Government', label: 'Government' },
                                        { value: 'Business', label: 'Business' },
                                        { value: 'Self-Employed', label: 'Self Employed' },
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Occupation</label>
                                <input type="text" name="occupation" className={styles.input} value={formData.occupation} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Annual Income (₹)</label>
                                <input type="number" name="income" className={styles.input} value={formData.income} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Location */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Location</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Country</label>
                                <input type="text" name="country" className={styles.input} value={formData.country} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>State</label>
                                <input type="text" name="state" className={styles.input} value={formData.state} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>City</label>
                                <input type="text" name="city" className={styles.input} value={formData.city} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Family Details */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>Family Details</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Family Type</label>
                                <CustomSelect
                                    name="familyType"
                                    value={formData.familyType}
                                    onChange={handleChange}
                                    required
                                    placeholder="Select"
                                    options={[
                                        { value: 'Nuclear', label: 'Nuclear' },
                                        { value: 'Joint', label: 'Joint' },
                                    ]}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Father's Occupation</label>
                                <input type="text" name="fatherOcc" className={styles.input} value={formData.fatherOcc} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Mother's Occupation</label>
                                <input type="text" name="motherOcc" className={styles.input} value={formData.motherOcc} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Family Location</label>
                                <input type="text" name="familyLocation" className={styles.input} value={formData.familyLocation} onChange={handleChange} />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>About Family</label>
                                <textarea name="aboutFamily" className={styles.textarea} value={formData.aboutFamily} onChange={handleChange} placeholder="Tell us about your family..." />
                            </div>
                        </div>
                    </div>

                    {/* Section 7: About Me */}
                    <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>About Me</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Describe Yourself</label>
                            <textarea name="aboutMe" className={styles.textarea} value={formData.aboutMe} onChange={handleChange} required placeholder="Tell us about yourself..." />
                        </div>

                        <div className={styles.checkboxGroup} style={{ marginTop: '20px' }}>
                            <input type="checkbox" id="confirm" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} />
                            <label htmlFor="confirm" style={{ fontSize: '0.9rem' }}>I confirm that the information provided is accurate.</label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Processing...' : 'Register'}
                    </button>

                </form>
            </div >
        </div >
    );
};

export default RegisterPage;
