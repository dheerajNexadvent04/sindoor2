import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().regex(/^\+91[0-9]{10}$/, "Invalid India phone number format (+91XXXXXXXXXX)"),
    firstName: z.string().min(2),
    lastName: z.string().min(2).optional().default(''),
    gender: z.enum(['male', 'female', 'other']).optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    profileFor: z.string().optional(),
    managedBy: z.string().optional(),
    height: z.coerce.number().optional(),
    weight: z.coerce.number().optional(),
    bodyType: z.string().optional(),
    bloodGroup: z.string().optional(),
    complexion: z.string().optional(),
    maritalStatus: z.string().optional(),
    lookingFor: z.string().optional(),
    motherTongue: z.string().optional(),
    religion: z.string().optional(),
    caste: z.string().optional(),
    subCaste: z.string().optional(),
    manglik: z.string().optional(),
    degree: z.string().optional(),
    employedIn: z.string().optional(),
    occupation: z.string().optional(),
    income: z.coerce.number().optional(),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    familyType: z.string().optional(),
    fatherOcc: z.string().optional(),
    motherOcc: z.string().optional(),
    brothersTotal: z.coerce.number().optional(),
    brothersMarried: z.coerce.number().optional(),
    sistersTotal: z.coerce.number().optional(),
    sistersMarried: z.coerce.number().optional(),
    nativeCity: z.string().optional(),
    familyLocation: z.string().optional(),
    aboutFamily: z.string().optional(),
    aboutMe: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = registerSchema.parse(body);
        const supabase = await createClient();
        const origin = new URL(request.url).origin;

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: validatedData.email,
            password: validatedData.password,
            phone: validatedData.phone,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
                data: {
                    first_name: validatedData.firstName,
                    last_name: validatedData.lastName,
                    gender: validatedData.gender,
                    date_of_birth: validatedData.dob,
                    phone: validatedData.phone,
                    profile_for: validatedData.profileFor,
                    managed_by: validatedData.managedBy,
                    looking_for: validatedData.lookingFor,
                    height: validatedData.height,
                    weight: validatedData.weight,
                    body_type: validatedData.bodyType,
                    blood_group: validatedData.bloodGroup,
                    complexion: validatedData.complexion,
                    marital_status: validatedData.maritalStatus,
                    mother_tongue: validatedData.motherTongue,
                    religion_name: validatedData.religion,
                    caste_name: validatedData.caste,
                    sub_caste_name: validatedData.subCaste,
                    manglik: validatedData.manglik,
                    degree: validatedData.degree,
                    employed_in: validatedData.employedIn,
                    occupation: validatedData.occupation,
                    annual_income: validatedData.income,
                    country: validatedData.country,
                    state: validatedData.state,
                    city: validatedData.city,
                    family_type: validatedData.familyType,
                    father_occupation: validatedData.fatherOcc,
                    mother_occupation: validatedData.motherOcc,
                    brothers_total: validatedData.brothersTotal,
                    brothers_married: validatedData.brothersMarried,
                    sisters_total: validatedData.sistersTotal,
                    sisters_married: validatedData.sistersMarried,
                    native_city: validatedData.nativeCity,
                    family_location: validatedData.familyLocation,
                    about_family: validatedData.aboutFamily,
                    about_me: validatedData.aboutMe,
                }
            }
        });

        if (authError) {
            console.error("Auth Error:", authError);
            return NextResponse.json(
                { success: false, error: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { success: false, error: "User creation failed" },
                { status: 500 }
            );
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                first_name: validatedData.firstName,
                last_name: validatedData.lastName,
                gender: validatedData.gender,
                date_of_birth: validatedData.dob,
                phone: validatedData.phone,
                profile_for: validatedData.profileFor,
                managed_by: validatedData.managedBy,
                looking_for: validatedData.lookingFor,
                height: validatedData.height,
                weight: validatedData.weight,
                body_type: validatedData.bodyType,
                blood_group: validatedData.bloodGroup,
                complexion: validatedData.complexion,
                marital_status: validatedData.maritalStatus,
                mother_tongue: validatedData.motherTongue,
                religion_name: validatedData.religion,
                caste_name: validatedData.caste,
                sub_caste_name: validatedData.subCaste,
                manglik: validatedData.manglik,
                degree: validatedData.degree,
                employed_in: validatedData.employedIn,
                occupation: validatedData.occupation,
                annual_income: validatedData.income,
                country: validatedData.country,
                state: validatedData.state,
                city: validatedData.city,
                family_type: validatedData.familyType,
                father_occupation: validatedData.fatherOcc,
                mother_occupation: validatedData.motherOcc,
                brothers_total: validatedData.brothersTotal,
                brothers_married: validatedData.brothersMarried,
                sisters_total: validatedData.sistersTotal,
                sisters_married: validatedData.sistersMarried,
                native_city: validatedData.nativeCity,
                family_location: validatedData.familyLocation,
                about_family: validatedData.aboutFamily,
                about_me: validatedData.aboutMe,
                email: validatedData.email,
                status: 'pending' // Enforce pending status until verified/approved
            })
            .eq('id', authData.user.id);

        if (profileError) {
            console.error("Profile Error:", profileError);
            return NextResponse.json(
                { success: false, error: "User created but profile setup failed: " + profileError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Registration successful. Please check your email for verification.',
            userId: authData.user.id
        });

    } catch (error: unknown) {
        console.error("Server Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Validation Error", details: error.issues },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : "Internal Server Error";

        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
