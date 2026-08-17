// Edge Function: calculate-tax
// Real-time tax calculation per transaction

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      transaction_id,
      amount,
      transaction_type,
      country_code = 'KE',
      business_wallet_id
    } = await req.json()

    // Get country tax config
    const { data: countryConfig } = await supabaseClient
      .from('country_configs')
      .select('*')
      .eq('country_code', country_code)
      .single()

    if (!countryConfig) {
      return new Response(JSON.stringify({ error: 'Country config not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const taxes = []
    let totalTax = 0

    // VAT (16% for Kenya)
    if (transaction_type === 'payment' || transaction_type === 'transfer') {
      const vatRate = countryConfig.vat_rate
      const vatAmount = Math.round(amount * vatRate * 100) / 100
      taxes.push({
        tax_type: 'vat',
        tax_rate: vatRate,
        tax_amount: vatAmount,
        taxable_amount: amount
      })
      totalTax += vatAmount
    }

    // Excise duty on fees (10%)
    const feeAmount = Math.round(amount * 0.01 * 100) / 100 // 1% platform fee
    const exciseAmount = Math.round(feeAmount * countryConfig.excise_duty_rate * 100) / 100
    taxes.push({
      tax_type: 'excise',
      tax_rate: countryConfig.excise_duty_rate,
      tax_amount: exciseAmount,
      taxable_amount: feeAmount
    })
    totalTax += exciseAmount

    // Withholding tax for merchants (5%)
    if (business_wallet_id && amount >= countryConfig.withholding_tax_threshold) {
      const whAmount = Math.round(amount * countryConfig.withholding_tax_rate * 100) / 100
      taxes.push({
        tax_type: 'withholding',
        tax_rate: countryConfig.withholding_tax_rate,
        tax_amount: whAmount,
        taxable_amount: amount
      })
      totalTax += whAmount
    }

    // Digital service tax (1.5% for digital platforms)
    if (amount >= 100000) { // KES 100k threshold
      const dstAmount = Math.round(amount * countryConfig.digital_service_tax_rate * 100) / 100
      taxes.push({
        tax_type: 'digital_service_tax',
        tax_rate: countryConfig.digital_service_tax_rate,
        tax_amount: dstAmount,
        taxable_amount: amount
      })
      totalTax += dstAmount
    }

    const netAmount = amount - totalTax

    // Store tax transaction
    for (const tax of taxes) {
      await supabaseClient.from('tax_transactions').insert({
        wallet_transaction_id: transaction_id,
        user_id: (await supabaseClient.from('wallet_transactions').select('user_id').eq('id', transaction_id).single()).data?.user_id,
        business_wallet_id,
        country_code,
        tax_type: tax.tax_type,
        taxable_amount: tax.taxable_amount,
        tax_rate: tax.tax_rate,
        tax_amount: tax.tax_amount,
        tax_base_amount: amount,
        net_amount: netAmount,
        reporting_period: new Date().toISOString().slice(0, 7) // YYYY-MM
      })
    }

    return new Response(JSON.stringify({
      success: true,
      transaction_id,
      original_amount: amount,
      total_tax: totalTax,
      net_amount: netAmount,
      taxes,
      country_code
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

