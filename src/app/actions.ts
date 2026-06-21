'use server';

import { supabase } from '@/lib/supabase';

export interface RSVPInput {
  guestName: string;
  phoneNumber: string;
  attendanceStatus: 'attending' | 'declined';
  adultsCount: number;
  childrenCount: number;
  vegCount: number;
  nonvegCount: number;
  receptionAttendance: boolean;
  parkingRequired: boolean;
  specialMessage: string;
}

export async function submitRSVP(formData: RSVPInput) {
  try {
    const phoneClean = formData.phoneNumber.replace(/\s+/g, '').trim();
    if (!formData.guestName.trim()) {
      return { success: false, error: 'Guest name is required.' };
    }
    if (!phoneClean) {
      return { success: false, error: 'Phone number is required.' };
    }

    // Format the database payload
    const isAttending = formData.attendanceStatus === 'attending';
    const payload = {
      guest_name: formData.guestName.trim(),
      phone_number: phoneClean,
      attendance_status: formData.attendanceStatus,
      adults_count: isAttending ? formData.adultsCount : 0,
      children_count: isAttending ? formData.childrenCount : 0,
      veg_count: isAttending ? formData.vegCount : 0,
      nonveg_count: isAttending ? formData.nonvegCount : 0,
      reception_attendance: isAttending ? formData.receptionAttendance : false,
      parking_required: isAttending ? formData.parkingRequired : false,
      special_message: formData.specialMessage.trim() || null,
    };

    // Check if duplicate exists
    const { data: existing, error: fetchError } = await supabase
      .from('rsvps')
      .select('id')
      .eq('phone_number', phoneClean)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return { success: false, error: `Database error: ${fetchError.message}` };
    }

    if (existing) {
      // Update existing RSVP
      const { error: updateError } = await supabase
        .from('rsvps')
        .update(payload)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return { success: false, error: `Update failed: ${updateError.message}` };
      }
      return { success: true, updated: true, message: 'Your RSVP has been updated successfully.' };
    } else {
      // Insert new RSVP
      const { error: insertError } = await supabase
        .from('rsvps')
        .insert([payload]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return { success: false, error: `Submission failed: ${insertError.message}` };
      }
      return { success: true, updated: false, message: 'Your RSVP has been confirmed.' };
    }
  } catch (err: any) {
    console.error('RSVP server action exception:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}

export async function loginAdmin(password: string) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      cookieStore.set('admin_session', adminPassword, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return { success: true };
    }
    return { success: false, error: 'Incorrect admin password.' };
  } catch (err: any) {
    console.error('Login action error:', err);
    return { success: false, error: err.message || 'Login failed.' };
  }
}

export async function logoutAdmin() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return { success: true };
  } catch (err: any) {
    console.error('Logout action error:', err);
    return { success: false };
  }
}
