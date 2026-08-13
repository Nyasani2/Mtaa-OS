// @ts-nocheck
export async function createElection(params: any) {
  const { data, error } = await supabase.from('elections').insert({
    title: params.title,
    description: params.description,
    start_date: params.start_date,
    end_date: params.end_date,
    type: params.type,
    status: 'draft',
    created_by: params.created_by,
    administered_by: [params.created_by],
    country_code: 'KE',
    minimum_age: 18,
    requires_verification: true,
    eligibility_rules: params.eligibility_rules || {},
  }).select().single();
  if (error) throw error;
  return data;
}

export async function createReferendum(params: any) {
  const { data, error } = await supabase.from('referendums').insert({
    title: params.title,
    description: params.description,
    start_date: params.start_date,
    end_date: params.end_date,
    type: params.type,
    status: 'draft',
    created_by: params.created_by,
    administered_by: [params.created_by],
    country_code: 'KE',
    minimum_age: 18,
    requires_verification: true,
    eligibility_rules: params.eligibility_rules || {},
  }).select().single();
  if (error) throw error;
  return data;
}
