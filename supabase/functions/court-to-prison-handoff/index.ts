import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { judgmentId } = await req.json()

    // 1. Get judgment with case
    const { data: judgment, error: judgmentError } = await supabase
      .from('court_judgments')
      .select('*, case:court_cases(*)')
      .eq('id', judgmentId)
      .single()

    if (judgmentError || !judgment) {
      return new Response(JSON.stringify({ error: 'Judgment not found' }), { status: 404 })
    }

    if (!judgment.prison_sentence_months) {
      return new Response(JSON.stringify({ error: 'No prison sentence in judgment' }), { status: 400 })
    }

    // 2. Find nearest prison facility
    const { data: facilities } = await supabase
      .from('prison_facilities')
      .select('*')
      .eq('jurisdiction_id', judgment.case.jurisdiction_id)
      .eq('type', judgment.prison_sentence_months > 120 ? 'maximum_security' : 'medium_security')
      .order('current_population', { ascending: true })
      .limit(1)

    const facility = facilities?.[0]
    if (!facility) {
      return new Response(JSON.stringify({ error: 'No prison facility available' }), { status: 400 })
    }

    // 3. Get defendant name from parties
    const { data: defendant } = await supabase
      .from('court_parties')
      .select('full_name')
      .eq('case_id', judgment.case.id)
      .eq('party_type', 'defendant')
      .limit(1)
      .single()

    // 4. Create inmate record
    const sentenceEnd = new Date()
    sentenceEnd.setMonth(sentenceEnd.getMonth() + judgment.prison_sentence_months)

    const { data: inmate, error: inmateError } = await supabase
      .from('prison_inmates')
      .insert({
        jurisdiction_id: judgment.case.jurisdiction_id,
        facility_id: facility.id,
        court_case_id: judgment.case.id,
        court_judgment_id: judgment.id,
        inmate_number: `P-${judgment.case.case_number}`,
        full_name: defendant?.full_name || 'Unknown',
        sentence_type: 'convicted',
        sentence_start: new Date().toISOString().split('T')[0],
        sentence_length_months: judgment.prison_sentence_months,
        sentence_end: sentenceEnd.toISOString().split('T')[0],
        status: 'admitted'
      })
      .select()
      .single()

    if (inmateError) throw inmateError

    // 5. Update judgment
    await supabase
      .from('court_judgments')
      .update({
        prison_intake_id: inmate.id,
        prison_handoff_status: 'submitted'
      })
      .eq('id', judgmentId)

    // 6. Update facility population
    await supabase
      .from('prison_facilities')
      .update({ current_population: facility.current_population + 1 })
      .eq('id', facility.id)

    // 7. Create movement record
    await supabase.from('prison_movements').insert({
      inmate_id: inmate.id,
      to_facility_id: facility.id,
      movement_type: 'admission',
      reason: `Sentence from case ${judgment.case.case_number}`,
      occurred_at: new Date().toISOString()
    })

    // 8. Log
    await supabase.from('civic_audit_log').insert({
      module: 'civic',
      action: 'court_to_prison_handoff',
      actor_id: judgment.judge_id || 'system',
      actor_role: 'judge',
      resource_id: judgmentId,
      resource_type: 'court_judgment',
      before_state: { prison_handoff_status: 'none' },
      after_state: { prison_intake_id: inmate.id, prison_handoff_status: 'submitted' },
      timestamp: Date.now(),
      immutable_hash: 'hash-placeholder'
    })

    return new Response(JSON.stringify({ 
      success: true, 
      inmate_id: inmate.id,
      inmate_number: inmate.inmate_number,
      facility_id: facility.id
    }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
