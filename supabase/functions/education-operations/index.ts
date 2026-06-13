// ============================================================
// MTAA EDUCATION OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: generate_qr, scan_qr, student_qr, teacher_qr, create_course, enroll_course, issue_certificate, update_progress
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result;
    switch (action) {
      case "generate_qr":
        result = await educationGenerateQr(supabaseAdmin, user.id, params);
        break;
      case "scan_qr":
        result = await educationScanQr(supabaseAdmin, user.id, params);
        break;
      case "student_qr":
        result = await educationStudentQr(supabaseAdmin, user.id, params);
        break;
      case "teacher_qr":
        result = await educationTeacherQr(supabaseAdmin, user.id, params);
        break;
      case "create_course":
        result = await educationCreateCourse(supabaseAdmin, user.id, params);
        break;
      case "enroll_course":
        result = await educationEnrollCourse(supabaseAdmin, user.id, params);
        break;
      case "issue_certificate":
        result = await educationIssueCertificate(supabaseAdmin, user.id, params);
        break;
      case "update_progress":
        result = await educationUpdateProgress(supabaseAdmin, user.id, params);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action: " + action }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// ACTION: GENERATE_QR
// Generate QR for education session/attendance
// ============================================================
async function educationGenerateQr(supabaseAdmin, userId, params) {
  const { session_id, class_id, lesson_id, expires_in_minutes = 30 } = params;

  if (!session_id && !class_id && !lesson_id) {
    throw new Error("Missing session_id, class_id, or lesson_id");
  }

  const qrId = `EDU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + expires_in_minutes * 60000);

  const qrData = {
    id: qrId,
    type: "education_session",
    session_id: session_id,
    class_id: class_id,
    lesson_id: lesson_id,
    generated_by: userId,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString()
  };

  const { data: qrRecord } = await supabaseAdmin
    .from("education_qr_sessions")
    .insert({
      session_id: session_id,
      class_id: class_id,
      lesson_id: lesson_id,
      generated_by: userId,
      qr_data: qrData,
      expires_at: expiresAt.toISOString(),
      status: "active"
    })
    .select()
    .single();

  return {
    success: true,
    qr: {
      id: qrId,
      data: qrData,
      expires_at: expiresAt.toISOString(),
      record_id: qrRecord.id
    },
    message: `Education QR generated. Valid for ${expires_in_minutes} minutes.`
  };
}

// ============================================================
// ACTION: SCAN_QR
// Student scans QR to mark attendance
// ============================================================
async function educationScanQr(supabaseAdmin, userId, params) {
  const { qr_data } = params;

  if (!qr_data) {
    throw new Error("Missing qr_data");
  }

  let parsedData;
  try {
    parsedData = typeof qr_data === "string" ? JSON.parse(qr_data) : qr_data;
  } catch (e) {
    throw new Error("Invalid QR data");
  }

  // Verify QR is active and not expired
  const { data: qrSession } = await supabaseAdmin
    .from("education_qr_sessions")
    .select("*")
    .eq("qr_data->>id", parsedData.id)
    .eq("status", "active")
    .single();

  if (!qrSession) {
    throw new Error("QR session not found or expired");
  }

  const now = new Date();
  const expiresAt = new Date(qrSession.expires_at);
  if (now > expiresAt) {
    await supabaseAdmin
      .from("education_qr_sessions")
      .update({ status: "expired" })
      .eq("id", qrSession.id);
    throw new Error("QR session has expired");
  }

  // Mark attendance
  const { data: attendance } = await supabaseAdmin
    .from("education_attendance")
    .insert({
      student_id: userId,
      session_id: qrSession.session_id,
      class_id: qrSession.class_id,
      lesson_id: qrSession.lesson_id,
      marked_at: new Date().toISOString(),
      method: "qr_scan",
      qr_session_id: qrSession.id
    })
    .select()
    .single();

  return {
    success: true,
    attendance: {
      id: attendance.id,
      session_id: attendance.session_id,
      marked_at: attendance.marked_at
    },
    message: "Attendance marked successfully via QR scan."
  };
}

// ============================================================
// ACTION: STUDENT_QR
// Generate student identity QR
// ============================================================
async function educationStudentQr(supabaseAdmin, userId, params) {
  const { student_id } = params;

  const targetId = student_id || userId;

  // Get student details
  const { data: student } = await supabaseAdmin
    .from("education_students")
    .select("*, education_institutions(name)")
    .eq("user_id", targetId)
    .single();

  if (!student) {
    throw new Error("Student not found");
  }

  const qrData = {
    type: "student_identity",
    student_id: student.id,
    user_id: targetId,
    name: student.full_name,
    institution: student.education_institutions?.name,
    admission_number: student.admission_number,
    class_id: student.class_id,
    generated_at: new Date().toISOString()
  };

  // Store/update QR
  await supabaseAdmin
    .from("education_students")
    .update({ qr_code: qrData })
    .eq("id", student.id);

  return {
    success: true,
    qr: qrData,
    message: "Student identity QR generated."
  };
}

// ============================================================
// ACTION: TEACHER_QR
// Generate teacher identity QR
// ============================================================
async function educationTeacherQr(supabaseAdmin, userId, params) {
  const { teacher_id } = params;

  const targetId = teacher_id || userId;

  // Get teacher details
  const { data: teacher } = await supabaseAdmin
    .from("education_teachers")
    .select("*, education_institutions(name)")
    .eq("user_id", targetId)
    .single();

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const qrData = {
    type: "teacher_identity",
    teacher_id: teacher.id,
    user_id: targetId,
    name: teacher.full_name,
    institution: teacher.education_institutions?.name,
    employee_id: teacher.employee_id,
    subjects: teacher.subjects,
    generated_at: new Date().toISOString()
  };

  // Store/update QR
  await supabaseAdmin
    .from("education_teachers")
    .update({ qr_code: qrData })
    .eq("id", teacher.id);

  return {
    success: true,
    qr: qrData,
    message: "Teacher identity QR generated."
  };
}

// ============================================================
// ACTION: CREATE_COURSE
// Create a new course
// ============================================================
async function educationCreateCourse(supabaseAdmin, userId, params) {
  const { institution_id, title, description, subject_id, teacher_id, start_date, end_date, capacity, fee } = params;

  if (!institution_id || !title) {
    throw new Error("Missing institution_id or title");
  }

  // Verify teacher
  const { data: teacher } = await supabaseAdmin
    .from("education_teachers")
    .select("id")
    .eq("user_id", userId)
    .single();

  const { data: course } = await supabaseAdmin
    .from("education_courses")
    .insert({
      institution_id: institution_id,
      title: title,
      description: description,
      subject_id: subject_id,
      teacher_id: teacher_id || teacher?.id,
      created_by: userId,
      start_date: start_date,
      end_date: end_date,
      capacity: capacity,
      fee: fee || 0,
      status: "active",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    course: {
      id: course.id,
      title: course.title,
      status: course.status
    },
    message: `Course "${title}" created successfully.`
  };
}

// ============================================================
// ACTION: ENROLL_COURSE
// Student enrolls in a course
// ============================================================
async function educationEnrollCourse(supabaseAdmin, userId, params) {
  const { course_id } = params;

  if (!course_id) {
    throw new Error("Missing course_id");
  }

  // Get course
  const { data: course } = await supabaseAdmin
    .from("education_courses")
    .select("*, education_institutions(name)")
    .eq("id", course_id)
    .single();

  if (!course) throw new Error("Course not found");

  // Check if already enrolled
  const { data: existing } = await supabaseAdmin
    .from("education_enrollments")
    .select("id")
    .eq("course_id", course_id)
    .eq("student_id", userId)
    .single();

  if (existing) {
    throw new Error("Already enrolled in this course");
  }

  // Check capacity
  const { count } = await supabaseAdmin
    .from("education_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("course_id", course_id);

  if (count >= course.capacity) {
    throw new Error("Course is full");
  }

  // If fee required, process payment
  if (course.fee > 0) {
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", userId)
      .eq("wallet_type", "main")
      .single();

    if (!wallet || wallet.available_balance < course.fee) {
      throw new Error(`Insufficient balance. Course fee: KES ${course.fee}`);
    }

    // Debit student
    await supabaseAdmin
      .from("wallets")
      .update({ available_balance: wallet.available_balance - course.fee })
      .eq("id", wallet.id);

    // Credit institution
    const { data: instWallet } = await supabaseAdmin
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", course.institution_id)
      .eq("wallet_type", "main")
      .single();

    if (instWallet) {
      await supabaseAdmin
        .from("wallets")
        .update({ available_balance: instWallet.available_balance + course.fee })
        .eq("id", instWallet.id);
    }
  }

  // Enroll
  const { data: enrollment } = await supabaseAdmin
    .from("education_enrollments")
    .insert({
      course_id: course_id,
      student_id: userId,
      enrolled_at: new Date().toISOString(),
      status: "active",
      fee_paid: course.fee || 0
    })
    .select()
    .single();

  return {
    success: true,
    enrollment: {
      id: enrollment.id,
      course_id: enrollment.course_id,
      status: enrollment.status,
      fee_paid: enrollment.fee_paid
    },
    message: `Enrolled in "${course.title}" successfully.`
  };
}

// ============================================================
// ACTION: ISSUE_CERTIFICATE
// Issue completion certificate
// ============================================================
async function educationIssueCertificate(supabaseAdmin, userId, params) {
  const { enrollment_id, grade, completion_date } = params;

  if (!enrollment_id) {
    throw new Error("Missing enrollment_id");
  }

  // Verify teacher/admin
  const { data: teacher } = await supabaseAdmin
    .from("education_teachers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!teacher) {
    throw new Error("Only teachers can issue certificates");
  }

  // Get enrollment
  const { data: enrollment } = await supabaseAdmin
    .from("education_enrollments")
    .select("*, education_courses(title, institution_id)")
    .eq("id", enrollment_id)
    .single();

  if (!enrollment) throw new Error("Enrollment not found");

  const certId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { data: certificate } = await supabaseAdmin
    .from("education_certificates")
    .insert({
      enrollment_id: enrollment_id,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      institution_id: enrollment.education_courses.institution_id,
      issued_by: userId,
      certificate_number: certId,
      grade: grade,
      completion_date: completion_date || new Date().toISOString(),
      status: "issued",
      issued_at: new Date().toISOString()
    })
    .select()
    .single();

  // Update enrollment
  await supabaseAdmin
    .from("education_enrollments")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", enrollment_id);

  // Notify student
  await supabaseAdmin.from("notifications").insert({
    user_id: enrollment.student_id,
    actor_id: userId,
    type: "certificate_issued",
    post_id: certificate.id,
    is_read: false
  });

  return {
    success: true,
    certificate: {
      id: certificate.id,
      certificate_number: certificate.certificate_number,
      grade: certificate.grade,
      issued_at: certificate.issued_at
    },
    message: `Certificate issued for "${enrollment.education_courses.title}".`
  };
}

// ============================================================
// ACTION: UPDATE_PROGRESS
// Update student progress in a course
// ============================================================
async function educationUpdateProgress(supabaseAdmin, userId, params) {
  const { enrollment_id, lesson_id, progress_percent, completed } = params;

  if (!enrollment_id || !lesson_id) {
    throw new Error("Missing enrollment_id or lesson_id");
  }

  const { data: progress } = await supabaseAdmin
    .from("education_progress")
    .upsert({
      enrollment_id: enrollment_id,
      student_id: userId,
      lesson_id: lesson_id,
      progress_percent: progress_percent || 0,
      completed: completed || false,
      last_accessed: new Date().toISOString()
    }, {
      onConflict: "enrollment_id,lesson_id"
    })
    .select()
    .single();

  return {
    success: true,
    progress: {
      id: progress.id,
      enrollment_id: progress.enrollment_id,
      lesson_id: progress.lesson_id,
      progress_percent: progress.progress_percent,
      completed: progress.completed
    },
    message: "Progress updated successfully."
  };
}
