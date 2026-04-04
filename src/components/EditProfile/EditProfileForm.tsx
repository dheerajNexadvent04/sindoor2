"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, Users, GraduationCap, X, Eye, Plus, Image as ImageIcon } from 'lucide-react';
import styles from './EditProfile.module.css';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

const EditProfileForm = () => {
    const { user, loading: authLoading, refreshSession } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false); // New state for tracking save status
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showLightbox, setShowLightbox] = useState(false);
    const primaryPhotoInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        dob: '',
        gender: '',
        height: '',
        weight: '',
        marital_status: '',
        mother_tongue: '',
        religion_name: '',
        caste_name: '',
        sub_caste_name: '',
        manglik: 'no',
        degree: '',
        occupation: '',
        employed_in: '',
        annual_income: '',
        complexion: '',
        body_type: '',
        blood_group: '',
        about_me: '',
        city: '',
        state: '',
        country: 'India',

        // New Registration Fields
        profile_for: '',
        managed_by: '',
        family_type: '',
        father_occupation: '',
        mother_occupation: '',
        brothers_total: '',
        brothers_married: '',
        sisters_total: '',
        sisters_married: '',
        native_city: '',
        family_location: '',
        about_family: ''
    });

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photos, setPhotos] = useState<string[]>([]); // Added for gallery sync
    const hasPrimaryPhoto = Boolean(photoUrl);
    const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

    const syncPhotosWithProfile = async (nextPhotos: string[]) => {
        const nextPrimaryPhoto = nextPhotos[0] || null;

        setPhotos(nextPhotos);
        setPhotoUrl(nextPrimaryPhoto);

        const { error } = await supabase
            .from('profiles')
            .update({
                photos: nextPhotos,
                photo_url: nextPrimaryPhoto,
            })
            .eq('id', user?.id);

        if (error) {
            throw error;
        }
    };
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            console.log("DEBUG: fetchProfile data:", data);
            console.log("DEBUG: fetchProfile error:", error);
            console.log("DEBUG: current user id:", userId);

            if (data) {
                setPhotoUrl(data.photo_url);
                setPhotos(data.photos || []); // Fetch photos array

                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    dob: data.date_of_birth || '',
                    gender: data.gender || '',
                    height: data.height ? data.height.toString() : '',
                    weight: data.weight ? data.weight.toString() : '',
                    marital_status: data.marital_status || '',
                    religion_name: data.religion_name || '',
                    caste_name: data.caste_name || '',
                    sub_caste_name: data.sub_caste_name || '',
                    mother_tongue: data.mother_tongue || '',
                    manglik: data.manglik || 'no',
                    degree: data.degree || '',
                    occupation: data.occupation || '',
                    employed_in: data.employed_in || '',
                    annual_income: data.annual_income ? data.annual_income.toString() : '',
                    complexion: data.complexion || '',
                    body_type: data.body_type || '',
                    blood_group: data.blood_group || '',
                    about_me: data.about_me || '',
                    city: data.city || '',
                    state: data.state || '',
                    country: data.country || 'India',

                    profile_for: data.profile_for || '',
                    managed_by: data.managed_by || '',
                    family_type: data.family_type || '',
                    father_occupation: data.father_occupation || '',
                    mother_occupation: data.mother_occupation || '',
                    brothers_total: data.brothers_total !== null ? data.brothers_total.toString() : '',
                    brothers_married: data.brothers_married !== null ? data.brothers_married.toString() : '',
                    sisters_total: data.sisters_total !== null ? data.sisters_total.toString() : '',
                    sisters_married: data.sisters_married !== null ? data.sisters_married.toString() : '',
                    native_city: data.native_city || '',
                    family_location: data.family_location || '',
                    about_family: data.about_family || '' // Note: about_family wasn't in schema but we should check if we need to add it or if it's there
                });
                setPhotoUrl(data.photo_url);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadProfile = async () => {
            if (authLoading) {
                return;
            }

            if (user?.id) {
                await fetchProfile(user.id);
                return;
            }

            await refreshSession();
            setLoading(false);
        };

        void loadProfile();
    }, [user?.id, authLoading, refreshSession]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaved(false); // Reset saved state on any change
    };

    const handleManglikChange = (value: string) => {
        setFormData(prev => ({ ...prev, manglik: value }));
        setSaved(false);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setSaved(false);

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setSaving(true);
        try {
            // Upload to Supabase Storage (assuming 'profile-photos' bucket exists and is public/authenticated)
            const { error: uploadError } = await supabase.storage
                .from('profile-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(filePath);

            // Update Profile
            // Append new photo to gallery
            const updatedPhotos = photoUrl ? [...(photos || []), publicUrl] : [publicUrl, ...(photos || [])];

            await syncPhotosWithProfile(updatedPhotos);
            setMessage({ type: 'success', text: 'Photo updated successfully!' });

        } catch (error: any) {
            console.error('Error uploading photo:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to upload photo' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // Construct update object - using flat fields matching Registration
            const updates = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                gender: formData.gender,
                date_of_birth: formData.dob || null,
                height: formData.height ? parseFloat(formData.height) : null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                marital_status: formData.marital_status,
                mother_tongue: formData.mother_tongue,
                religion_name: formData.religion_name,
                caste_name: formData.caste_name,
                sub_caste_name: formData.sub_caste_name,
                manglik: formData.manglik,

                degree: formData.degree,
                occupation: formData.occupation,
                employed_in: formData.employed_in,
                annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,

                complexion: formData.complexion,
                body_type: formData.body_type,
                blood_group: formData.blood_group,
                about_me: formData.about_me,

                city: formData.city,
                state: formData.state,
                country: formData.country,

                // New Fields
                profile_for: formData.profile_for,
                managed_by: formData.managed_by,
                family_type: formData.family_type,
                father_occupation: formData.father_occupation,
                mother_occupation: formData.mother_occupation,
                brothers_total: formData.brothers_total ? parseInt(formData.brothers_total) : 0,
                brothers_married: formData.brothers_married ? parseInt(formData.brothers_married) : 0,
                sisters_total: formData.sisters_total ? parseInt(formData.sisters_total) : 0,
                sisters_married: formData.sisters_married ? parseInt(formData.sisters_married) : 0,
                native_city: formData.native_city,
                family_location: formData.family_location,
                about_family: formData.about_family,
                status: 'pending',
                
                // Ensure photos are included in final save
                photo_url: photoUrl,
                photos: photos,

                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user?.id);

            if (error) throw error;

            setSaved(true);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            // Optionally redirect after delay
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.title}>
                    <User size={24} color="#E31E24" />
                    Edit Profile
                </div>
                <button className={styles.closeBtn} onClick={() => router.push('/dashboard')}>
                    <X size={18} />
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    backgroundColor: message.type === 'success' ? '#e6fffa' : '#fff5f5',
                    color: message.type === 'success' ? '#047857' : '#c53030',
                    border: `1px solid ${message.type === 'success' ? '#047857' : '#c53030'}`
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Personal Info Section */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <User size={20} color="#E31E24" />
                        Personal info
                    </div>

                    <div className={styles.formGrid}>
                        {/* Left Column: Photo */}
                        <div className={styles.photoColumn}>
                            <div className={styles.imageWrapper}>
                                {photoUrl ? (
                                    <Image
                                        src={photoUrl}
                                        alt="Profile"
                                        fill
                                        className={styles.profileImage}
                                        style={{ objectFit: 'cover' }}
                                        unoptimized
                                    />
                                ) : (
                                    <div className={`${styles.profileImage} ${styles.avatarPlaceholder}`}>
                                        <User size={64} color="#ccc" />
                                    </div>
                                )}

                                {hasPrimaryPhoto ? (
                                    <button
                                        type="button"
                                        className={styles.viewProfileBtn}
                                        onClick={() => setShowLightbox(true)}
                                        title="View Photo"
                                    >
                                        <Eye size={20} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={`${styles.viewProfileBtn} ${styles.addPhotoOverlayBtn}`}
                                        onClick={() => primaryPhotoInputRef.current?.click()}
                                        title="Add Photo"
                                    >
                                        <Plus size={22} />
                                    </button>
                                )}
                            </div>
                            <label className={styles.changePhotoBtn}>
                                {hasPrimaryPhoto ? 'Change Photo' : 'Add Photo'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handlePhotoUpload}
                                    disabled={saving}
                                    ref={primaryPhotoInputRef}
                                />
                            </label>
                        </div>

                        {/* Right Column: Fields */}
                        <div className={styles.fieldsGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Profile For</label>
                                <select
                                    name="profile_for"
                                    className={styles.select}
                                    value={formData.profile_for}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="self">Self</option>
                                    <option value="son">Son</option>
                                    <option value="daughter">Daughter</option>
                                    <option value="sister">Sister</option>
                                    <option value="brother">Brother</option>
                                    <option value="friend">Relative/Friend</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Managed By</label>
                                <select
                                    name="managed_by"
                                    className={styles.select}
                                    value={formData.managed_by}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="self">Self</option>
                                    <option value="parent">Parent</option>
                                    <option value="sibling">Sibling</option>
                                    <option value="relative">Relative</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    className={styles.input}
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    className={styles.input}
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Date of Birth</label>
                                <div className={styles.dateInputWrapper}>
                                    <input
                                        type="date"
                                        name="dob"
                                        className={styles.input}
                                        style={{ width: '100%' }}
                                        value={formData.dob}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Gender</label>
                                <select
                                    name="gender"
                                    className={styles.select}
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Height (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    className={styles.input}
                                    placeholder="e.g. 175"
                                    value={formData.height}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Marital Status</label>
                                <select
                                    name="marital_status"
                                    className={styles.select}
                                    value={formData.marital_status}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="Never Married">Never Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Awaiting Divorce">Awaiting Divorce</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Religion & Community Section */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Users size={20} color="#E31E24" />
                        Religion & Community
                    </div>
                    <div className={styles.fieldsGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Religion</label>
                            <select
                                name="religion_name"
                                className={styles.select}
                                value={formData.religion_name}
                                onChange={handleChange}
                            >
                                <option value="">Select Religion</option>
                                <option value="Hindu">Hindu</option>
                                <option value="Muslim">Muslim</option>
                                <option value="Sikh">Sikh</option>
                                <option value="Christian">Christian</option>
                                <option value="Jain">Jain</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Caste</label>
                            <input
                                type="text"
                                name="caste_name"
                                className={styles.input}
                                value={formData.caste_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Sub Caste</label>
                            <input
                                type="text"
                                name="sub_caste_name"
                                className={styles.input}
                                value={formData.sub_caste_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Mother Tongue</label>
                            <input
                                type="text"
                                name="mother_tongue"
                                className={styles.input}
                                value={formData.mother_tongue}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Manglik Status</label>
                            <div className={styles.radioGroup}>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="manglik"
                                        value="no"
                                        checked={formData.manglik === 'no'}
                                        onChange={() => handleManglikChange('no')}
                                        className={styles.radioInput}
                                    />
                                    No
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="manglik"
                                        value="yes"
                                        checked={formData.manglik === 'yes'}
                                        onChange={() => handleManglikChange('yes')}
                                        className={styles.radioInput}
                                    />
                                    Yes
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Family Details Section */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Users size={20} color="#E31E24" />
                        Family Details
                    </div>
                    <div className={styles.fieldsGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Family Type</label>
                            <select
                                name="family_type"
                                className={styles.select}
                                value={formData.family_type}
                                onChange={handleChange}
                            >
                                <option value="">Select</option>
                                <option value="Nuclear">Nuclear</option>
                                <option value="Joint">Joint</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Native City</label>
                            <input type="text" name="native_city" className={styles.input} value={formData.native_city} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Father's Occupation</label>
                            <input type="text" name="father_occupation" className={styles.input} value={formData.father_occupation} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Mother's Occupation</label>
                            <input type="text" name="mother_occupation" className={styles.input} value={formData.mother_occupation} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Brothers (Total)</label>
                            <input type="number" name="brothers_total" className={styles.input} value={formData.brothers_total} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Brothers (Married)</label>
                            <input type="number" name="brothers_married" className={styles.input} value={formData.brothers_married} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Sisters (Total)</label>
                            <input type="number" name="sisters_total" className={styles.input} value={formData.sisters_total} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Sisters (Married)</label>
                            <input type="number" name="sisters_married" className={styles.input} value={formData.sisters_married} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.label}>Family Location</label>
                            <input type="text" name="family_location" className={styles.input} value={formData.family_location} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.label}>About Family</label>
                            <textarea
                                name="about_family"
                                className={styles.input}
                                style={{ minHeight: '80px', resize: 'vertical' }}
                                value={formData.about_family}
                                onChange={(e: any) => handleChange(e as any)}
                            />
                        </div>
                    </div>
                </div>

                {/* Education & Career Section */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <GraduationCap size={20} color="#E31E24" />
                        Education & Career
                    </div>
                    <div className={styles.fieldsGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Highest Degree</label>
                            <input
                                type="text"
                                name="degree"
                                className={styles.input}
                                value={formData.degree}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Employed In</label>
                            <select
                                name="employed_in"
                                className={styles.select}
                                value={formData.employed_in}
                                onChange={handleChange}
                            >
                                <option value="">Select</option>
                                <option value="Private">Private</option>
                                <option value="Government">Government</option>
                                <option value="Business">Business</option>
                                <option value="Self-Employed">Self Employed</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Occupation</label>
                            <input
                                type="text"
                                name="occupation"
                                className={styles.input}
                                value={formData.occupation}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Physical Attributes & Income */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Users size={20} color="#E31E24" />
                        Physical & Income
                    </div>
                    <div className={styles.fieldsGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                className={styles.input}
                                placeholder="e.g. 70"
                                value={formData.weight}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Complexion</label>
                            <select name="complexion" className={styles.select} value={formData.complexion} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="Very Fair">Very Fair</option>
                                <option value="Fair">Fair</option>
                                <option value="Wheatish">Wheatish</option>
                                <option value="Dark">Dark</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Body Type</label>
                            <select name="body_type" className={styles.select} value={formData.body_type} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="Slim">Slim</option>
                                <option value="Athletic">Athletic</option>
                                <option value="Average">Average</option>
                                <option value="Heavy">Heavy</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Blood Group</label>
                            <select name="blood_group" className={styles.select} value={formData.blood_group} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Annual Income (₹)</label>
                            <input
                                type="number"
                                name="annual_income"
                                className={styles.input}
                                placeholder="e.g. 1200000"
                                value={formData.annual_income}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Location & About */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Users size={20} color="#E31E24" />
                        Location & Bio
                    </div>
                    <div className={styles.fieldsGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>City</label>
                            <input type="text" name="city" className={styles.input} value={formData.city} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>State</label>
                            <input type="text" name="state" className={styles.input} value={formData.state} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Country</label>
                            <input type="text" name="country" className={styles.input} value={formData.country} onChange={handleChange} />
                        </div>
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                        <label className={styles.label}>About Me</label>
                        <textarea
                            name="about_me"
                            className={styles.input}
                            style={{ minHeight: '100px', resize: 'vertical' }}
                            value={formData.about_me}
                            onChange={(e: any) => handleChange(e as any)}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <ImageIcon size={20} color="#E31E24" />
                        My Photos
                    </div>
                    <div className={styles.galleryGrid}>
                        {photos.map((photo, index) => (
                            <div
                                key={photo}
                                className={`${styles.galleryItem} ${draggedPhotoIndex === index ? styles.galleryItemDragging : ''}`}
                                draggable
                                onDragStart={() => setDraggedPhotoIndex(index)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async () => {
                                    if (draggedPhotoIndex === null || draggedPhotoIndex === index) {
                                        setDraggedPhotoIndex(null);
                                        return;
                                    }

                                    const reorderedPhotos = [...photos];
                                    const [movedPhoto] = reorderedPhotos.splice(draggedPhotoIndex, 1);
                                    reorderedPhotos.splice(index, 0, movedPhoto);

                                    try {
                                        await syncPhotosWithProfile(reorderedPhotos);
                                        setMessage({ type: 'success', text: 'Primary photo updated.' });
                                    } catch (e) {
                                        console.error(e);
                                        setMessage({ type: 'error', text: 'Failed to reorder photos' });
                                    } finally {
                                        setDraggedPhotoIndex(null);
                                    }
                                }}
                                onDragEnd={() => setDraggedPhotoIndex(null)}
                            >
                                <Image
                                    src={photo}
                                    alt={`Gallery ${index}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                />
                                {index === 0 && (
                                    <div className={styles.primaryPhotoBadge}>Profile Photo</div>
                                )}
                                <button
                                    type="button"
                                    className={styles.deleteBtn}
                                    onClick={async () => {
                                        if (!confirm("Delete this photo?")) return;
                                        const newPhotos = photos.filter(p => p !== photo);
                                        try {
                                            await syncPhotosWithProfile(newPhotos);
                                            setMessage({ type: 'success', text: 'Photo deleted' });
                                        } catch (e) {
                                            console.error(e);
                                            setMessage({ type: 'error', text: 'Failed to delete' });
                                        }
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <label className={styles.addPhotoCard}>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={async (e) => {
                                    if (e.target.files) {
                                        setSaving(true);
                                        try {
                                            const newUrls = [];
                                            for (let i = 0; i < e.target.files.length; i++) {
                                                const file = e.target.files[i];
                                                const filePath = `${user?.id}-${Date.now()}-${i}.${file.name.split('.').pop()}`;
                                                await supabase.storage.from('profile-photos').upload(filePath, file);
                                                const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
                                                newUrls.push(publicUrl);
                                            }
                                            const updatedPhotos = photoUrl ? [...photos, ...newUrls] : [...newUrls, ...photos];
                                            await syncPhotosWithProfile(updatedPhotos);
                                            setMessage({ type: 'success', text: 'Photos uploaded!' });
                                        } catch (err) {
                                            console.error(err);
                                        } finally {
                                            setSaving(false);
                                        }
                                    }
                                }}
                            />
                            <div style={{ fontSize: '2rem', color: '#ccc' }}>+</div>
                            <span style={{ fontSize: '0.9rem', color: '#888' }}>Add Photos</span>
                        </label>
                    </div>
                    <div className={styles.photoHint}>Drag a photo to the first position to make it your profile picture.</div>
                </div>

                <div className={styles.footerActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => router.push('/dashboard')}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.saveBtn} disabled={saving || saved}>
                        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
                    </button>
                </div>

                {/* Lightbox */}
                {showLightbox && (
                    <div className={styles.lightboxOverlay} onClick={() => setShowLightbox(false)}>
                        <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                            <button type="button" className={styles.closeLightbox} onClick={() => setShowLightbox(false)}>
                                <X size={24} />
                            </button>
                            {photoUrl ? (
                                <Image
                                    src={photoUrl}
                                    alt="Profile Full View"
                                    width={500}
                                    height={500}
                                    style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '80vh' }}
                                    unoptimized
                                />
                            ) : (
                                <div style={{ padding: '20px', color: 'white' }}>No photo available</div>
                            )}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default EditProfileForm;
