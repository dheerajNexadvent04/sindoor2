"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, Users, GraduationCap, X, Image as ImageIcon, Printer } from 'lucide-react';
// Reuse styles from EditProfile for consistency, or copy them if needed. 
// Assuming we can reuse the module or similar class names.
// For now, let's use tailwind classes for admin panel to keep it consistent with admin theme.
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AdminProfileFormData = {
    [key: string]: string;
};

type InputGroupProps = {
    label: string;
    name: string;
    type?: string;
    options?: string[] | null;
};

export default function AdminUserDetails({ userId }: { userId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [photos, setPhotos] = useState<string[]>([]);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const supabase = createClient();

    // Form State (Same as EditProfile)
    const [formData, setFormData] = useState<AdminProfileFormData>({
        // Initialize with defaults to avoid uncontrolled inputs
        first_name: '', last_name: '', dob: '', gender: '', height: '', weight: '',
        marital_status: '', mother_tongue: '', religion_name: '', caste_name: '', sub_caste_name: '',
        manglik: 'no', degree: '', occupation: '', employed_in: '', annual_income: '',
        complexion: '', body_type: '', blood_group: '', about_me: '',
        city: '', state: '', country: '',
        profile_for: '', managed_by: '', family_type: '',
        father_occupation: '', mother_occupation: '',
        brothers_total: '', brothers_married: '',
        sisters_total: '', sisters_married: '',
        native_city: '', family_location: '', about_family: '',
        status: 'pending' // Admin specific
    });

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setPhotoUrl(data.photo_url);
                setPhotos(data.photos || []);
                setFormData({ 
                    ...data, 
                    dob: data.date_of_birth || '', // Map DB field to form field
                    status: data.status || 'pending' 
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const updates = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
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
                profile_for: formData.profile_for,
                managed_by: formData.managed_by,
                family_type: formData.family_type,
                father_occupation: formData.father_occupation,
                mother_occupation: formData.mother_occupation,
                brothers_total: formData.brothers_total ? parseInt(formData.brothers_total, 10) : 0,
                brothers_married: formData.brothers_married ? parseInt(formData.brothers_married, 10) : 0,
                sisters_total: formData.sisters_total ? parseInt(formData.sisters_total, 10) : 0,
                sisters_married: formData.sisters_married ? parseInt(formData.sisters_married, 10) : 0,
                native_city: formData.native_city,
                family_location: formData.family_location,
                about_family: formData.about_family,
                photo_url: photoUrl,
                photos,
                status: formData.status,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
            setMessage({ type: 'success', text: 'User profile updated successfully!' });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading user details...</div>;

    const InputGroup = ({ label, name, type = "text", options = null }: InputGroupProps) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {options ? (
                <select
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                >
                    <option value="">Select</option>
                    {options.map((opt: string) => (
                        <option key={opt} value={opt}>
                            {opt === 'friend' ? 'Relative/Friend' : 
                             opt === 'self' ? 'Self' :
                             opt === 'parent' ? 'Parent' :
                             opt === 'sibling' ? 'Sibling' :
                             opt === 'relative' ? 'Relative' :
                             opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                />
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 border-b pb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 leading-tight">
                    <User className="text-red-600" />
                    Edit User: {formData.first_name} {formData.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Link
                        href={`/admin/users/${userId}/print`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
                    >
                        <Printer size={16} />
                        Print Details
                    </Link>
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 self-end sm:self-auto">
                        <X />
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Panel: Status & Photo */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h3 className="font-semibold mb-3">Account Status</h3>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={`w-full p-2 rounded font-bold ${formData.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        formData.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                    }`}
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="deactivated">Deactivated</option>
                            </select>
                        </div>

                        <div className="text-center">
                            <div className="relative w-36 h-36 sm:w-48 sm:h-48 mx-auto rounded-lg overflow-hidden border-2 border-gray-200 mb-2">
                                {photoUrl ? (
                                    <Image src={photoUrl} alt="Profile" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-gray-100">
                                        <User size={64} className="text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Main Profile Photo</p>
                        </div>

                        {/* Gallery Management */}
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><ImageIcon size={16} /> Gallery</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {photos.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square border rounded overflow-hidden group">
                                        <Image src={url} alt="Gallery" fill className="object-cover" unoptimized />
                                        <button
                                            type="button"
                                            className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={async () => {
                                                if (!confirm("Delete this photo?")) return;
                                                const newPhotos = photos.filter(p => p !== url);
                                                const nextPrimaryPhoto = newPhotos[0] || null;
                                                setPhotos(newPhotos);
                                                setPhotoUrl(nextPrimaryPhoto);
                                                // Update DB immediately
                                                await supabase.from('profiles').update({ photos: newPhotos, photo_url: nextPrimaryPhoto }).eq('id', userId);
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Form Fields */}
                    <div className="col-span-2 space-y-8">
                        {/* Personal Info */}
                        <section>
                            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                                <User size={20} /> Personal Info
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputGroup label="First Name" name="first_name" />
                                <InputGroup label="Last Name" name="last_name" />
                                <InputGroup label="Date of Birth" name="dob" type="date" />
                                <InputGroup label="Gender" name="gender" options={['male', 'female']} />
                                <InputGroup label="Height (cm)" name="height" type="number" />
                                <InputGroup label="Weight (kg)" name="weight" type="number" />
                                <InputGroup label="Marital Status" name="marital_status" options={['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce']} />
                                <InputGroup label="Profile For" name="profile_for" options={['self', 'son', 'daughter', 'brother', 'sister', 'friend', 'other']} />
                                <InputGroup label="Managed By" name="managed_by" options={['self', 'parent', 'sibling', 'relative']} />
                                <InputGroup label="Phone" name="phone" />
                                <InputGroup label="Email" name="email" type="email" />
                            </div>
                        </section>

                        {/* Religion */}
                        <section>
                            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                                <Users size={20} /> Religion & Community
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputGroup label="Religion" name="religion_name" options={['Hindu', 'Sikh', 'Christian', 'Jain', 'Other']} />
                                <InputGroup label="Caste" name="caste_name" />
                                <InputGroup label="Sub Caste" name="sub_caste_name" />
                                <InputGroup label="Manglik" name="manglik" options={['no', 'yes', 'anshik']} />
                            </div>
                        </section>

                        {/* Family */}
                        <section>
                            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                                <Users size={20} /> Family Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputGroup label="Family Type" name="family_type" options={['Nuclear', 'Joint']} />
                                <InputGroup label="Father's Occ." name="father_occupation" />
                                <InputGroup label="Mother's Occ." name="mother_occupation" />
                                <InputGroup label="Native City" name="native_city" />
                            </div>
                        </section>

                        {/* Education & Career */}
                        <section>
                            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                                <GraduationCap size={20} /> Education & Career
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputGroup label="Degree" name="degree" />
                                <InputGroup label="Employed In" name="employed_in" options={['Private', 'Government', 'Business', 'Self-Employed']} />
                                <InputGroup label="Occupation" name="occupation" />
                                <InputGroup label="Annual Income" name="annual_income" type="number" />
                            </div>
                        </section>

                        {/* Location */}
                        <section>
                            <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                                <Users size={20} /> Location
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputGroup label="City" name="city" />
                                <InputGroup label="State" name="state" />
                                <InputGroup label="Country" name="country" />
                            </div>
                        </section>

                        {/* About */}
                        <section>
                            <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                            <textarea
                                name="about_me"
                                value={formData.about_me}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded h-24"
                            />
                        </section>

                        {/* Submit */}
                        <div className="pt-4 border-t flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border rounded text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 w-full sm:w-auto"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
