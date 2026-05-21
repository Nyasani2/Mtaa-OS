import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { policeCaseId } = await req.json()

    // 1. Validate police case
    const { data: policeCase, error: caseError } = await supabase
      .from('police_cases')
      .select('*')
      .eq('id', policeCaseId)
      .single()

    if (caseError || !policeCase) {
      return new Response(JSON.stringify({ error: 'Police case not found' }), { status: 404 })
    }

    if (policeCase.status !== 'ready_for_prosecution') {
      return new Response(JSON.stringify({ error: 'Case not ready for court' }), { status: 400 })
    }

    // 2. Find court jurisdiction in same county
    const { data: courtJurisdiction } = await supabase
      .from('civic_jurisdictions')
      .select('id')
      .eq('country_id', policeCase.country_id)
      .eq('department_id', (await supabase.from('civic_departments').select('id').eq('code', 'COURTS').single()).data.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!courtJurisdiction) {
      return new Response(JSON.stringify({ error: 'No active court jurisdiction found' }), { status: 400 })
    }

    // 3. Create court case
    const { data: courtCase, error: createError } = await supabase
      .from('court_cases')
      .insert({
        jurisdiction_id: courtJurisdiction.id,
        police_case_id: policeCase.id,
        police_station_id: policeCase.station_id,
        case_number: `C-${policeCase.case_number}`,
        title: policeCase.title || policeCase.description?.substring(0, 100) || 'Case from Police',
        description: policeCase.description,
        case_type: 'criminal',
        status: 'filed',
        metadata: {
          police_case_number: policeCase.case_number,
          police_officer_id: policeCase.assigned_officer_id,
          incident_location: policeCase.incident_location,
          priority: policeCase.priority
        }
      })
      .select()
      .single()

    if (createError) throw createError

    // 4. Update police case
    await supabase
      .from('police_cases')
      .update({
        court_case_id: courtCase.id,
        handoff_status: 'submitted',
        handoff_at: new Date().toISOString(),
        status: 'in_court'
      })
      .eq('id', policeCaseId)

    // 5. Log the handoff
    await supabase.from('civic_audit_log').insert({
      module: 'civic',
      action: 'police_to_court_handoff',
      actor_id: policeCase.reporting_officer_id || 'system',
      actor_role: 'officer',
      resource_id: policeCaseId,
      resource_type: 'police_case',
      before_state: { status: policeCase.status },
      after_state: { court_case_id: courtCase.id, status: 'in_court' },
      timestamp: Date.now(),
      immutable_hash: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${policeCaseId}-${Date.now()}`)).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
    })

    return new Response(JSON.stringify({ 
      success: true, 
      court_case_id: courtCase.id,
      case_number: courtCase.case_number 
    }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
